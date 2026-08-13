import { inject, injectable } from 'tsyringe';
import { BlingHttpClient } from './blingHttpClient';
import { EventService } from '@/modules/events/services/eventService';
import { PedidoService } from '@/modules/pedido/services/pedidoService';
import { ProdutoService } from '@/modules/produto/services/produtoService';
import { PedidoProdutoService } from '@/modules/pedidoProduto/services/pedidoProdutoService';
import { TransportadoraService } from '@/modules/transportadora/services/transportadoraService';
import { FormaPagamentoService } from '@/modules/formaPagamento/services/formaPagamentoService';
import { ClientesService } from '@/modules/clientes/services/clientesService';
import { PedidoWebhookInput } from '../blingWebhook.validator';
import { logger } from '@/shared/utils/logger';
import { delay } from '@/shared/utils/delay';
import { IntegrationError } from '@/shared/errors/AppError';
import { ContatosService } from './contatosService';
import { FormaPagamentoBlingService } from './formaPagamentoBlingService';
import { CigamPedidoService } from '@/modules/cigam/services/cigamPedidoService';
import { BlingRepository } from '../repositories/blingRepository';
import { DeParaUnidadesNegocioRepository } from '@/modules/depara/repositories/deparaUnidadesNegocioRepository';
import { ConfiguracoesService } from '@/modules/configuracoes/services/configuracoesService';

@injectable()
export class WebhookService {
  constructor(
    @inject(BlingHttpClient) private readonly blingHttpClient: BlingHttpClient,
    @inject(EventService) private readonly eventService: EventService,
    @inject(PedidoService) private readonly pedidoService: PedidoService,
    @inject(ProdutoService) private readonly produtoService: ProdutoService,
    @inject(PedidoProdutoService) private readonly pedidoProdutoService: PedidoProdutoService,
    @inject(TransportadoraService) private readonly transportadoraService: TransportadoraService,
    @inject(FormaPagamentoService) private readonly formaPagamentoService: FormaPagamentoService,
    @inject(ClientesService) private readonly clientesService: ClientesService,
    @inject(ContatosService) private readonly contatosService: ContatosService,
    @inject(FormaPagamentoBlingService) private readonly formaPagamentoBlingService: FormaPagamentoBlingService,
    @inject(CigamPedidoService) private readonly cigamPedidoService: CigamPedidoService,
    @inject(BlingRepository) private readonly blingRepository: BlingRepository,
    @inject(DeParaUnidadesNegocioRepository) private readonly deParaUnidadesNegocioRepo: DeParaUnidadesNegocioRepository,
    @inject(ConfiguracoesService) private readonly configuracoesService: ConfiguracoesService,
  ) {}

  async processarPedidoCriado(payload: PedidoWebhookInput): Promise<string | null> {
    logger.webhook('Recebendo webhook de pedido criado', { eventId: payload.eventId });

    const pedidoBlingId = payload.data.id;

    const existingEvent = await this.eventService.findByPedido(pedidoBlingId);
    if (existingEvent) {
      logger.webhook(`Pedido Bling #${pedidoBlingId} já foi processado anteriormente.`, { eventId: payload.eventId });

      if (existingEvent.cigam_sincronizado && existingEvent.cigam_pedido_id) {
        logger.webhook(`Pedido já integrado ao CIGAM com código: ${existingEvent.cigam_pedido_id}`);
        return existingEvent.cigam_pedido_id;
      }

      logger.webhook('Pedido já existe mas não foi integrado ao CIGAM. Reintegrando...');
    }

    const pedidoCompleto = await this.blingHttpClient.getPedido(pedidoBlingId);
    const data: any = pedidoCompleto.data;

    logger.webhook('Dados completos do pedido obtidos da API Bling', { id: data.id });

    if (payload.mockProductId) {
      logger.webhook(`[MOCK] Sobrescrevendo IDs de produtos no pedido pelo ID mockado: ${payload.mockProductId}`);
      if (data.itens && Array.isArray(data.itens)) {
        for (const item of data.itens) {
          if (item.produto) {
            item.produto.id = payload.mockProductId;
          }
          item.id = payload.mockProductId;
        }
      }
    }

    await this.processarCliente(data.contato);
    await delay();

    if (data.transporte && data.transporte.contato) {
      logger.info('Processando transportadora', data.transporte.contato);
      await this.processarTransportadora(data.transporte.contato);
      await delay();
    }

    if (data.parcelas && data.parcelas.length > 0) {
      const primeiraParcela = data.parcelas[0];
      if (primeiraParcela.formaPagamento) {
        await this.processarFormaPagamento(primeiraParcela.formaPagamento);
        await delay();
      }
    }

    await this.processarItens(data.itens);
    await delay();

    const transportadoraId = data.transporte?.contato?.id ? String(data.transporte.contato.id) : '';
    const transportadoraNome = data.transporte?.contato?.nome || '';
    const valorFrete = data.transporte?.frete ?? 0;
    const codigoRastreio = data.transporte?.volumes?.[0]?.codigoRastreamento || '';
    const descontoValor = typeof data.desconto === 'object' && data.desconto !== null ? (data.desconto.valor ?? 0) : (Number(data.desconto) || 0);
    const documentoCliente = data.contato.numeroDocumento || data.contato.cpfCnpj || '';

    let unidadeNegocio: string | undefined;
    const companyId = payload.companyId;
    if (companyId) {
      const mapping = await this.deParaUnidadesNegocioRepo.findByCompanyIdBling(companyId);
      if (mapping) {
        unidadeNegocio = mapping.unidade_negocio;
        logger.webhook(`Unidade de negócio mapeada: companyId ${companyId} -> ${unidadeNegocio}`);
      } else {
        logger.webhook(`Nenhum mapeamento de unidade encontrado para companyId: ${companyId}`);
      }
    }

    let pedido;
    try {
      pedido = await this.pedidoService.findByIdBling(String(data.id));
      logger.webhook(`Pedido Bling #${data.id} já existe localmente. Atualizando...`);

      await this.pedidoService.update(pedido.id, {
        codigo_curto: String(data.numero),
        numero_loja: data.numeroLoja,
        data_pedido: data.data,
        total_produtos: data.totalProdutos,
        total_venda: data.total,
        id_cliente_bling: String(data.contato.id),
        nome_cliente: data.contato.nome || '',
        documento_cliente: documentoCliente,
        tipo_pessoa: data.contato.tipoPessoa || '',
        id_loja: String(data.loja.id),
        desconto: descontoValor,
        quantidade_itens: data.itens.reduce((acc: number, item: any) => acc + item.quantidade, 0),
        status_venda: String(data.situacao.id),
        codigo_transportadora: transportadoraId,
        valor_frete: valorFrete,
        nome_transportadora: transportadoraNome,
        codigo_rastreio: codigoRastreio,
        unidade_negocio: unidadeNegocio,
        data_prevista: data.dataPrevisao || undefined,
      });
    } catch {
      pedido = await this.pedidoService.create({
        id_bling: String(data.id),
        codigo_curto: String(data.numero),
        numero_loja: data.numeroLoja,
        data_pedido: data.data,
        total_produtos: data.totalProdutos,
        total_venda: data.total,
        id_cliente_bling: String(data.contato.id),
        nome_cliente: data.contato.nome || '',
        documento_cliente: documentoCliente,
        tipo_pessoa: data.contato.tipoPessoa || '',
        id_loja: String(data.loja.id),
        desconto: descontoValor,
        quantidade_itens: data.itens.reduce((acc: number, item: any) => acc + item.quantidade, 0),
        status_venda: String(data.situacao.id),
        codigo_transportadora: transportadoraId,
        valor_frete: valorFrete,
        nome_transportadora: transportadoraNome,
        codigo_rastreio: codigoRastreio,
        unidade_negocio: unidadeNegocio,
        data_prevista: data.dataPrevisao || undefined,
      });
    }

    await this.pedidoProdutoService.deleteByIdPedido(pedido.id);
    await delay();

    for (const item of data.itens) {
      const produtoBlingId = item.produto?.id ? String(item.produto.id) : String(item.id);
      const produto = await this.produtoService.findByIdBling(produtoBlingId);
      await delay();
      await this.pedidoProdutoService.create({
        id_pedido: pedido.id,
        id_produto: produto.id,
        quantidade: item.quantidade,
        preco: item.valor,
        total: item.valorTotal || (item.valor * item.quantidade),
      });
    }

    await delay();
    const eventoCriado = await this.eventService.create(payload);

    let cigamPedidoId: string | null = null;
    let cigamSincronizado = false;

    const envioAutomaticoAtivo = await this.configuracoesService.getEnvioAutomaticoCigam();
    if (!envioAutomaticoAtivo) {
      logger.webhook('Envio automático para CIGAM está desativado. Pulando integração.', { eventId: payload.eventId });
    } else {
      try {
        cigamPedidoId = await this.cigamPedidoService.enviarPedido(data, unidadeNegocio);
        cigamSincronizado = true;
        logger.webhook('Pedido enviado e integrado com sucesso no CIGAM', { eventId: payload.eventId });
      } catch (cigamError: any) {
        logger.error(`Falha ao integrar pedido Bling #${data.numero} no CIGAM: ${cigamError.message}`);
      }
    }

    await this.eventService.updateCigamStatus(eventoCriado.id, cigamSincronizado, cigamPedidoId);

    logger.webhook('Pedido processado com sucesso', { eventId: payload.eventId, pedidoId: pedido.id });
    return cigamPedidoId;
  }

  private async processarItens(itens: any[]): Promise<void> {
    for (const item of itens) {
      const produtoBlingId = item.produto?.id ? String(item.produto.id) : (item.id ? String(item.id) : '');
      if (!produtoBlingId) continue;

      try {
        await this.produtoService.findByIdBling(produtoBlingId);
      } catch {
        await this.produtoService.create({
          id_bling: produtoBlingId,
          nome: item.descricao || `Produto ${produtoBlingId}`,
          preco: item.valor,
          temVariacoes: false,
          quantidade_estoque: 0,
          ativo: true,
        });
      }
    }
  }

  private async processarTransportadora(transportador: { id: string; nome?: string; fantasia?: string; documento?: string }): Promise<string> {
    try {
      const existente = await this.transportadoraService.findByIdBling(String(transportador.id));
      return existente.id;
    } catch {
      const transportadoraBling = await this.contatosService.getById(String(transportador.id))
      logger.info('Dados transportadora Bling', transportadoraBling)
      const nova = await this.transportadoraService.create({
        id_bling: String(transportadoraBling.id),
        fantasia: transportadoraBling.fantasia,
        documento: transportadoraBling.numeroDocumento,
        nome: transportadoraBling.nome || `Transportadora ${transportador.id}`,
        active: true,
      });
      return nova.id;
    }
  }

  private async processarCliente(contato: { id: number }): Promise<void> {
    try {
      await this.clientesService.findByIdBling(String(contato.id));
    } catch {
      logger.webhook('Cliente não encontrado, buscando dados na API Bling', { contatoId: contato.id });
      const contatoBling = await this.contatosService.getById(String(contato.id));
      const endereco = contatoBling.endereco?.geral;

      await this.clientesService.create({
        id_bling: String(contatoBling.id),
        nome: contatoBling.nome,
        documento: contatoBling.numeroDocumento || undefined,
        telefone: contatoBling.telefone || undefined,
        celular: contatoBling.celular || undefined,
        email: contatoBling.email || undefined,
        endereco: endereco?.endereco,
        numero: endereco?.numero || undefined,
        complemento: endereco?.complemento || undefined,
        bairro: endereco?.bairro,
        cidade: endereco?.municipio,
        uf: endereco?.uf,
        cep: endereco?.cep,
        active: true,
      });

      logger.webhook('Cliente criado com sucesso a partir dos dados da Bling', { contatoId: contato.id });
    }
  }

  private async processarFormaPagamento(formaPagamento: { id: number; descricao?: string }): Promise<string> {
    try {
      const existente = await this.formaPagamentoService.findByIdBling(String(formaPagamento.id));
      return existente.id;
    } catch {
      logger.webhook('Forma pagamento não encontrada, buscando dados na API Bling', { formaPagamentoId: formaPagamento.id });
      const formaPagamentoBling = await this.formaPagamentoBlingService.getById(String(formaPagamento.id));

      const nova = await this.formaPagamentoService.create({
        id_bling: String(formaPagamentoBling.id),
        descricao: formaPagamentoBling.descricao,
        active: formaPagamentoBling.ativo ?? true,
      });

      logger.webhook('Forma pagamento criada com sucesso a partir dos dados da Bling', { formaPagamentoId: formaPagamento.id });
      return nova.id;
    }
  }
}