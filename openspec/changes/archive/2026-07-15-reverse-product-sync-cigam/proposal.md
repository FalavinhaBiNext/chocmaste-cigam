## Why

Sincronizar produtos cadastrados e alterados no ERP CIGAM diretamente na Bling de forma automatizada. Isso elimina o cadastro manual de produtos em ambas as plataformas, garante a integridade dos dados cadastrais (peso, nome em maiúsculas, unidade) e preserva a política de preços diversificados da Bling ao não atualizar o preço do produto nas alterações subsequentes.

## What Changes

- Criação de uma nova rota de Webhook para receber eventos do CIGAM: `POST /api/v1/cigam/webhook/produto`.
- Implementação de fluxo de decisão automático:
  - **Criação de Produto (Se não houver De-Para):** Envia um cadastro `POST` para a Bling com preço zerado (`0.00`) e grava o mapeamento no banco local.
  - **Atualização de Produto (Se já houver De-Para):** Envia um `PUT` para a Bling para atualizar nome/peso do produto, omitindo o preço para não sobrescrever os valores customizados no e-commerce.
- Atualização do banco local e criação automática da associação De-Para de produtos.

## Capabilities

### New Capabilities
- `reverse-product-sync`: Sincronização automática e mapeamento De-Para reverso de produtos originados no CIGAM.

### Modified Capabilities
<!-- Nenhuma especificação de requisito existente está sendo alterada -->

## Impact

- **API Routes:** Nova rota `/api/v1/cigam/webhook/produto`.
- **Cigam Module:** Nova controller `CigamWebhookController`, validator `cigamWebhook.validator.ts` e service `CigamWebhookService`.
- **De-Para Module:** Integração com o repositório de De-Para de Produtos.
