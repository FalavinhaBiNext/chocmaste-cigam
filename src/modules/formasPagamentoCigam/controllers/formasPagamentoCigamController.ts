import { injectable } from 'tsyringe';
import { Request, Response } from "express";
import { FormasPagamentoCigamService } from "../services/formasPagamentoCigamService";
import { validateCreateFormasPagamentoCigam } from "../formasPagamentoCigam.validator";

@injectable()
export class FormasPagamentoCigamController {
  constructor(
    private readonly formasPagamentoCigamService: FormasPagamentoCigamService
  ) {}

  health = (_req: Request, res: Response) => {
    res.status(200).json({
      success: true,
      status: 'ok',
      service: 'formas-pagamento-cigam',
      message: 'Formas Pagamento Cigam Service Running',
      timestamp: new Date().toISOString()
    })
  }

  create = async (req: Request, res: Response) => {
    const input = validateCreateFormasPagamentoCigam(req.body);
    const formaPagamento = await this.formasPagamentoCigamService.create(input);

    res.status(201).json({
      success: true,
      message: 'Forma pagamento cigam created successfully',
      data: formaPagamento
    })
  }

  findAll = async (req: Request, res: Response) => {
    const formasPagamento = await this.formasPagamentoCigamService.findAll();

    res.status(200).json({
      success: true,
      message: 'Formas pagamento cigam retrieved successfully',
      data: formasPagamento
    })
  }

  findById = async (req: Request, res: Response) => {
    const id = String(req.params.id);
    const formaPagamento = await this.formasPagamentoCigamService.findById(id);

    res.status(200).json({
      success: true,
      message: 'Forma pagamento cigam retrieved successfully',
      data: formaPagamento
    })
  }

  findByIdCigam = async (req: Request, res: Response) => {
    const idCigam = String(req.params.idCigam);
    const formaPagamento = await this.formasPagamentoCigamService.findByIdCigam(idCigam);

    res.status(200).json({
      success: true,
      message: 'Forma pagamento cigam retrieved successfully',
      data: formaPagamento
    })
  }

  update = async (req: Request, res: Response) => {
    const id = String(req.params.id);
    const data = req.body;
    const formaPagamento = await this.formasPagamentoCigamService.update(id, data);

    res.status(200).json({
      success: true,
      message: 'Forma pagamento cigam updated successfully',
      data: formaPagamento
    })
  }

  delete = async (req: Request, res: Response) => {
    const id = String(req.params.id);
    await this.formasPagamentoCigamService.delete(id);

    res.status(200).json({
      success: true,
      message: 'Forma pagamento cigam deleted successfully'
    })
  }
}
