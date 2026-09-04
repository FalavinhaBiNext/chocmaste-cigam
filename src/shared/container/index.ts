import { container } from 'tsyringe';
import { EventRepository } from '@/modules/events/repositories/eventRepository';
import { EventService } from '@/modules/events/services/eventService';
import { EventController } from '@/modules/events/controllers/eventController';
import { BlingRepository } from '@/modules/bling/repositories/blingRepository';
import { BlingOAuthService } from '@/modules/bling/services/blingOAuthService';
import { BlingHttpClient } from '@/modules/bling/services/blingHttpClient';
import { BlingService } from '@/modules/bling/services/blingService';
import { BlingController } from '@/modules/bling/controllers/blingController';
import { ProdutosService } from '@/modules/bling/services/produtosService';
import { ProdutosController } from '@/modules/bling/controllers/produtosController';
import { WebhookService } from '@/modules/bling/services/webhookService';
import { WebhookController } from '@/modules/bling/controllers/webhookController';
import { BlingTokenScheduler } from '@/modules/bling/services/blingTokenScheduler';
import { BlingTokenController } from '@/modules/bling/controllers/blingTokenController';
import { ContatosService } from '@/modules/bling/services/contatosService';
import { ContatosController } from '@/modules/bling/controllers/contatosController';
import { FormaPagamentoBlingService } from '@/modules/bling/services/formaPagamentoBlingService';
import { BlingSyncService } from '@/modules/bling/services/blingSyncService';
import { BlingSyncController } from '@/modules/bling/controllers/blingSyncController';
import { BlingProdutoSyncService } from '@/modules/bling/services/blingProdutoSyncService';
import { BlingProdutoSyncController } from '@/modules/bling/controllers/blingProdutoSyncController';

import { UsuarioCigamRepository } from '@/modules/usuarioCigam/repositories/UsuarioCigamRepository';
import { UsuarioCigamService } from '@/modules/usuarioCigam/services/usuarioCigamService';
import { UsuarioCigamController } from '@/modules/usuarioCigam/controllers/UsuarioCigamController';

import { CigamRepository } from '@/modules/cigam/repositories/cigamRepository';
import { CigamAuthService } from '@/modules/cigam/services/cigamAuthService';
import { CigamHttpClient } from '@/modules/cigam/services/cigamHttpClient';
import { CigamService } from '@/modules/cigam/services/cigamService';
import { CigamSyncService } from '@/modules/cigam/services/cigamSyncService';
import { CigamController } from '@/modules/cigam/controllers/cigamController';

import { PedidoRepository } from '@/modules/pedido/repositories/pedidoRepository';
import { PedidoService } from '@/modules/pedido/services/pedidoService';
import { PedidoController } from '@/modules/pedido/controllers/pedidoController';

import { ProdutoRepository } from '@/modules/produto/repositories/produtoRepository';
import { ProdutoService } from '@/modules/produto/services/produtoService';
import { ProdutoController } from '@/modules/produto/controllers/produtoController';

import { PedidoProdutoRepository } from '@/modules/pedidoProduto/repositories/pedidoProdutoRepository';
import { PedidoProdutoService } from '@/modules/pedidoProduto/services/pedidoProdutoService';
import { PedidoProdutoController } from '@/modules/pedidoProduto/controllers/pedidoProdutoController';

import { FormaPagamentoRepository } from '@/modules/formaPagamento/repositories/formaPagamentoRepository';
import { FormaPagamentoService } from '@/modules/formaPagamento/services/formaPagamentoService';
import { FormaPagamentoController } from '@/modules/formaPagamento/controllers/formaPagamentoController';

import { TransportadoraRepository } from '@/modules/transportadora/repositories/transportadoraRepository';
import { TransportadoraService } from '@/modules/transportadora/services/transportadoraService';
import { TransportadoraController } from '@/modules/transportadora/controllers/transportadoraController';

import { ClientesRepository } from '@/modules/clientes/repositories/clientesRepository';
import { ClientesService } from '@/modules/clientes/services/clientesService';
import { ClientesController } from '@/modules/clientes/controllers/clientesController';

container.registerSingleton(PedidoRepository);
container.registerSingleton(PedidoService);
container.registerSingleton(PedidoController);
container.registerSingleton(ProdutoRepository);
container.registerSingleton(ProdutoService);
container.registerSingleton(ProdutoController);
container.registerSingleton(PedidoProdutoRepository);
container.registerSingleton(PedidoProdutoService);
container.registerSingleton(PedidoProdutoController);
container.registerSingleton(FormaPagamentoRepository);
container.registerSingleton(FormaPagamentoService);
container.registerSingleton(FormaPagamentoController);
container.registerSingleton(TransportadoraRepository);
container.registerSingleton(TransportadoraService);
container.registerSingleton(TransportadoraController);

container.registerSingleton(EventRepository);
container.registerSingleton(EventService);
container.registerSingleton(EventController);
container.registerSingleton(BlingRepository);
container.registerSingleton(BlingOAuthService);
container.registerSingleton(BlingHttpClient);
container.registerSingleton(BlingService);
container.registerSingleton(BlingController);
container.registerSingleton(ProdutosService);
container.registerSingleton(ProdutosController);
container.registerSingleton(WebhookService);
container.registerSingleton(WebhookController);
container.registerSingleton(BlingTokenScheduler);
container.registerSingleton(BlingTokenController);
container.registerSingleton(ContatosService);
container.registerSingleton(ContatosController);
container.registerSingleton(FormaPagamentoBlingService);
container.registerSingleton(BlingSyncService);
container.registerSingleton(BlingSyncController);
container.registerSingleton(BlingProdutoSyncService);
container.registerSingleton(BlingProdutoSyncController);
container.registerSingleton(UsuarioCigamRepository);
container.registerSingleton(UsuarioCigamService);
container.registerSingleton(UsuarioCigamController)
container.registerSingleton(CigamRepository);
container.registerSingleton(CigamAuthService);
container.registerSingleton(CigamHttpClient);
container.registerSingleton(CigamService);
container.registerSingleton(CigamSyncService);
container.registerSingleton(CigamController);
container.registerSingleton(ClientesRepository);
container.registerSingleton(ClientesService);
container.registerSingleton(ClientesController);

import { ProdutosCigamRepository } from '@/modules/produtosCigam/repositories/produtosCigamRepository';
import { ProdutosCigamService } from '@/modules/produtosCigam/services/produtosCigamService';
import { ProdutosCigamController } from '@/modules/produtosCigam/controllers/produtosCigamController';

import { ClientesCigamRepository } from '@/modules/clientesCigam/repositories/clientesCigamRepository';
import { ClientesCigamService } from '@/modules/clientesCigam/services/clientesCigamService';
import { ClientesCigamController } from '@/modules/clientesCigam/controllers/clientesCigamController';

import { FormasPagamentoCigamRepository } from '@/modules/formasPagamentoCigam/repositories/formasPagamentoCigamRepository';
import { FormasPagamentoCigamService } from '@/modules/formasPagamentoCigam/services/formasPagamentoCigamService';
import { FormasPagamentoCigamController } from '@/modules/formasPagamentoCigam/controllers/formasPagamentoCigamController';

import { TransportadorasCigamRepository } from '@/modules/transportadorasCigam/repositories/transportadorasCigamRepository';
import { TransportadorasCigamService } from '@/modules/transportadorasCigam/services/transportadorasCigamService';
import { TransportadorasCigamController } from '@/modules/transportadorasCigam/controllers/transportadorasCigamController';

import { DeParaProdutosRepository } from '@/modules/depara/repositories/deparaProdutosRepository';
import { DeParaClientesRepository } from '@/modules/depara/repositories/deparaClientesRepository';
import { DeParaFormasPagamentoRepository } from '@/modules/depara/repositories/deparaFormasPagamentoRepository';
import { DeParaTransportadorasRepository } from '@/modules/depara/repositories/deparaTransportadorasRepository';
import { DeParaUnidadesNegocioRepository } from '@/modules/depara/repositories/deparaUnidadesNegocioRepository';
import { DeParaService } from '@/modules/depara/services/deparaService';
import { DeParaController } from '@/modules/depara/controllers/deparaController';

container.registerSingleton(ProdutosCigamRepository);
container.registerSingleton(ProdutosCigamService);
container.registerSingleton(ProdutosCigamController);
container.registerSingleton(ClientesCigamRepository);
container.registerSingleton(ClientesCigamService);
container.registerSingleton(ClientesCigamController);
container.registerSingleton(FormasPagamentoCigamRepository);
container.registerSingleton(FormasPagamentoCigamService);
container.registerSingleton(FormasPagamentoCigamController);
container.registerSingleton(TransportadorasCigamRepository);
container.registerSingleton(TransportadorasCigamService);
container.registerSingleton(TransportadorasCigamController);

container.registerSingleton(DeParaProdutosRepository);
container.registerSingleton(DeParaClientesRepository);
container.registerSingleton(DeParaFormasPagamentoRepository);
container.registerSingleton(DeParaTransportadorasRepository);
container.registerSingleton(DeParaUnidadesNegocioRepository);
container.registerSingleton(DeParaService);
container.registerSingleton(DeParaController);

import { CigamClienteService } from '@/modules/cigam/services/cigamClienteService';
import { CigamTransportadoraService } from '@/modules/cigam/services/cigamTransportadoraService';
import { CigamPedidoService } from '@/modules/cigam/services/cigamPedidoService';
import { CigamIntegradorHttpClient } from '@/modules/cigam/services/cigamIntegradorHttpClient';
import { CigamMateriaisIntegradorService } from '@/modules/cigam/services/cigamMateriaisIntegradorService';

import { CigamMateriaisIntegradorController } from '@/modules/cigam/controllers/cigamMateriaisIntegradorController';

import { UsuarioRepository } from '@/modules/auth/repositories/usuarioRepository';
import { UsuarioService } from '@/modules/auth/services/usuarioService';
import { UsuarioController } from '@/modules/auth/controllers/usuarioController';

container.registerSingleton(UsuarioRepository);
container.registerSingleton(UsuarioService);
container.registerSingleton(UsuarioController);

container.registerSingleton(CigamClienteService);
container.registerSingleton(CigamTransportadoraService);
container.registerSingleton(CigamPedidoService);
container.registerSingleton(CigamIntegradorHttpClient);
container.registerSingleton(CigamMateriaisIntegradorService);
container.registerSingleton(CigamMateriaisIntegradorController);

import { ConfiguracoesRepository } from '@/modules/configuracoes/repositories/configuracoesRepository';
import { ConfiguracoesService } from '@/modules/configuracoes/services/configuracoesService';
import { ConfiguracoesController } from '@/modules/configuracoes/controllers/configuracoesController';

container.registerSingleton(ConfiguracoesRepository);
container.registerSingleton(ConfiguracoesService);
container.registerSingleton(ConfiguracoesController);

import { MercadoLivreTokenRepository } from '@/modules/mercadoLivre/repositories/mercadoLivreTokenRepository';
import { MercadoLivreAuthService } from '@/modules/mercadoLivre/services/mercadoLivreAuthService';
import { MercadoLivreHttpClient } from '@/modules/mercadoLivre/services/mercadoLivreHttpClient';
import { MercadoLivreController } from '@/modules/mercadoLivre/controllers/mercadoLivreController';
import { MercadoLivreFiscalService } from '@/modules/mercadoLivre/services/mercadoLivreFiscalService';

container.registerSingleton(MercadoLivreTokenRepository);
container.registerSingleton(MercadoLivreAuthService);
container.registerSingleton(MercadoLivreHttpClient);
container.registerSingleton(MercadoLivreController);
container.registerSingleton(MercadoLivreFiscalService);

import { NotasFiscaisCigamRepository } from '@/modules/notasFiscaisCigam/repositories/notasFiscaisCigamRepository';
import { NotasFiscaisCigamService } from '@/modules/notasFiscaisCigam/services/notasFiscaisCigamService';
import { NotasFiscaisCigamController } from '@/modules/notasFiscaisCigam/controllers/notasFiscaisCigamController';

container.registerSingleton(NotasFiscaisCigamRepository);
container.registerSingleton(NotasFiscaisCigamService);
container.registerSingleton(NotasFiscaisCigamController);

import { ShopeeTokenRepository } from '@/modules/shopee/repositories/shopeeTokenRepository';
import { ShopeeAuthService } from '@/modules/shopee/services/shopeeAuthService';
import { ShopeeHttpClient } from '@/modules/shopee/services/shopeeHttpClient';
import { ShopeeOrderService } from '@/modules/shopee/services/shopeeOrderService';
import { ShopeeFiscalService } from '@/modules/shopee/services/shopeeFiscalService';
import { ShopeeController } from '@/modules/shopee/controllers/shopeeController';

container.registerSingleton(ShopeeTokenRepository);
container.registerSingleton(ShopeeAuthService);
container.registerSingleton(ShopeeHttpClient);
container.registerSingleton(ShopeeOrderService);
container.registerSingleton(ShopeeFiscalService);
container.registerSingleton(ShopeeController);

import { CanalVendaRepository } from '@/modules/canalVenda/repositories/canalVendaRepository';
import { CanalVendaService } from '@/modules/canalVenda/services/canalVendaService';
import { CanalVendaController } from '@/modules/canalVenda/controllers/canalVendaController';

container.registerSingleton(CanalVendaRepository);
container.registerSingleton(CanalVendaService);
container.registerSingleton(CanalVendaController);

import { TrayTokenRepository } from '@/modules/tray/repositories/trayTokenRepository';
import { TrayAuthService } from '@/modules/tray/services/trayAuthService';
import { TrayHttpClient } from '@/modules/tray/services/trayHttpClient';
import { TrayShippingLabelService } from '@/modules/tray/services/trayShippingLabelService';
import { TrayOrderService } from '@/modules/tray/services/trayOrderService';
import { TrayController } from '@/modules/tray/controllers/trayController';

container.registerSingleton(TrayTokenRepository);
container.registerSingleton(TrayAuthService);
container.registerSingleton(TrayHttpClient);
container.registerSingleton(TrayOrderService);
container.registerSingleton(TrayShippingLabelService);
container.registerSingleton(TrayController);

import { IntegrationHealthService } from '@/modules/integrations/services/integrationHealthService';
import { IntegrationController } from '@/modules/integrations/controllers/integrationController';

container.registerSingleton(IntegrationHealthService);
container.registerSingleton(IntegrationController);

import { SyncPipelineSummaryService } from '@/modules/syncPipeline/services/syncPipelineSummaryService';
import { SyncPipelineController } from '@/modules/syncPipeline/controllers/syncPipelineController';

container.registerSingleton(SyncPipelineSummaryService);
container.registerSingleton(SyncPipelineController);

export { container };
