import { injectable } from 'tsyringe';
import { Request, Response } from "express";
import { PedidoProdutoService } from "../services/pedidoProdutoService";
import { validateCreatePedidoProduto } from "../pedidoProduto.validator";

@injectable()
export class PedidoProdutoController {
  constructor(
    private readonly pedidoProdutoService: PedidoProdutoService
  ) {}

  health = (_req: Request, res: Response) => {
    res.status(200).json({
      success: true,
      status: 'ok',
      service: 'pedido-produto',
      message: 'Pedido Produto Service Running',
      timestamp: new Date().toISOString()
    })
  }

  create = async (req: Request, res: Response) => {
    const input = validateCreatePedidoProduto(req.body);
    const pedidoProduto = await this.pedidoProdutoService.create(input);

    res.status(201).json({
      success: true,
      message: 'Pedido produto created successfully',
      data: pedidoProduto
    })
  }

  findAll = async (req: Request, res: Response) => {
    const pedidoProdutos = await this.pedidoProdutoService.findAll();

    res.status(200).json({
      success: true,
      message: 'Pedido produtos retrieved successfully',
      data: pedidoProdutos
    })
  }

  findById = async (req: Request, res: Response) => {
    const id = String(req.params.id);
    const pedidoProduto = await this.pedidoProdutoService.findById(id);

    res.status(200).json({
      success: true,
      message: 'Pedido produto retrieved successfully',
      data: pedidoProduto
    })
  }

  findByIdPedido = async (req: Request, res: Response) => {
    const idPedido = String(req.params.idPedido);
    const pedidoProdutos = await this.pedidoProdutoService.findByIdPedido(idPedido);

    res.status(200).json({
      success: true,
      message: 'Pedido produtos retrieved successfully',
      data: pedidoProdutos
    })
  }

  findByIdProduto = async (req: Request, res: Response) => {
    const idProduto = String(req.params.idProduto);
    const pedidoProdutos = await this.pedidoProdutoService.findByIdProduto(idProduto);

    res.status(200).json({
      success: true,
      message: 'Pedido produtos retrieved successfully',
      data: pedidoProdutos
    })
  }

  update = async (req: Request, res: Response) => {
    const id = String(req.params.id);
    const data = req.body;
    const pedidoProduto = await this.pedidoProdutoService.update(id, data);

    res.status(200).json({
      success: true,
      message: 'Pedido produto updated successfully',
      data: pedidoProduto
    })
  }

  delete = async (req: Request, res: Response) => {
    const id = String(req.params.id);
    await this.pedidoProdutoService.delete(id);

    res.status(200).json({
      success: true,
      message: 'Pedido produto deleted successfully'
    })
  }

  deleteByIdPedido = async (req: Request, res: Response) => {
    const idPedido = String(req.params.idPedido);
    await this.pedidoProdutoService.deleteByIdPedido(idPedido);

    res.status(200).json({
      success: true,
      message: 'Pedido produtos deleted successfully'
    })
  }
}
