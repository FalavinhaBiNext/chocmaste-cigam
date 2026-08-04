import { injectable } from 'tsyringe';
import { Request, Response } from "express";
import { PedidoService } from "../services/pedidoService";
import { validateCreatePedido } from "../pedido.validator";

@injectable()
export class PedidoController {
  constructor(
    private readonly pedidoService: PedidoService
  ) {}

  health = (_req: Request, res: Response) => {
    res.status(200).json({
      success: true,
      status: 'ok',
      service: 'pedido',
      message: 'Pedido Service Running',
      timestamp: new Date().toISOString()
    })
  }

  create = async (req: Request, res: Response) => {
    const input = validateCreatePedido(req.body);
    const pedido = await this.pedidoService.create(input);

    res.status(201).json({
      success: true,
      message: 'Pedido created successfully',
      data: pedido
    })
  }

  findAll = async (req: Request, res: Response) => {
    const pedidos = await this.pedidoService.findAll();

    res.status(200).json({
      success: true,
      message: 'Pedidos retrieved successfully',
      data: pedidos
    })
  }

  findById = async (req: Request, res: Response) => {
    const id = String(req.params.id);
    const pedido = await this.pedidoService.findById(id);

    res.status(200).json({
      success: true,
      message: 'Pedido retrieved successfully',
      data: pedido
    })
  }

  findByIdBling = async (req: Request, res: Response) => {
    const idBling = String(req.params.idBling);
    const pedido = await this.pedidoService.findByIdBling(idBling);

    res.status(200).json({
      success: true,
      message: 'Pedido retrieved successfully',
      data: pedido
    })
  }

  findByNumeroLoja = async (req: Request, res: Response) => {
    const numeroLoja = String(req.params.numeroLoja);
    const pedido = await this.pedidoService.findByNumeroLoja(numeroLoja);

    res.status(200).json({
      success: true,
      message: 'Pedido retrieved successfully',
      data: pedido
    })
  }

  update = async (req: Request, res: Response) => {
    const id = String(req.params.id);
    const data = req.body;
    const pedido = await this.pedidoService.update(id, data);

    res.status(200).json({
      success: true,
      message: 'Pedido updated successfully',
      data: pedido
    })
  }

  delete = async (req: Request, res: Response) => {
    const id = String(req.params.id);
    await this.pedidoService.delete(id);

    res.status(200).json({
      success: true,
      message: 'Pedido deleted successfully'
    })
  }
}
