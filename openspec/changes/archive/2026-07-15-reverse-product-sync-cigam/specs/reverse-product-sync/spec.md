## ADDED Requirements

### Requirement: Sincronização de Produto Novo (Criação)
O sistema MUST integrar produtos criados no CIGAM diretamente na Bling com preço zerado (`0.00`) caso não exista um mapeamento De-Para correspondente para o código do material.

#### Scenario: Cadastro automático de produto novo na Bling
- **WHEN** uma requisição POST é feita em `/api/v1/cigam/webhook/produto` com um código de material sem De-Para associado
- **THEN** o sistema MUST criar o produto na Bling usando POST `/produtos` com o preço fixado em 0.00 e cadastrar o mapeamento De-Para no banco local

### Requirement: Atualização de Produto Existente
O sistema MUST atualizar os dados de cadastro (nome, peso, unidade) de produtos já mapeados na Bling quando sofrerem alterações no CIGAM, omitindo o preço no payload de atualização para preservar a precificação diversificada da Bling.

#### Scenario: Atualização de produto na Bling preservando o preço
- **WHEN** uma requisição POST é feita em `/api/v1/cigam/webhook/produto` com um código de material que já possui mapeamento De-Para
- **THEN** o sistema MUST enviar um PUT para `/produtos/{idBling}` na Bling atualizando nome, peso e unidade, sem enviar o preço, e atualizar os dados no banco local
