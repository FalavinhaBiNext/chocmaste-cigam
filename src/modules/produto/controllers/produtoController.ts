import { injectable } from 'tsyringe';
import { Request, Response } from "express";
import { ProdutoService } from "../services/produtoService";
import { validateCreateProduto } from "../produto.validator";

@injectable()
export class ProdutoController {
  constructor(
    private readonly produtoService: ProdutoService
  ) {}

  health = (_req: Request, res: Response) => {
    res.status(200).json({
      success: true,
      status: 'ok',
      service: 'produto',
      message: 'Produto Service Running',
      timestamp: new Date().toISOString()
    })
  }

  create = async (req: Request, res: Response) => {
    const input = validateCreateProduto(req.body);
    const produto = await this.produtoService.create(input);

    res.status(201).json({
      success: true,
      message: 'Produto created successfully',
      data: produto
    })
  }

  findAll = async (req: Request, res: Response) => {
    const unassociated = req?.query?.unassociated === 'true';
    const produtos = await this.produtoService.findAll({ unassociated });

    res.status(200).json({
      success: true,
      message: 'Produtos retrieved successfully',
      data: produtos
    })
  }

  findById = async (req: Request, res: Response) => {
    const id = String(req.params.id);
    const produto = await this.produtoService.findById(id);

    res.status(200).json({
      success: true,
      message: 'Produto retrieved successfully',
      data: produto
    })
  }

  findByIdBling = async (req: Request, res: Response) => {
    const idBling = String(req.params.idBling);
    const produto = await this.produtoService.findByIdBling(idBling);

    res.status(200).json({
      success: true,
      message: 'Produto retrieved successfully',
      data: produto
    })
  }

  findByIdProduto = async (req: Request, res: Response) => {
    const idProduto = String(req.params.idProduto);
    const produto = await this.produtoService.findByIdProduto(idProduto);

    res.status(200).json({
      success: true,
      message: 'Produto retrieved successfully',
      data: produto
    })
  }

  update = async (req: Request, res: Response) => {
    const id = String(req.params.id);
    const data = req.body;
    const produto = await this.produtoService.update(id, data);

    res.status(200).json({
      success: true,
      message: 'Produto updated successfully',
      data: produto
    })
  }

  delete = async (req: Request, res: Response) => {
    const id = String(req.params.id);
    await this.produtoService.delete(id);

    res.status(200).json({
      success: true,
      message: 'Produto deleted successfully'
    })
  }

  exportExcel = async (req: Request, res: Response) => {
    const buffer = await this.produtoService.generateEsmateriExcel();

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=produtos_esmateri_preenchido.xlsx'
    );
    res.status(200).send(buffer);
  }
}
