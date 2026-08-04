import { injectable } from 'tsyringe';
import { Request, Response } from "express";
import { TransportadoraService } from "../services/transportadoraService";
import { validateCreateTransportadora } from "../transportadora.validator";

@injectable()
export class TransportadoraController {
  constructor(
    private readonly transportadoraService: TransportadoraService
  ) {}

  health = (_req: Request, res: Response) => {
    res.status(200).json({
      success: true,
      status: 'ok',
      service: 'transportadora',
      message: 'Transportadora Service Running',
      timestamp: new Date().toISOString()
    })
  }

  create = async (req: Request, res: Response) => {
    const input = validateCreateTransportadora(req.body);
    const transportadora = await this.transportadoraService.create(input);

    res.status(201).json({
      success: true,
      message: 'Transportadora created successfully',
      data: transportadora
    })
  }

  findAll = async (req: Request, res: Response) => {
    const unassociated = req?.query?.unassociated === 'true';
    const transportadoras = await this.transportadoraService.findAll({ unassociated });

    res.status(200).json({
      success: true,
      message: 'Transportadoras retrieved successfully',
      data: transportadoras
    })
  }

  findById = async (req: Request, res: Response) => {
    const id = String(req.params.id);
    const transportadora = await this.transportadoraService.findById(id);

    res.status(200).json({
      success: true,
      message: 'Transportadora retrieved successfully',
      data: transportadora
    })
  }

  findByIdBling = async (req: Request, res: Response) => {
    const idBling = String(req.params.idBling);
    const transportadora = await this.transportadoraService.findByIdBling(idBling);

    res.status(200).json({
      success: true,
      message: 'Transportadora retrieved successfully',
      data: transportadora
    })
  }

  update = async (req: Request, res: Response) => {
    const id = String(req.params.id);
    const data = req.body;
    const transportadora = await this.transportadoraService.update(id, data);

    res.status(200).json({
      success: true,
      message: 'Transportadora updated successfully',
      data: transportadora
    })
  }

  delete = async (req: Request, res: Response) => {
    const id = String(req.params.id);
    await this.transportadoraService.delete(id);

    res.status(200).json({
      success: true,
      message: 'Transportadora deleted successfully'
    })
  }
}
