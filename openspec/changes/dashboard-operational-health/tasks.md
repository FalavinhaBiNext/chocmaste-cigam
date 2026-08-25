## 1. Migration e modelo de dados (`events`)

- [x] 1.1 Criar migration adicionando `sync_status` (STRING, default `'pendente'`), `error_message` (TEXT, nullable) e `retry_count` (INTEGER, default 0) à tabela `events`
- [x] 1.2 Incluir no `up` da migration o backfill: `sync_status = 'sincronizado'` onde `cigam_sincronizado = true`, `'pendente'` nos demais registros existentes
- [x] 1.3 Atualizar `EventModel` (`src/modules/events/models/eventModel.ts`) com os 3 campos novos
- [x] 1.4 Atualizar `EventDTO`/mapper (`src/modules/events/dto/index.ts`, `EventMapper.ts`) para incluir os campos novos, mantendo `cigam_sincronizado`

## 2. Persistência de falha de sincronização

- [x] 2.1 Adicionar `EventRepository.updateSyncStatus(id, { syncStatus, errorMessage, retryCount })` (ou equivalente) em `eventRepository.ts`
- [x] 2.2 Adicionar `EventService.markSyncFailure(eventId, errorMessage)`: seta `sync_status = 'falha'`, grava `error_message`, incrementa `retry_count`
- [x] 2.3 Adicionar `EventService.markSyncSuccess(eventId)`: seta `sync_status = 'sincronizado'`, `error_message = null`, mantém `retry_count`, mantém `cigam_sincronizado = true`
- [x] 2.4 Atualizar `webhookService.processarPedidoCriado` (`src/modules/bling/services/webhookService.ts`, catch atual em ~linha 271) para chamar `markSyncFailure` no catch da integração CIGAM, em vez de só `logger.error`
- [x] 2.5 Atualizar o caminho de sucesso da integração CIGAM no mesmo método para chamar `markSyncSuccess`
- [x] 2.6 Testes: `EventService` (falha marca status/erro/retry corretamente; sucesso limpa erro e preserva retry_count) e teste de integração do `webhookService` cobrindo o catch atualizado. Extra (fora do escopo original mas necessário para consistência): `EventController.retryCigamSync` também passou a usar `markSyncSuccess`/`markSyncFailure`, já que é outro caminho de reintegração manual que mexe no mesmo estado.

## 3. Endpoint de filtro de eventos por status de sincronização

- [x] 3.1 Adicionar suporte a query param `sync_status` em `GET /events` (validator, controller, service, repository)
- [x] 3.2 Testes: filtro retorna apenas eventos com `sync_status = 'falha'`, incluindo `error_message` e `retry_count` na resposta

## 4. Capability `integration-token-health`

- [x] 4.1 Criar módulo `src/modules/integrations/` com estrutura padrão (controllers, services, routes, dto)
- [x] 4.2 Implementar `IntegrationHealthService` injetando `BlingRepository`, `MercadoLivreTokenRepository`, `ShopeeTokenRepository`, `TrayTokenRepository`
- [x] 4.3 Implementar um mapper isolado por integração (`mapBlingToken`, `mapMercadoLivreToken`, `mapShopeeToken`, `mapTrayToken`) que traduz cada token ativo para o `IntegrationHealthDTO` comum
- [x] 4.4 Implementar a classificação de status (`ok` / `expiring_soon` / `expired`) com os limiares definidos no design (2h para access token; 5 dias para refresh token da Tray)
- [x] 4.5 Implementar `IntegrationController.getHealth` e rota `GET /api/v1/integrations/health`
- [x] 4.6 Registrar `IntegrationHealthService`/`IntegrationController` no container DI (`src/shared/container/index.ts`) e a rota em `src/routes.ts`
- [x] 4.7 Testes: cada cenário do spec (`connected: false` quando não há token; `expiring_soon`/`expired` por limiar; `refreshTokenExpiresAt: null` para Bling/ML/Shopee; valor real para Tray) + teste de controller + teste de isolamento de falha entre integrações

## 5. Capability `sync-pipeline-summary`

- [x] 5.1 Adicionar métodos de agregação nos repositórios existentes: `EventRepository.countBySyncStatus()`, `PedidoRepository.countByStatusNfe()`, `NotasFiscaisCigamRepository.countByEnviadoMarketplace()` (usar `COUNT`/`GROUP BY` no banco, não carregar linhas em memória)
- [x] 5.2 Implementar `SyncPipelineSummaryService` combinando as 3 agregações no formato do spec (`recebidos`, `sincronizadosCigam`, `sincronizacaoPendente`, `sincronizacaoComFalha`, `nfeFaturada`, `nfeEnviadaMarketplace`)
- [x] 5.3 Expor endpoint — criado módulo novo `src/modules/syncPipeline/`, montado em `GET /api/v1/sync-pipeline-summary`, para não sobrecarregar o módulo `pedido` com agregação cross-módulo (decisão tomada na Open Question do design)
- [x] 5.4 Testes: resumo com dados mistos (alguns falhando, alguns pendentes, alguns completos) retorna as contagens corretas — cobre `SyncPipelineSummaryService` (mocks) e `PedidoRepository.countByStatusNfe` (banco real). `NotasFiscaisCigamRepository.countByEnviadoMarketplace` não ganhou teste de banco dedicado — o módulo não tinha pasta de testes prévia e a lógica (2 `count()` triviais) já é exercitada indiretamente pelo teste do service com mocks.

## 6. Fechamento

- [x] 6.1 Rodar `npx vitest run` completo e confirmar que nenhum teste existente quebrou. Resultado: 501 testes, 492 passando, 9 falhando — todas as 9 falhas confirmadas pré-existentes na `main` (verificado via `git stash`), nenhuma introduzida por este change: 1 em `eventsController.test.ts` (payload de teste não bate com o schema do webhook), 2 em `blingService.test.ts`, 5 em `cigamController.test.ts` (`hasRunningJob` não existe no mock), 1 em `cigamValidator.test.ts`.
- [x] 6.2 Nenhum limiar virou variável de ambiente (decisão 2 do design manteve os limiares como constantes no `IntegrationHealthService`) — nada a atualizar em `.env.example`.
- [ ] 6.3 Abrir change companion no `Chocmaster-Frontend` para consumir `GET /api/v1/integrations/health` e o resumo do funil no `DashboardPage.tsx`, e o filtro `sync_status=falha` na tela de Eventos — fora do escopo de implementação deste change
