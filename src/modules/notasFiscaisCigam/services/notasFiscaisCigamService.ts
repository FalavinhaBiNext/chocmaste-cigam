import { injectable, inject } from 'tsyringe';
import { NotasFiscaisCigamRepository } from '../repositories/notasFiscaisCigamRepository';
import { PedidoService } from '@/modules/pedido/services/pedidoService';
import { MercadoLivreFiscalService } from '@/modules/mercadoLivre/services/mercadoLivreFiscalService';
import { ReceberNotaFiscalInput } from '../notasFiscaisCigam.validator';
import { ResponseNotaFiscalCigamDTO } from '../dto';
import { logger } from '@/shared/utils/logger';
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
      data_faturamento: input.dataFaturamento,
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
}
