## ADDED Requirements

### Requirement: Retentativa Automática em Erros 429
O sistema MUST interceptar respostas HTTP com status `429` (Too Many Requests) provenientes da API do Bling e tentar realizar a chamada novamente de forma automática antes de propagar a falha.

#### Scenario: Retentativa bem-sucedida após rate limit
- **WHEN** uma chamada de API Bling falha com código status 429
- **THEN** o sistema MUST aguardar o tempo recomendado (ou backoff exponencial) e retransmitir a chamada até um máximo de 3 tentativas antes de desistir e lançar o erro

### Requirement: Respeito ao cabeçalho Retry-After
O sistema MUST ler e aplicar o tempo de espera especificado no cabeçalho HTTP `Retry-After` retornado pela API da Bling se disponível.

#### Scenario: Uso do cabeçalho Retry-After
- **WHEN** a resposta 429 do Bling contiver o cabeçalho "retry-after" com valor de "2" (segundos)
- **THEN** o sistema MUST pausar a execução daquela chamada por exatamente 2 segundos antes de tentar novamente
