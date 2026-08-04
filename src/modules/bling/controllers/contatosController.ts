import { inject, injectable } from 'tsyringe';
import { Request, Response } from 'express';
import { ContatosService } from '../services/contatosService';

@injectable()
export class ContatosController {
  constructor(
    @inject(ContatosService) private readonly contatosService: ContatosService
  ) {}

  search = async (req: Request, res: Response): Promise<void> => {
    const nome = req.query.nome as string | undefined;
    const cpfCnpj = req.query.cpfCnpj as string | undefined;

    const contatos = await this.contatosService.search(nome, cpfCnpj);
    res.json(contatos);
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    const id = String(req.params.id);
    const contato = await this.contatosService.getById(id);
    res.json(contato);
  };
}
