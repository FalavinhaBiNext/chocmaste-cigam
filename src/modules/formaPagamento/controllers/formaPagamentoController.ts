import { injectable } from 'tsyringe';
import { Request, Response } from "express";
import { FormaPagamentoService } from "../services/formaPagamentoService";
import { validateCreateFormaPagamento } from "../formaPagamento.validator";

@injectable()
export class FormaPagamentoController {
  constructor(
    private readonly formaPagamentoService: FormaPagamentoService
  ) {}

  health = (_req: Request, res: Response) => {
    res.status(200).json({
      success: true,
      status: 'ok',
      service: 'forma-pagamento',
      message: 'Forma Pagamento Service Running',
      timestamp: new Date().toISOString()
    })
  }

  create = async (req: Request, res: Response) => {
    const input = validateCreateFormaPagamento(req.body);
    const formaPagamento = await this.formaPagamentoService.create(input);

    res.status(201).json({
      success: true,
      message: 'Forma pagamento created successfully',
      data: formaPagamento
    })
  }

  findAll = async (req: Request, res: Response) => {
    const unassociated = req?.query?.unassociated === 'true';
    const formasPagamento = await this.formaPagamentoService.findAll({ unassociated });

    res.status(200).json({
      success: true,
      message: 'Formas pagamento retrieved successfully',
      data: formasPagamento
    })
  }

  findById = async (req: Request, res: Response) => {
    const id = String(req.params.id);
    const formaPagamento = await this.formaPagamentoService.findById(id);

    res.status(200).json({
      success: true,
      message: 'Forma pagamento retrieved successfully',
      data: formaPagamento
    })
  }

  findByIdBling = async (req: Request, res: Response) => {
    const idBling = String(req.params.idBling);
    const formaPagamento = await this.formaPagamentoService.findByIdBling(idBling);

    res.status(200).json({
      success: true,
      message: 'Forma pagamento retrieved successfully',
      data: formaPagamento
    })
  }

  update = async (req: Request, res: Response) => {
    const id = String(req.params.id);
    const data = req.body;
    const formaPagamento = await this.formaPagamentoService.update(id, data);

    res.status(200).json({
      success: true,
      message: 'Forma pagamento updated successfully',
      data: formaPagamento
    })
  }

  delete = async (req: Request, res: Response) => {
    const id = String(req.params.id);
    await this.formaPagamentoService.delete(id);

    res.status(200).json({
      success: true,
      message: 'Forma pagamento deleted successfully'
    })
  }
}
