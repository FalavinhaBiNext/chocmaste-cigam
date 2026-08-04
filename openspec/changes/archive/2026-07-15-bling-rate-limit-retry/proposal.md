## Why

A API Bling v3 impõe limites rígidos de taxa de requisições por segundo. Atualmente, quando o limite é atingido, o sistema falha imediatamente. Adicionar retentativas automáticas baseadas em backoff exponencial mitigará falhas temporárias em cenários de alto volume de sincronização.

## What Changes

- Implementação de um loop de retentativas automáticas (até 3 tentativas) para erros `429 Too Many Requests` no cliente HTTP da Bling.
- Utilização do cabeçalho `Retry-After` enviado pela API da Bling para definir o tempo exato de espera, ou uso de atraso exponencial multiplicativo como fallback.
- Log detalhado das tentativas de reconexão.

## Capabilities

### New Capabilities
- `bling-rate-limit-retry`: Mecanismo resiliente de retentativas automáticas para rate limiting.

### Modified Capabilities
<!-- Nenhuma modificação em especificações existentes -->

## Impact

- **Bling HttpClient:** Alteração do método de requisição interno em `BlingHttpClient`.
