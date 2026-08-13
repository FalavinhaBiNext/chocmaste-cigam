import { inject, injectable } from 'tsyringe';
import { Request, Response } from 'express';
import { ConfiguracoesService } from '../services/configuracoesService';

@injectable()
export class ConfiguracoesController {
  constructor(
    @inject(ConfiguracoesService) private readonly configuracoesService: ConfiguracoesService
  ) {}

  getEnvioAutomatico = async (_req: Request, res: Response) => {
    const ativo = await this.configuracoesService.getEnvioAutomaticoCigam();
    res.status(200).json({
      success: true,
      data: { envio_automatico_cigam: ativo },
    });
  };

  setEnvioAutomatico = async (req: Request, res: Response) => {
    const { ativo } = req.body;
    if (typeof ativo !== 'boolean') {
      res.status(400).json({
        success: false,
        message: 'O campo "ativo" deve ser um booleano.',
      });
      return;
    }
    await this.configuracoesService.setEnvioAutomaticoCigam(ativo);
    res.status(200).json({
      success: true,
      message: `Envio automático para CIGAM ${ativo ? 'ativado' : 'desativado'} com sucesso.`,
      data: { envio_automatico_cigam: ativo },
    });
  };
}
