## 1. Implementação das Retentativas

- [x] 1.1 Atualizar o método `request` na classe `BlingHttpClient` para torná-lo recursivo e aceitar parâmetros de contagem de retentativas
- [x] 1.2 Implementar a leitura do cabeçalho `Retry-After` nas respostas HTTP
- [x] 1.3 Implementar a função utilitária de delay com Backoff Exponencial para retentativa quando o cabeçalho não estiver disponível

## 2. Validação e Logs

- [x] 2.1 Adicionar logs avisando que o rate limit foi atingido e informando o tempo de espera estimado
- [x] 2.2 Validar que o erro `RateLimitIntegrationError` ainda é lançado caso todas as 3 tentativas falhem
