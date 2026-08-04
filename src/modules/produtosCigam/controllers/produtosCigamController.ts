import { injectable } from 'tsyringe';
import { Request, Response } from "express";
import { ProdutosCigamService } from "../services/produtosCigamService";
import { validateCreateProdutosCigam } from "../produtosCigam.validator";

@injectable()
export class ProdutosCigamController {
  constructor(
    private readonly produtosCigamService: ProdutosCigamService
  ) {}

  health = (_req: Request, res: Response) => {
    res.status(200).json({
      success: true,
      status: 'ok',
      service: 'produtos-cigam',
      message: 'Produtos Cigam Service Running',
      timestamp: new Date().toISOString()
    })
  }

  create = async (req: Request, res: Response) => {
    const input = validateCreateProdutosCigam(req.body);
    const produto = await this.produtosCigamService.create(input);

    res.status(201).json({
      success: true,
      message: 'Produto cigam created successfully',
      data: produto
    })
  }

  findAll = async (req: Request, res: Response) => {
    const produtos = await this.produtosCigamService.findAll();

    res.status(200).json({
      success: true,
      message: 'Produtos cigam retrieved successfully',
      data: produtos
    })
  }

  findById = async (req: Request, res: Response) => {
    const id = String(req.params.id);
    const produto = await this.produtosCigamService.findById(id);

    res.status(200).json({
      success: true,
      message: 'Produto cigam retrieved successfully',
      data: produto
    })
  }

  findByIdCigam = async (req: Request, res: Response) => {
    const idCigam = String(req.params.idCigam);
    const produto = await this.produtosCigamService.findByIdCigam(idCigam);

    res.status(200).json({
      success: true,
      message: 'Produto cigam retrieved successfully',
      data: produto
    })
  }

  update = async (req: Request, res: Response) => {
    const id = String(req.params.id);
    const data = req.body;
    const produto = await this.produtosCigamService.update(id, data);

    res.status(200).json({
      success: true,
      message: 'Produto cigam updated successfully',
      data: produto
    })
  }

  delete = async (req: Request, res: Response) => {
    const id = String(req.params.id);
    await this.produtosCigamService.delete(id);

    res.status(200).json({
      success: true,
      message: 'Produto cigam deleted successfully'
    })
  }
}
