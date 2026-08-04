## Context

A integração atual sincroniza pedidos do Bling para o CIGAM, mas precisa suportar o cadastro e atualização de materiais originados no ERP CIGAM de forma reversa (CIGAM ➔ Bling).

## Goals / Non-Goals

**Goals:**
- Sincronizar produtos criados no CIGAM com a Bling (Preço inicial: 0.00).
- Atualizar produtos alterados no CIGAM na Bling (Sem alterar o preço).
- Criar a associação automática no banco local e De-Para.

**Non-Goals:**
- Sincronização de tabelas de preço do CIGAM (preços devem ser mantidos e diversificados diretamente na Bling).
- Atualização de estoque.

## Decisions

### 1. Rota Única para Webhook CIGAM
O webhook do CIGAM em `/api/v1/cigam/webhook/produto` lidará com ambos os eventos (criação e edição). 
* *Alternativa considerada:* Rotas separadas para criação e atualização.
* *Decisão:* Rota única baseada no mapeamento De-Para local para discernir entre `POST` (criar) ou `PUT` (atualizar), reduzindo a complexidade de configuração no ERP CIGAM.

### 2. Omissão de Preço no PUT (Update)
Durante o update (`PUT /produtos/:id`), omitimos o campo `preco`.
* *Decisão:* Protege as políticas de preços multicanais configuradas na Bling.

## Risks / Trade-offs

- **[Risk] Alteração acidental de preços no Bling** ➔ *Mitigation*: O payload do método `PUT` de atualização de produto no Bling não conterá o campo de preço.
- **[Risk] Falha de rede temporária na API Bling** ➔ *Mitigation*: Lançamento de erro padrão e log detalhado do webhook para posterior reprocessamento manual ou automático.
