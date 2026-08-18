import { Router } from 'express';
import { container } from '@/shared/container';
import { EventController } from './modules/events/controllers/eventController';
import { createEventRoutes } from './modules/events/routes/event.routes';
import { BlingController } from './modules/bling/controllers/blingController';
import { BlingTokenController } from './modules/bling/controllers/blingTokenController';
import { BlingSyncController } from './modules/bling/controllers/blingSyncController';
import { createBlingRoutes } from './modules/bling/routes/bling.routes';
import { createBlingSyncRoutes } from './modules/bling/routes/blingSync.routes';
import { ProdutosController } from './modules/bling/controllers/produtosController';
import { createProdutosRoutes } from './modules/bling/routes/produtos.routes';
import { WebhookController } from './modules/bling/controllers/webhookController';
import { createWebhookRoutes } from './modules/bling/routes/webhook.routes';
import { ContatosController } from './modules/bling/controllers/contatosController';
import { createContatosRoutes } from './modules/bling/routes/contatos.routes';
import { UsuarioCigamController } from './modules/usuarioCigam/controllers/UsuarioCigamController';
import { createUsuarioCigamRoutes } from './modules/usuarioCigam/routers/UsuarioCigam.routes';
import { CigamController } from './modules/cigam/controllers/cigamController';
import { CigamWebhookController } from './modules/cigam/controllers/cigamWebhookController';
import { createCigamRoutes } from './modules/cigam/routes/cigam.routes';
import { CigamMateriaisIntegradorController } from './modules/cigam/controllers/cigamMateriaisIntegradorController';
import { createCigamMateriaisIntegradorRoutes } from './modules/cigam/routes/cigamMateriaisIntegrador.routes';
import { BlingProdutoSyncController } from './modules/bling/controllers/blingProdutoSyncController';
import { createBlingProdutoSyncRoutes } from './modules/bling/routes/blingProdutoSync.routes';

import { PedidoController } from './modules/pedido/controllers/pedidoController';
import { createPedidoRoutes } from './modules/pedido/routes/pedido.routes';

import { ProdutoController } from './modules/produto/controllers/produtoController';
import { createProdutoRoutes } from './modules/produto/routes/produto.routes';

import { PedidoProdutoController } from './modules/pedidoProduto/controllers/pedidoProdutoController';
import { createPedidoProdutoRoutes } from './modules/pedidoProduto/routes/pedidoProduto.routes';

import { FormaPagamentoController } from './modules/formaPagamento/controllers/formaPagamentoController';
import { createFormaPagamentoRoutes } from './modules/formaPagamento/routes/formaPagamento.routes';

import { TransportadoraController } from './modules/transportadora/controllers/transportadoraController';
import { createTransportadoraRoutes } from './modules/transportadora/routes/transportadora.routes';

import { ClientesController } from './modules/clientes/controllers/clientesController';
import { createClientesRoutes } from './modules/clientes/routes/clientes.routes';

import { ProdutosCigamController } from './modules/produtosCigam/controllers/produtosCigamController';
import { createProdutosCigamRoutes } from './modules/produtosCigam/routes/produtosCigam.routes';
import { ClientesCigamController } from './modules/clientesCigam/controllers/clientesCigamController';
import { createClientesCigamRoutes } from './modules/clientesCigam/routes/clientesCigam.routes';
import { FormasPagamentoCigamController } from './modules/formasPagamentoCigam/controllers/formasPagamentoCigamController';
import { createFormasPagamentoCigamRoutes } from './modules/formasPagamentoCigam/routes/formasPagamentoCigam.routes';
import { TransportadorasCigamController } from './modules/transportadorasCigam/controllers/transportadorasCigamController';
import { createTransportadorasCigamRoutes } from './modules/transportadorasCigam/routes/transportadorasCigam.routes';
import { DeParaController } from './modules/depara/controllers/deparaController';
import { createDeParaRoutes } from './modules/depara/routes/depara.routes';

import { ConfiguracoesController } from './modules/configuracoes/controllers/configuracoesController';
import { createConfiguracoesRoutes } from './modules/configuracoes/routes/configuracoes.routes';

import { MercadoLivreController } from './modules/mercadoLivre/controllers/mercadoLivreController';
import { createMercadoLivreRoutes } from './modules/mercadoLivre/routes/mercadoLivre.routes';

import { UsuarioController } from './modules/auth/controllers/usuarioController';
import { createAuthRoutes } from './modules/auth/routes/auth.routes';

import { NotasFiscaisCigamController } from './modules/notasFiscaisCigam/controllers/notasFiscaisCigamController';
import { createNotasFiscaisCigamRoutes } from './modules/notasFiscaisCigam/routes/notasFiscaisCigam.routes';

import { ShopeeController } from './modules/shopee/controllers/shopeeController';
import { createShopeeRoutes } from './modules/shopee/routes/shopee.routes';

const routes = Router();

const eventController = container.resolve(EventController);
const blingController = container.resolve(BlingController);
const blingTokenController = container.resolve(BlingTokenController);
const blingSyncController = container.resolve(BlingSyncController);
const produtosController = container.resolve(ProdutosController);
const webhookController = container.resolve(WebhookController);
const usuariosCigamController = container.resolve(UsuarioCigamController)
const cigamController = container.resolve(CigamController)
const cigamWebhookController = container.resolve(CigamWebhookController)
const pedidoController = container.resolve(PedidoController)
const produtoController = container.resolve(ProdutoController)
const pedidoProdutoController = container.resolve(PedidoProdutoController)
const formaPagamentoController = container.resolve(FormaPagamentoController)
const transportadoraController = container.resolve(TransportadoraController)
const contatosController = container.resolve(ContatosController)
const clientesController = container.resolve(ClientesController)
const produtosCigamController = container.resolve(ProdutosCigamController)
const clientesCigamController = container.resolve(ClientesCigamController)
const formasPagamentoCigamController = container.resolve(FormasPagamentoCigamController)
const transportadorasCigamController = container.resolve(TransportadorasCigamController)
const deParaController = container.resolve(DeParaController)
const cigamMateriaisIntegradorController = container.resolve(CigamMateriaisIntegradorController)
const blingProdutoSyncController = container.resolve(BlingProdutoSyncController)
const configuracoesController = container.resolve(ConfiguracoesController)
const mercadoLivreController = container.resolve(MercadoLivreController)
const usuarioController = container.resolve(UsuarioController)
const notasFiscaisCigamController = container.resolve(NotasFiscaisCigamController)
const shopeeController = container.resolve(ShopeeController)

routes.use('/events', createEventRoutes(eventController));
routes.use('/bling', createBlingRoutes(blingController, blingTokenController));
routes.use('/bling/sync', createBlingSyncRoutes(blingSyncController));
routes.use('/bling', createWebhookRoutes(webhookController));
routes.use('/bling/produtos', createProdutosRoutes(produtosController));
routes.use('/bling/contatos', createContatosRoutes(contatosController));
routes.use('/cigam/usuarios', createUsuarioCigamRoutes(usuariosCigamController))
routes.use('/cigam', createCigamRoutes(cigamController, cigamWebhookController))
routes.use('/pedidos', createPedidoRoutes(pedidoController))
routes.use('/produtos', createProdutoRoutes(produtoController))
routes.use('/pedido-produtos', createPedidoProdutoRoutes(pedidoProdutoController))
routes.use('/formas-pagamento', createFormaPagamentoRoutes(formaPagamentoController))
routes.use('/transportadoras', createTransportadoraRoutes(transportadoraController))
routes.use('/clientes', createClientesRoutes(clientesController))
routes.use('/produtos-cigam', createProdutosCigamRoutes(produtosCigamController))
routes.use('/clientes-cigam', createClientesCigamRoutes(clientesCigamController))
routes.use('/formas-pagamento-cigam', createFormasPagamentoCigamRoutes(formasPagamentoCigamController))
routes.use('/transportadoras-cigam', createTransportadorasCigamRoutes(transportadorasCigamController))
routes.use('/depara', createDeParaRoutes(deParaController))
routes.use('/bling/produto-sync', createBlingProdutoSyncRoutes(blingProdutoSyncController))
routes.use('/cigam/materiais-integrador', createCigamMateriaisIntegradorRoutes(cigamMateriaisIntegradorController))
routes.use('/configuracoes', createConfiguracoesRoutes(configuracoesController))
routes.use('/mercado-livre', createMercadoLivreRoutes(mercadoLivreController))
routes.use('/shopee', createShopeeRoutes(shopeeController))
routes.use('/notas-fiscais-cigam', createNotasFiscaisCigamRoutes(notasFiscaisCigamController))
routes.use('/auth', createAuthRoutes(usuarioController))

export { routes }
