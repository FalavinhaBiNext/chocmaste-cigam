import { injectable } from 'tsyringe';
import { Request, Response } from "express";
import { CanalVendaService } from "../services/canalVendaService";

@injectable()
export class CanalVendaController {
  constructor(
    private readonly canalVendaService: CanalVendaService
  ) {}

  health = (_req: Request, res: Response) => {
    res.status(200).json({
      success: true,
      status: 'ok',
      service: 'canal-venda',
      message: 'Canal Venda Service Running',
      timestamp: new Date().toISOString()
    })
  }

  sincronizar = async (_req: Request, res: Response) => {
    const canaisVenda = await this.canalVendaService.sincronizar();

    res.status(200).json({
      success: true,
      message: 'Canais de venda sincronizados com sucesso',
      data: canaisVenda
    })
  }

  findAll = async (_req: Request, res: Response) => {
    const canaisVenda = await this.canalVendaService.findAll();

    res.status(200).json({
      success: true,
      message: 'Canais de venda recuperados com sucesso',
      data: canaisVenda
    })
  }

  findById = async (req: Request, res: Response) => {
    const id = String(req.params.id);
    const canalVenda = await this.canalVendaService.findById(id);

    res.status(200).json({
      success: true,
      message: 'Canal de venda recuperado com sucesso',
      data: canalVenda
    })
  }

  update = async (req: Request, res: Response) => {
    const id = String(req.params.id);
    const data = req.body;
    const canalVenda = await this.canalVendaService.update(id, data);

    res.status(200).json({
      success: true,
      message: 'Canal de venda atualizado com sucesso',
      data: canalVenda
    })
  }

  delete = async (req: Request, res: Response) => {
    const id = String(req.params.id);
    await this.canalVendaService.delete(id);

    res.status(200).json({
      success: true,
      message: 'Canal de venda removido com sucesso'
    })
  }
}
