## ADDED Requirements

### Requirement: Consulta consolidada de saúde de tokens de integração
O sistema SHALL expor um endpoint que retorna, para cada integração de marketplace suportada (Bling, Mercado Livre, Shopee, Tray), o status de expiração do token ativo daquela integração.

#### Scenario: Todas as integrações com token ativo e válido
- **WHEN** um cliente autenticado chama `GET /api/v1/integrations/health`
- **THEN** o sistema retorna uma lista com uma entrada por integração suportada, cada uma com `integration`, `connected: true`, `status: "ok"`, `accessTokenExpiresAt` e `refreshTokenExpiresAt` (quando aplicável)

#### Scenario: Integração sem token ativo cadastrado
- **WHEN** uma integração (ex.: Shopee) não possui nenhum token ativo salvo
- **THEN** a entrada correspondente retorna `connected: false` e `status: "expired"`, sem lançar erro para as demais integrações

### Requirement: Classificação de status por proximidade de expiração
O sistema SHALL classificar o status de cada token ativo como `ok`, `expiring_soon` ou `expired`, com base na data de expiração armazenada e um limiar por tipo de token (access token vs. refresh token).

#### Scenario: Access token expirando em breve
- **WHEN** o `access_token` ativo de uma integração expira em menos de 2 horas
- **THEN** o `status` da integração é `expiring_soon`

#### Scenario: Refresh token da Tray expirando em breve
- **WHEN** o `refresh_token` ativo da integração Tray expira em menos de 5 dias
- **THEN** o `status` da integração é `expiring_soon`, mesmo que o access token esteja `ok`

#### Scenario: Token expirado
- **WHEN** a data de expiração do access token ativo de uma integração já passou
- **THEN** o `status` da integração é `expired`

### Requirement: Semântica de refresh token por integração
O sistema SHALL retornar `refreshTokenExpiresAt: null` para integrações cujo modelo de token não separa expiração de access token e refresh token (Bling, Mercado Livre, Shopee), e retornar a data real apenas para integrações que a armazenam separadamente (Tray).

#### Scenario: Integração sem expiração de refresh token dedicada
- **WHEN** o cliente consulta o status da integração Mercado Livre
- **THEN** o campo `refreshTokenExpiresAt` da resposta é `null`
