## Context

Cada integração de marketplace vive em seu próprio módulo, com repositório de token e schema próprios — não há um "token model" compartilhado:

| Integração | Model | Campo(s) de expiração |
|---|---|---|
| Bling | `BlingModel` | `expires_at` (único, cobre access token) |
| Mercado Livre | `MercadoLivreTokenModel` | `expires_at` |
| Shopee | `ShopeeTokenModel` | `expires_at` (nullable) |
| Tray | `TrayTokenModel` | `date_expiration_access_token` **e** `date_expiration_refresh_token` (separados) |

Cada integração também expõe apenas 1 conta "ativa" por vez (`active: boolean`), então "status da integração" é, na prática, "status do token ativo daquela integração".

Do lado de eventos, `EventModel` (tabela `events`) registra 1 linha por pedido processado via webhook do Bling, com `cigam_sincronizado: boolean`. Falhas de integração com o CIGAM (`webhookService.processarPedidoCriado`, linha ~271) hoje só vão para `logger.error`, nunca para o banco — não há coluna de erro nem contador de tentativas.

O funil operacional que queremos resumir atravessa 3 tabelas sem nenhuma junção hoje: `events.cigam_sincronizado` (pedido → CIGAM), `pedidos.status_nfe` (CIGAM → NF-e faturada/pendente) e `notas_fiscais_cigam.enviado_marketplace` (NF-e → marketplace).

## Goals / Non-Goals

**Goals:**
- Consolidar, em um único endpoint, o status de expiração de token de cada integração de marketplace ativa, mesmo com schemas de token divergentes entre módulos.
- Persistir falhas reais de sincronização pedido→CIGAM em `events`, distinguindo-as de pendências apenas recentes.
- Agregar o funil pedido→CIGAM→NF-e→marketplace em um endpoint único, evitando que o frontend precise buscar e cruzar 3 recursos.
- Manter compatibilidade com os consumidores atuais de `EventModel`/`EventDTO` (`cigam_sincronizado` continua existindo e com o mesmo significado).

**Non-Goals:**
- Não inclui as telas do Dashboard/Eventos no frontend — este design cobre apenas os endpoints e a persistência que os alimentarão. A UI é uma change companion no `Chocmaster-Frontend`.
- Não implementa retry automático das falhas de sincronização — `retry_count` é registrado para visibilidade, mas o reprocessamento continua sendo o fluxo manual/webhook já existente.
- Não adiciona monitoramento de token para além do que já é lido no banco local (não faz chamada ativa à API de cada marketplace só para checar validade do token — usa a data de expiração já armazenada).

## Decisions

**1. Endpoint de saúde de integrações lê direto dos repositórios existentes, sem tabela nova.**
Em vez de duplicar dados de token em uma tabela `integration_health`, um novo serviço (`IntegrationHealthService`, módulo novo `integrations`) injeta os repositórios de token já existentes (`BlingRepository`, `MercadoLivreTokenRepository`, `ShopeeTokenRepository`, `TrayTokenRepository`), busca o token ativo de cada um e mapeia para um DTO comum:
```ts
interface IntegrationHealthDTO {
  integration: 'bling' | 'mercado_livre' | 'shopee' | 'tray';
  connected: boolean;              // existe token ativo?
  status: 'ok' | 'expiring_soon' | 'expired';
  accessTokenExpiresAt: string | null;
  refreshTokenExpiresAt: string | null; // null quando a integração não separa os dois (Bling/ML/Shopee)
}
```
Alternativa considerada: tabela própria de "última verificação de saúde" atualizada por um job. Rejeitada por agora — adiciona um novo processo periódico e uma fonte de verdade duplicada para um dado que já existe e é barato de ler on-demand (poucas linhas, 1 por integração).

**2. Limiar `expiring_soon` configurável por integração via constante no serviço, não `.env`.**
Bling/ML/Shopee expiram em horas; Tray em até 3h de access token e 30 dias de refresh token. Um único threshold global (ex.: "expira em < 24h") faria sentido para o access token de todas, mas o refresh token da Tray precisa de um threshold em dias. O serviço aplica: access token → alerta se faltam menos de 2h; refresh token (só Tray) → alerta se faltam menos de 5 dias. Alternativa considerada: expor os thresholds via variável de ambiente — descartada por ser complexidade prematura para 2 constantes que não mudam por ambiente.

**3. Falha de sync é registrada no próprio `EventModel`, com 3 colunas novas, não uma tabela de log separada.**
Adicionar `sync_status` (`pendente` | `sincronizado` | `falha`), `error_message` (`TEXT`, nullable) e `retry_count` (`INTEGER`, default 0) via migration em `events`. `cigam_sincronizado` é mantido e passa a ser derivado/sincronizado com `sync_status === 'sincronizado'` nas escritas (não removido, para não quebrar leitores atuais — inclusive `EventsSection.tsx` no frontend). Alternativa considerada: tabela `sync_failures` separada, 1:N com `events` (histórico de todas as tentativas). Rejeitada por agora — o caso de uso é "saber se está falhando agora e por quê", não auditoria histórica de cada tentativa; `retry_count` incrementado in-place cobre isso com uma migration bem mais simples.

**4. `webhookService.processarPedidoCriado` passa a chamar `eventService.markSyncFailure(eventId, error.message)` no catch da integração CIGAM (linha ~271-273), em vez de só `logger.error`.**
Isso incrementa `retry_count` e grava `error_message` sempre que a chamada `cigamPedidoService` lançar. Quando a reintegração (linha ~78, "Pedido já existe mas não foi integrado ao CIGAM. Reintegrando...") tiver sucesso, `sync_status` volta para `sincronizado` e `error_message` é limpo — o registro sempre reflete o estado mais recente, não um histórico.

**5. Resumo do funil (`sync-pipeline-summary`) é uma agregação (`COUNT`/`GROUP BY`) feita em SQL via repositório, não em memória no service.**
Com o volume de `pedidos`/`events` podendo crescer, trazer todas as linhas para agregar em JS não escala. O repositório de cada módulo (`EventRepository`, `PedidoRepository`, `NotasFiscaisCigamRepository`) ganha um método de contagem agregada (`countBySyncStatus`, `countByStatusNfe`, `countByEnviadoMarketplace`); o serviço novo (`SyncPipelineSummaryService`) só combina os 3 resultados.

## Risks / Trade-offs

- **[Risco] Divergência de semântica entre integrações** (Tray tem 2 expirações, as outras têm 1) pode confundir quem consome o endpoint → **Mitigação**: `refreshTokenExpiresAt` explicitamente `null` quando não aplicável, documentado no spec da capability.
- **[Risco] Migration em `events` é uma tabela com potencial de estar sob uso ativo em produção (webhooks chegando o tempo todo)** → **Mitigação**: colunas novas são `nullable`/`default`, sem backfill obrigatório; `sync_status` pode ser preenchido lazy (default `'pendente'`, atualizado no próximo evento que tocar aquele registro) ou via backfill simples a partir de `cigam_sincronizado` existente (`true` → `sincronizado`, `false` → `pendente`) — decisão de detalhe fica para `tasks.md`.
- **[Trade-off] Sem histórico de tentativas** (decisão 3) — se for preciso auditar "todas as vezes que esse pedido falhou", este design não serve; só responde "está falhando agora, há quantas tentativas, e qual foi o último erro". Aceitável para o objetivo de triagem operacional definido no proposal.
- **[Risco] Endpoint de saúde de integrações depende de 4 módulos diferentes injetados num serviço novo** — acopla o módulo novo a mudanças de schema em qualquer um dos 4. Mitigação: cada leitura é isolada em um mapper próprio (`mapBlingToken`, `mapTrayToken`, etc.) dentro do `IntegrationHealthService`, então uma mudança em um módulo só quebra o mapper daquela integração, não os outros.

## Migration Plan

1. Migration Sequelize: adicionar `sync_status`, `error_message`, `retry_count` em `events` (nullable/default, sem downtime).
2. Backfill simples (script ou parte da própria migration): `sync_status = 'sincronizado'` onde `cigam_sincronizado = true`, `'pendente'` caso contrário.
3. Implementar `EventService.markSyncFailure`/`markSyncSuccess` e plugar no `webhookService` (troca do `catch` que só loga).
4. Implementar `IntegrationHealthService` + endpoint `GET /api/v1/integrations/health`.
5. Implementar `SyncPipelineSummaryService` + endpoint (rota a definir em `tasks.md`).
6. Nenhuma rota antiga é removida — rollback é apenas reverter a migration (colunas novas) e as rotas novas, já que nada existente foi alterado em formato.

## Open Questions

- Onde vive o endpoint de saúde de integrações: módulo novo `integrations`, ou dentro de `configuracoes` (que já parece ser onde fica "estado geral do sistema" no frontend)? A decidir em `tasks.md`/implementação.
- O `retry_count` deve ter um teto que marque o evento como "falha permanente" (ex.: > 5 tentativas) para diferenciar de "ainda tentando"? Fica como refinamento possível, não obrigatório para o MVP deste change.
- A rota do resumo do funil fica em `/pedidos/sync-summary` (junto do módulo pedido) ou em um novo módulo de "dashboard/analytics" que futuramente pode agregar as Linhas A/B da exploração original (vendas, marketplace)? Recomendo o módulo novo, pensando em não sobrecarregar `pedido` com responsabilidade de agregação cross-módulo — mas fica aberto para quem implementar.
