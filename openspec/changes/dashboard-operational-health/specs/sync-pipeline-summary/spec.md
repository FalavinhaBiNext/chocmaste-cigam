## ADDED Requirements

### Requirement: Resumo agregado do funil operacional
O sistema SHALL expor um endpoint que retorna a contagem de pedidos em cada etapa do funil: recebidos (via webhook Bling), sincronizados com o CIGAM, com NF-e faturada e com NF-e enviada ao marketplace.

#### Scenario: Consulta do resumo do funil
- **WHEN** um cliente autenticado chama o endpoint de resumo do funil
- **THEN** o sistema retorna as contagens de `recebidos`, `sincronizadosCigam`, `nfeFaturada` e `nfeEnviadaMarketplace`, calculadas por agregação no banco (não carregando todas as linhas em memória)

### Requirement: Contagem de pendências reais por etapa
O sistema SHALL distinguir, na contagem de pedidos pendentes de sincronização com o CIGAM, quantos estão com `sync_status = "falha"` versus `sync_status = "pendente"`.

#### Scenario: Resumo com falhas reais presentes
- **WHEN** existem eventos com `sync_status = "falha"` no período consultado
- **THEN** a resposta do resumo do funil inclui a contagem `sincronizacaoComFalha` separada da contagem `sincronizacaoPendente`

### Requirement: Filtro de eventos por status de sincronização
O sistema SHALL permitir filtrar a listagem de eventos por `sync_status`, incluindo o valor `falha`, para que seja possível listar apenas pendências que já falharam ao menos uma vez.

#### Scenario: Filtrar apenas falhas reais
- **WHEN** um cliente consulta a listagem de eventos com o filtro `sync_status=falha`
- **THEN** o sistema retorna apenas eventos cujo `sync_status` atual é `falha`, cada um incluindo `error_message` e `retry_count`
