import { injectable, inject } from 'tsyringe';
import { Request, Response } from 'express';
import { NotasFiscaisCigamService } from '../services/notasFiscaisCigamService';
import { validateReceberNotaFiscal } from '../notasFiscaisCigam.validator';
import { logger } from '@/shared/utils/logger';

@injectable()
export class NotasFiscaisCigamController {
  constructor(
    @inject(NotasFiscaisCigamService)
    private readonly notasFiscaisCigamService: NotasFiscaisCigamService
  ) {}

  receberWebhook = async (req: Request, res: Response): Promise<void> => {
    logger.webhook('[NF-E CIGAM] Webhook de NF-e recebido', { body: req.body });

    const input = validateReceberNotaFiscal(req.body);

    const result = await this.notasFiscaisCigamService.receberNotaFiscal(input);

    res.status(201).json({
      success: true,
      message: 'NF-e recebida e registrada com sucesso.',
      data: result,
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
    const { id } = req.params;

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
    const { id } = req.params;

    await this.notasFiscaisCigamService.updateEnviadoMarketplace(id, true);

    res.status(200).json({
      success: true,
      message: 'NF-e marcada como enviada ao marketplace.',
    });
  }
}
