## Context

Atualmente, chamadas de integração da Bling que retornam erro 429 lançam a exceção `RateLimitIntegrationError` imediatamente.

## Goals / Non-Goals

**Goals:**
- Implementar retentativas (máximo 3) para erros de rate limit no cliente HTTP.
- Usar Backoff Exponencial recursivo de fallback se o cabeçalho `Retry-After` estiver ausente.

**Non-Goals:**
- Filas de persistência de requisições persistidas em disco (Redis/RabbitMQ). As retentativas ocorrem em memória na própria thread da requisição ativa.

## Decisions

### 1. Loop de Retentativa Recursivo
* *Decisão:* Reescrever o método interno `request` de `BlingHttpClient` para ser recursivo, aceitando contadores de retentativa e tempo de atraso base como parâmetros adicionais.
* *Atraso Base:* 1000ms.

## Risks / Trade-offs

- **[Risk] Aumento do tempo de resposta HTTP do nosso backend** ➔ *Mitigation*: O limite máximo de retentativas é fixado em 3 para que chamadas síncronas de API (ex: no salvamento de pedidos manuais pelo usuário) não fiquem presas por muito tempo.
