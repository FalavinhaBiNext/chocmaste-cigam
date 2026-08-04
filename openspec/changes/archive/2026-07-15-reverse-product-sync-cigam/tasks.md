## 1. Bling Client Update

- [x] 1.1 Adicionar método `put` na classe `BlingHttpClient` para permitir requisições de atualização

## 2. Webhook Service Logic

- [x] 2.1 Atualizar `CigamWebhookService` para diferenciar criação (POST) de atualização (PUT) usando o relacionamento De-Para
- [x] 2.2 Garantir que o campo `preco` seja omitido no payload enviado pelo método PUT na atualização para proteger preços multicanais
- [x] 2.3 Atualizar os dados do produto localmente no banco de dados após a resposta da Bling

## 3. Verificação

- [ ] 3.1 Testar fluxo de criação enviando uma requisição POST de webhook com um código inexistente no De-Para
- [ ] 3.2 Testar fluxo de atualização enviando uma requisição POST de webhook com um código existente no De-Para, verificando que o preço no Bling não foi modificado
