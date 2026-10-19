import { inject, injectable } from 'tsyringe';
import { Request, Response } from 'express';
import { PedidosBlingService } from '../services/pedidosBlingService';

@injectable()
export class PedidosBlingController {
  constructor(
    @inject(PedidosBlingService) private readonly pedidosBlingService: PedidosBlingService
  ) {}

  getById = async (req: Request, res: Response): Promise<void> => {
    const tokenId = req.query.token_id as string | undefined;
    const pedido = await this.pedidosBlingService.getById(String(req.params.id), tokenId);
    res.json(pedido);
  };

  getByNumero = async (req: Request, res: Response): Promise<void> => {
    const tokenId = req.query.token_id as string | undefined;
    const pedido = await this.pedidosBlingService.getByNumero(String(req.params.numero), tokenId);
    res.json(pedido);
  };
}
