import { injectable, inject } from 'tsyringe';
import { Request, Response } from 'express';
import { NotasFiscaisCigamService } from '../services/notasFiscaisCigamService';
import { CigamNfeRoutingService } from '../services/cigamNfeRoutingService';
import { validateReceberNotaFiscalBody } from '../notasFiscaisCigam.validator';
import { logger } from '@/shared/utils/logger';
import { ValidationError } from '@/shared/errors/AppError';

@injectable()
export class NotasFiscaisCigamController {
  constructor(
    @inject(NotasFiscaisCigamService)
    private readonly notasFiscaisCigamService: NotasFiscaisCigamService,
    @inject(CigamNfeRoutingService)
    private readonly cigamNfeRoutingService: CigamNfeRoutingService
  ) {}

  receberWebhook = async (req: Request, res: Response): Promise<void> => {
    logger.webhook('[NF-E CIGAM] Webhook de NF-e recebido');

    const files = req.files as { xml?: Express.Multer.File[]; etiqueta?: Express.Multer.File[] } | undefined;
    const xmlFile = files?.xml?.[0];

    // Verificar se o arquivo XML foi enviado
    if (!xmlFile) {
      throw new ValidationError('Arquivo XML é obrigatório. Envie como multipart/form-data no campo "xml".');
    }

    // Ler conteúdo do arquivo XML
    const xmlContent = xmlFile.buffer.toString('utf-8');

    // PDF da etiqueta é opcional — nem toda NF-e vem acompanhada dele
    const etiquetaFile = files?.etiqueta?.[0];
    const etiquetaPdfBase64 = etiquetaFile ? etiquetaFile.buffer.toString('base64') : undefined;
    if (etiquetaFile) {
      logger.info(`[NF-E CIGAM] Etiqueta PDF recebida junto com a NF-e (${etiquetaFile.size} bytes).`);
    }

    // Validar campos do body
    const bodyData = validateReceberNotaFiscalBody(req.body);

    // Verificar se a NF-e pertence a outra unidade de negócio e deve ser roteada
    const routingResult = await this.cigamNfeRoutingService.verificarERotear({
      body: bodyData,
      xmlContent,
      etiquetaPdfBase64,
      headers: req.headers,
    });

    if (routingResult.forwarded) {
      logger.success(
        `[NF-E CIGAM] NF-e encaminhada com sucesso para a unidade ${routingResult.unidadeIdentificada}`
      );
      res.status(201).json(
        routingResult.response || {
          success: true,
          message: `NF-e recebida e roteada com sucesso para a unidade ${routingResult.unidadeIdentificada}.`,
          forwarded: true,
          target_unit: routingResult.unidadeIdentificada,
        }
      );
      return;
    }

    // Combinar dados do body com o conteúdo do XML e, se houver, da etiqueta
    const input = {
      ...bodyData,
      xml: xmlContent,
      etiquetaPdfBase64,
    };

    const result = await this.notasFiscaisCigamService.receberNotaFiscal(input);

    res.status(201).json({
      success: true,
      message: 'NF-e recebida e registrada com sucesso.',
      data: {
        id: result.id,
        numero_pedido_cigam: result.numero_pedido_cigam,
        numero_pedido_marketplace: result.numero_pedido_marketplace,
        enviado_marketplace: result.enviado_marketplace,
      },
    });
  }

  listarNotas = async (_req: Request, res: Response): Promise<void> => {
    const notas = await this.notasFiscaisCigamService.findAll();

    res.status(200).json({
      success: true,
      data: notas,
    });
  }

  /**
   * Baixa o PDF da etiqueta recebida junto com a NF-e (quando o ERP a enviou).
   * GET /notas-fiscais-cigam/:id/etiqueta
   */
  baixarEtiqueta = async (req: Request, res: Response): Promise<void> => {
    const id = String(req.params.id);

    const etiquetaPdfBase64 = await this.notasFiscaisCigamService.buscarEtiquetaPdf(id);

    if (!etiquetaPdfBase64) {
      res.status(404).json({
        success: false,
        message: 'Esta NF-e não tem etiqueta PDF salva.',
      });
      return;
    }

    const buffer = Buffer.from(etiquetaPdfBase64, 'base64');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="etiqueta-${id}.pdf"`);
    res.status(200).send(buffer);
  }

  buscarPorId = async (req: Request, res: Response): Promise<void> => {
    const id = String(req.params.id);

    const nota = await this.notasFiscaisCigamService.findById(id);

    res.status(200).json({
      success: true,
      data: nota,
    });
  }

  listarNotEnviadas = async (_req: Request, res: Response): Promise<void> => {
    const notas = await this.notasFiscaisCigamService.findNotEnviadas();

    res.status(200).json({
      success: true,
      data: notas,
    });
  }

  marcarEnviada = async (req: Request, res: Response): Promise<void> => {
    const id = String(req.params.id);

    await this.notasFiscaisCigamService.updateEnviadoMarketplace(id, true);

    res.status(200).json({
      success: true,
      message: 'NF-e marcada como enviada ao marketplace.',
    });
  }

  excluirNota = async (req: Request, res: Response): Promise<void> => {
    const id = String(req.params.id);

    await this.notasFiscaisCigamService.deleteById(id);

    res.status(200).json({
      success: true,
      message: 'NF-e excluída com sucesso.',
    });
  }

  enviarParaMarketplace = async (req: Request, res: Response): Promise<void> => {
    const id = String(req.params.id);

    const resultado = await this.notasFiscaisCigamService.enviarParaMarketplace(id);

    res.status(resultado.success ? 200 : 400).json({
      success: resultado.success,
      message: resultado.message,
    });
  }

  atualizarNaTray = async (req: Request, res: Response): Promise<void> => {
    const id = String(req.params.id);

    const resultado = await this.notasFiscaisCigamService.atualizarNaTray(id);

    res.status(resultado.success ? 200 : 400).json({
      success: resultado.success,
      message: resultado.message,
    });
  }

  enviarParaMarketplacePorPedido = async (req: Request, res: Response): Promise<void> => {
    const numeroPedidoCigam = String(req.params.numeroPedidoCigam);

    const resultado = await this.notasFiscaisCigamService.enviarParaMarketplacePorPedidoCigam(numeroPedidoCigam);

    res.status(resultado.success ? 200 : 400).json({
      success: resultado.success,
      message: resultado.message,
    });
  }

  reencaminharOutraUnidade = async (_req: Request, res: Response): Promise<void> => {
    const resultado = await this.notasFiscaisCigamService.reencaminharNotasOutraUnidade();

    res.status(200).json({
      success: true,
      message: `${resultado.encaminhadas} nota(s) encaminhada(s) com sucesso.`,
      data: resultado,
    });
  }
}
