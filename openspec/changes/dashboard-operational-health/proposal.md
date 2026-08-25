## Why

O Dashboard hoje só mede cobertura de De-Para (Bling ↔ CIGAM) — não diz nada sobre a saúde operacional da integração. Duas lacunas concretas motivam esta mudança:

1. As 4 integrações de marketplace (Bling, Mercado Livre, Shopee, Tray) guardam `date_expiration_access_token`/`date_expiration_refresh_token` no banco, mas nenhuma tela expõe isso. Um refresh_token expirado (ex.: Tray, 30 dias) para a integração silenciosamente — só vira sintoma (pedidos param de chegar) muito depois da causa.
2. Quando a integração de um pedido com o CIGAM falha (`webhookService.processarPedidoCriado`), o erro vai só para o `logger` e o registro em `events` permanece `cigam_sincronizado: false` — indistinguível de um pedido que simplesmente ainda está na fila. Não há como hoje perguntar ao sistema "quais pendências são falhas reais vs. apenas recentes".

Sem esses dois sinais, times de operação só descobrem problema de integração quando o impacto já apareceu no negócio (pedido não fatura, cliente reclama).

## What Changes

- Novo endpoint `GET /api/v1/integrations/health` que consolida, para cada integração OAuth (Bling, Mercado Livre, Shopee, Tray), o status do token ativo: válido / expirando em breve / expirado, com as datas de expiração de access e refresh token.
- Novo endpoint `GET /api/v1/pedidos/sync-summary` (ou equivalente) que agrega, a partir de `events`, `pedidos` e `notas_fiscais_cigam`, os totais do funil operacional: pedidos recebidos → sincronizados no CIGAM → NF-e faturada → NF-e enviada ao marketplace, incluindo contagem de pendências por etapa.
- Persistência de falhas de sincronização: `events` passa a registrar `sync_status` (`pendente` | `sincronizado` | `falha`), `error_message` e `retry_count` quando `processarPedidoCriado` falhar ao integrar com o CIGAM, em vez de só logar. **BREAKING**: consumidores atuais do modelo `EventModel`/`EventDTO` que dependem apenas do booleano `cigam_sincronizado` continuam funcionando (campo mantido), mas passam a conviver com os novos campos.
- Endpoint de eventos passa a aceitar filtro por `sync_status=falha` para listar apenas pendências que realmente falharam (não apenas as recentes).

## Capabilities

### New Capabilities
- `integration-token-health`: consulta consolidada do status de expiração dos tokens OAuth das integrações de marketplace (Bling, Mercado Livre, Shopee, Tray).
- `sync-pipeline-summary`: agregação do funil operacional pedido → sincronização CIGAM → faturamento → envio ao marketplace, com contagem de pendências por etapa.
- `events`: capability ainda sem spec formal hoje. Este change introduz seu primeiro spec, cobrindo a distinção entre pendência "recente" e "falha real" via `sync_status`, `error_message` e `retry_count`, mantendo `cigam_sincronizado` para não quebrar consumidores atuais.

### Modified Capabilities
<!-- Nenhuma capability com spec.md existente muda de requisito neste change. -->
- _(nenhuma)_

## Impact

- **Backend (este repositório)**: novos endpoints em módulos a definir (provavelmente um novo módulo `integrations` ou extensão de `bling`/`events`); migration adicionando `sync_status`, `error_message`, `retry_count` a `events`; alteração no `catch` de `webhookService.processarPedidoCriado` para persistir a falha via `EventService` em vez de só logar; leitura de tokens dos módulos `bling`, `mercadoLivre`, `shopee`, `tray`.
- **Frontend (Chocmaster-Frontend, fora do escopo de implementação desta change)**: os dois novos endpoints existem para alimentar cards no `DashboardPage.tsx` (saúde das integrações e resumo do funil) e um filtro "falhas reais" na tela de Eventos. A UI correspondente deve ser tratada como uma change companion no repositório do frontend, criada depois que os endpoints estiverem estáveis.
- **Nenhuma mudança de contrato pública é removida** — `cigam_sincronizado` continua existindo no `EventModel`/`EventDTO` para não quebrar consumidores atuais.
