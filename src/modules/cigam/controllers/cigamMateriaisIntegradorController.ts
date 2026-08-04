import { inject, injectable } from 'tsyringe';
import { Request, Response } from 'express';
import { CigamMateriaisIntegradorService } from '../services/cigamMateriaisIntegradorService';
import { validateCadastrarMaterial, validateCadastrarEmapear } from '../cigamMateriaisIntegrador.validator';

@injectable()
export class CigamMateriaisIntegradorController {
  constructor(
    @inject(CigamMateriaisIntegradorService)
    private readonly materiaisService: CigamMateriaisIntegradorService,
  ) {}

  health = (_req: Request, res: Response) => {
    res.status(200).json({
      success: true,
      status: 'ok',
      service: 'cigam-materiais-integrador',
      message: 'CIGAM Materiais Integrador Service Running',
      timestamp: new Date().toISOString(),
    });
  };

  cadastrarMaterial = async (req: Request, res: Response) => {
    const input = validateCadastrarMaterial(req.body);
    const result = await this.materiaisService.cadastrarMaterial(input);

    res.status(201).json({
      success: true,
      message: 'Material cadastrado no Integrador CIGAM com sucesso.',
      data: result,
    });
  };

  listarMateriais = async (_req: Request, res: Response) => {
    const result = await this.materiaisService.listarMateriais();

    res.status(200).json({
      success: true,
      data: result,
    });
  };

  sincronizarComLocal = async (_req: Request, res: Response) => {
    const result = await this.materiaisService.sincronizarComLocal();

    res.status(200).json({
      success: true,
      message: 'Sincronização de materiais finalizada.',
      data: result,
    });
  };

  cadastrarEmapear = async (req: Request, res: Response) => {
    const input = validateCadastrarEmapear(req.body);
    await this.materiaisService.cadastrarEmapear(input);

    res.status(201).json({
      success: true,
      message: 'Material cadastrado e mapeado com sucesso.',
    });
  };
}
