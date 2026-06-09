import { inject, injectable } from 'tsyringe';
import { Request, Response } from 'express';
import { ProdutosService } from '../services/produtosService';

@injectable()
export class ProdutosController {
  constructor(
    @inject(ProdutosService) private readonly produtosService: ProdutosService
  ) {}

  getById = async (req: Request, res: Response): Promise<void> => {
    const idProduto = String(req.params.idProduto);
    const produto = await this.produtosService.getById(idProduto);
    res.json(produto);
  };
}
