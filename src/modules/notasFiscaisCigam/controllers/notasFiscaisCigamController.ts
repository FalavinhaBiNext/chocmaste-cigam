import { injectable, inject } from 'tsyringe';
import { Request, Response } from 'express';
import { NotasFiscaisCigamService } from '../services/notasFiscaisCigamService';
import { validateReceberNotaFiscalBody } from '../notasFiscaisCigam.validator';
import { logger } from '@/shared/utils/logger';
import { ValidationError } from '@/shared/errors/AppError';

@injectable()
export class NotasFiscaisCigamController {
  constructor(
    @inject(NotasFiscaisCigamService)
    private readonly notasFiscaisCigamService: NotasFiscaisCigamService
  ) {}

  receberWebhook = async (req: Request, res: Response): Promise<void> => {
    logger.webhook('[NF-E CIGAM] Webhook de NF-e recebido');

    // Verificar se o arquivo XML foi enviado
    if (!req.file) {
      throw new ValidationError('Arquivo XML é obrigatório. Envie como multipart/form-data no campo "xml".');
    }

    // Ler conteúdo do arquivo XML
    const xmlContent = req.file.buffer.toString('utf-8');

    // Validar campos do body
    const bodyData = validateReceberNotaFiscalBody(req.body);

    // Combinar dados do body com o conteúdo do XML
    const input = {
      ...bodyData,
      xml: xmlContent,
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
}
