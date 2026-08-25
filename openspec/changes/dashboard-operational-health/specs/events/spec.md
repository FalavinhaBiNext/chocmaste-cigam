## ADDED Requirements

### Requirement: Registro de status de sincronização por evento
Cada evento de pedido registrado a partir do webhook do Bling SHALL manter um `sync_status` com um destes valores: `pendente`, `sincronizado` ou `falha`, refletindo o estado mais recente da tentativa de integração com o CIGAM.

#### Scenario: Evento criado antes de qualquer tentativa de integração
- **WHEN** um evento de pedido é criado a partir do webhook do Bling
- **THEN** o `sync_status` inicial é `pendente`

#### Scenario: Integração com o CIGAM bem-sucedida
- **WHEN** a integração do pedido com o CIGAM é concluída com sucesso
- **THEN** o `sync_status` do evento passa a `sincronizado` e `cigam_sincronizado` permanece `true`

### Requirement: Persistência de falha de sincronização
Quando a integração de um pedido com o CIGAM falhar, o sistema SHALL persistir o motivo do erro e incrementar o contador de tentativas no evento correspondente, em vez de apenas registrar em log.

#### Scenario: Falha na integração com o CIGAM
- **WHEN** `processarPedidoCriado` tenta integrar um pedido ao CIGAM e a chamada lança uma exceção
- **THEN** o evento correspondente é atualizado com `sync_status: "falha"`, `error_message` contendo a mensagem do erro, e `retry_count` incrementado em 1

#### Scenario: Nova tentativa bem-sucedida após falha anterior
- **WHEN** um pedido cujo evento está com `sync_status: "falha"` é reprocessado com sucesso
- **THEN** o `sync_status` volta para `sincronizado`, `error_message` é limpo (`null`), e `retry_count` é preservado (não é zerado)

### Requirement: Compatibilidade com o campo booleano existente
O campo `cigam_sincronizado` SHALL continuar presente e semanticamente equivalente a `sync_status === "sincronizado"`, para não quebrar consumidores existentes do evento.

#### Scenario: Consumidor legado lê apenas o campo booleano
- **WHEN** um cliente consulta um evento e lê apenas o campo `cigam_sincronizado`
- **THEN** o valor reflete corretamente se o pedido está sincronizado, independentemente de o cliente conhecer ou não os campos `sync_status`, `error_message` e `retry_count`
