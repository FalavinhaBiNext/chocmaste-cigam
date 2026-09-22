import { injectable, inject } from 'tsyringe';
import { NotasFiscaisCigamRepository } from '../repositories/notasFiscaisCigamRepository';
import { PedidoService } from '@/modules/pedido/services/pedidoService';
import { MercadoLivreFiscalService } from '@/modules/mercadoLivre/services/mercadoLivreFiscalService';
import { ShopeeFiscalService } from '@/modules/shopee/services/shopeeFiscalService';
import { TrayFiscalService } from '@/modules/tray/services/trayFiscalService';
import { ReceberNotaFiscalInput } from '../notasFiscaisCigam.validator';
import { ResponseNotaFiscalCigamDTO } from '../dto';
import { logger } from '@/shared/utils/logger';
import { parseDateOnly } from '@/shared/utils/date';
import { ConflictError, NotFoundError } from '@/shared/errors/AppError';

@injectable()
export class NotasFiscaisCigamService {
  constructor(
    @inject(NotasFiscaisCigamRepository)
    private readonly notasFiscaisCigamRepository: NotasFiscaisCigamRepository,
    @inject(PedidoService)
    private readonly pedidoService: PedidoService,
    @inject(MercadoLivreFiscalService)
    private readonly mercadoLivreFiscalService: MercadoLivreFiscalService,
    @inject(ShopeeFiscalService)
    private readonly shopeeFiscalService: ShopeeFiscalService,
    @inject(TrayFiscalService)
    private readonly trayFiscalService: TrayFiscalService,
  ) {}

  async receberNotaFiscal(input: ReceberNotaFiscalInput): Promise<ResponseNotaFiscalCigamDTO> {
    logger.info(`[NF-E CIGAM] Recebendo webhook de NF-e para pedido CIGAM: ${input.numeroPedido}`);

    // Verificar se já existe nota com mesma chave de acesso
    if (input.chaveAcessoNfe) {
      const existingNota = await this.notasFiscaisCigamRepository.findByChaveAcesso(input.chaveAcessoNfe);
      if (existingNota) {
        throw new ConflictError(`NF-e com chave de acesso ${input.chaveAcessoNfe} já foi registrada.`);
      }
    }

    // Tentar vincular com pedido existente via numero_pedido_cigam
    let numeroPedidoMarketplace: string | undefined;
    let pedidoVinculado: any = null;
    try {
      pedidoVinculado = await this.pedidoService.findByNumeroPedidoCigam(input.numeroPedido);
      if (pedidoVinculado) {
        numeroPedidoMarketplace = pedidoVinculado.numero_loja;
        logger.info(`[NF-E CIGAM] Pedido vinculado: CIGAM ${input.numeroPedido} -> Marketplace ${numeroPedidoMarketplace}`);
      }
    } catch {
      logger.info(`[NF-E CIGAM] Pedido CIGAM ${input.numeroPedido} não encontrado na tabela pedidos. Salvando sem vinculação.`);
    }

    // Salvar a NF-e no banco
    const nota = await this.notasFiscaisCigamRepository.create({
      numero_pedido_cigam: input.numeroPedido,
      numero_pedido_marketplace: numeroPedidoMarketplace,
      marketplace: pedidoVinculado?.marketplace || null,
      unidade_negocio: input.unidadeNegocio,
      data_faturamento: parseDateOnly(input.dataFaturamento),
      numero_nf: input.numeroNf,
      serie_nf: input.serieNf,
      chave_acesso: input.chaveAcessoNfe,
      enviado_marketplace: false,
      xml_content: input.xml,
    });

    logger.success(`[NF-E CIGAM] NF-e registrada com sucesso. ID: ${nota.id}`);

    // Atualizar status_nfe do pedido para 'faturada'
    if (pedidoVinculado) {
      try {
        await this.pedidoService.update(pedidoVinculado.id, {
          status_nfe: 'faturada',
        });
        logger.info(`[NF-E CIGAM] Pedido ${pedidoVinculado.id} atualizado para status_nfe=faturada`);
      } catch (error: any) {
        logger.error(`[NF-E CIGAM] Erro ao atualizar status_nfe do pedido: ${error.message}`);
      }

      // Se o marketplace for Mercado Livre, enviar a NF-e
      if (pedidoVinculado.marketplace === 'mercado_livre' && numeroPedidoMarketplace) {
        logger.info(`[NF-E CIGAM] Pedido é do Mercado Livre. Iniciando envio de NF-e...`);

        const resultado = await this.mercadoLivreFiscalService.enviarNFe(
          numeroPedidoMarketplace,
          input.xml
        );

        if (resultado.success) {
          // Atualizar nota como enviada
          await this.notasFiscaisCigamRepository.updateEnviadoMarketplace(nota.id, true);
          // Atualizar status_nfe do pedido
          await this.pedidoService.update(pedidoVinculado.id, {
            status_nfe: 'enviada',
          });
          logger.success(`[NF-E CIGAM] NF-e enviada com sucesso ao Mercado Livre. Shipment: ${resultado.shipmentId}`);
        } else {
          logger.warn(`[NF-E CIGAM] NF-e não pôde ser enviada ao ML: ${resultado.error}. Status mantido como 'faturada'.`);
        }
      } else if (pedidoVinculado.marketplace && pedidoVinculado.marketplace !== 'mercado_livre') {
        logger.info(`[NF-E CIGAM] Marketplace '${pedidoVinculado.marketplace}' ainda não suportado para envio automático de NF-e.`);
      }
    }

    return nota;
  }

  async findAll(): Promise<ResponseNotaFiscalCigamDTO[]> {
    logger.info('[NF-E CIGAM] Buscando todas as notas fiscais');
    const notas = await this.notasFiscaisCigamRepository.findAll();
    logger.success(`[NF-E CIGAM] ${notas.length} notas fiscais encontradas`);
    return notas;
  }

  async findById(id: string): Promise<ResponseNotaFiscalCigamDTO> {
    logger.info(`[NF-E CIGAM] Buscando nota fiscal com ID: ${id}`);
    const nota = await this.notasFiscaisCigamRepository.findById(id);
    if (!nota) {
      throw new NotFoundError(`Nota fiscal com ID: ${id} não encontrada`);
    }
    return nota;
  }

  async findNotEnviadas(): Promise<ResponseNotaFiscalCigamDTO[]> {
    logger.info('[NF-E CIGAM] Buscando notas fiscais não enviadas ao marketplace');
    const notas = await this.notasFiscaisCigamRepository.findNotEnviadas();
    logger.success(`[NF-E CIGAM] ${notas.length} notas não enviadas encontradas`);
    return notas;
  }

  async updateEnviadoMarketplace(id: string, enviado: boolean): Promise<void> {
    logger.info(`[NF-E CIGAM] Atualizando status de envio da nota ${id} para ${enviado}`);
    const nota = await this.notasFiscaisCigamRepository.findById(id);
    if (!nota) {
      throw new NotFoundError(`Nota fiscal com ID: ${id} não encontrada`);
    }
    await this.notasFiscaisCigamRepository.updateEnviadoMarketplace(id, enviado);
    logger.success(`[NF-E CIGAM] Status de envio atualizado com sucesso`);
  }

  /**
   * Envia o XML de uma nota já registrada ao marketplace responsável, resolvendo
   * o pedido/shipment necessário para cada integração:
   * - Shopee: usa numero_pedido_marketplace (order_sn) diretamente.
   * - Mercado Livre: busca o pedido local por numero_pedido_cigam para obter o
   *   shipping_id (com cache — replica a resolução de MercadoLivreController.getShipmentStatus
   *   quando ainda não há shipping_id salvo).
   * Usado pelo botão "Enviar XML" da tela de NF-e CIGAM — não é usado pela tela de Pedidos.
   */
  async enviarParaMarketplace(id: string): Promise<{ success: boolean; message: string }> {
    const nota = await this.notasFiscaisCigamRepository.findById(id);
    if (!nota) {
      throw new NotFoundError(`Nota fiscal com ID: ${id} não encontrada`);
    }

    if (nota.enviado_marketplace) {
      return { success: false, message: 'Esta NF-e já foi enviada ao marketplace.' };
    }

    if (!nota.marketplace) {
      return { success: false, message: 'Esta NF-e não está vinculada a um pedido de marketplace.' };
    }

    let resultado: { success: boolean; error?: string };

    if (nota.marketplace === 'shopee') {
      if (!nota.numero_pedido_marketplace) {
        return { success: false, message: 'NF-e sem número de pedido do marketplace vinculado.' };
      }

      resultado = await this.shopeeFiscalService.enviarNFe(nota.numero_pedido_marketplace, {
        xmlContent: nota.xml_content,
        chaveAcesso: nota.chave_acesso,
        createdAt: nota.created_at,
      });
    } else if (nota.marketplace === 'mercado_livre') {
      const shipmentInfo = await this.mercadoLivreFiscalService.resolverShipmentId(nota.numero_pedido_cigam);
      if (!shipmentInfo.success || !shipmentInfo.shipmentId) {
        return {
          success: false,
          message: shipmentInfo.error || 'O XML ainda não pode ser enviado ao marketplace. Aguarde o marketplace liberar o envio.',
        };
      }

      resultado = await this.mercadoLivreFiscalService.enviarNFePorShipmentId(shipmentInfo.shipmentId, nota.xml_content);
    } else {
      // Qualquer outro valor de marketplace vem do "Local de venda" extraído das
      // observações do Bling (AMAZON, MAGAZINE LUIZA, LOJA VIRTUAL, PARTICULAR, etc.)
      // — são todos canais vendidos através da mesma loja Tray, então passam pela
      // mesma API de NF-e da Tray, usando numero_pedido_marketplace como order_id.
      if (!nota.numero_pedido_marketplace) {
        return { success: false, message: 'NF-e sem número de pedido do marketplace vinculado.' };
      }

      resultado = await this.trayFiscalService.enviarNFe(nota.numero_pedido_marketplace, {
        numero: nota.numero_nf,
        serie: nota.serie_nf,
        chaveAcesso: nota.chave_acesso,
        dataFaturamento: nota.data_faturamento,
      });
    }

    if (!resultado.success) {
      logger.warn(`[NF-E CIGAM] Envio manual da nota ${nota.id} bloqueado: ${resultado.error}`);
      return {
        success: false,
        message: resultado.error || 'O XML ainda não pode ser enviado ao marketplace. Aguarde o marketplace liberar o envio.',
      };
    }

    await this.notasFiscaisCigamRepository.updateEnviadoMarketplace(nota.id, true);

    try {
      const pedidoVinculado = await this.pedidoService.findByNumeroPedidoCigam(nota.numero_pedido_cigam);
      if (pedidoVinculado) {
        await this.pedidoService.update(pedidoVinculado.id, { status_nfe: 'enviada' });
      }
    } catch (error: any) {
      logger.error(`[NF-E CIGAM] Erro ao atualizar status_nfe do pedido após envio manual: ${error.message}`);
    }

    logger.success(`[NF-E CIGAM] NF-e ${nota.id} enviada manualmente com sucesso ao marketplace ${nota.marketplace}.`);
    return { success: true, message: 'NF-e enviada com sucesso ao marketplace.' };
  }

  /**
   * Mesma lógica de enviarParaMarketplace, mas localizando a nota a partir do
   * numero_pedido_cigam — usado pelo botão "Enviar XML" na tela de Pedidos, que só
   * tem os dados do pedido local (não o id da nota fiscal).
   */
  async enviarParaMarketplacePorPedidoCigam(numeroPedidoCigam: string): Promise<{ success: boolean; message: string }> {
    const notas = await this.notasFiscaisCigamRepository.findByNumeroPedidoCigam(numeroPedidoCigam);
    const nota = notas.find((n) => !n.enviado_marketplace) || notas[0];

    if (!nota) {
      return {
        success: false,
        message: `Nenhuma NF-e encontrada para o pedido CIGAM #${numeroPedidoCigam}.`,
      };
    }

    return this.enviarParaMarketplace(nota.id);
  }

  async deleteById(id: string): Promise<void> {
    logger.info(`[NF-E CIGAM] Excluindo nota fiscal ${id}`);
    const nota = await this.notasFiscaisCigamRepository.findById(id);
    if (!nota) {
      throw new NotFoundError(`Nota fiscal com ID: ${id} não encontrada`);
    }
    await this.notasFiscaisCigamRepository.deleteById(id);
    logger.success(`[NF-E CIGAM] Nota fiscal ${id} excluída com sucesso`);
  }
}
