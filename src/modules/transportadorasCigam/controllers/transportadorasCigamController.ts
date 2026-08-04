import { injectable } from 'tsyringe';
import { Request, Response } from "express";
import { TransportadorasCigamService } from "../services/transportadorasCigamService";
import { validateCreateTransportadorasCigam } from "../transportadorasCigam.validator";

@injectable()
export class TransportadorasCigamController {
  constructor(
    private readonly transportadorasCigamService: TransportadorasCigamService
  ) {}

  health = (_req: Request, res: Response) => {
    res.status(200).json({
      success: true,
      status: 'ok',
      service: 'transportadoras-cigam',
      message: 'Transportadoras Cigam Service Running',
      timestamp: new Date().toISOString()
    })
  }

  create = async (req: Request, res: Response) => {
    const input = validateCreateTransportadorasCigam(req.body);
    const transportadora = await this.transportadorasCigamService.create(input);

    res.status(201).json({
      success: true,
      message: 'Transportadora cigam created successfully',
      data: transportadora
    })
  }

  findAll = async (req: Request, res: Response) => {
    const transportadoras = await this.transportadorasCigamService.findAll();

    res.status(200).json({
      success: true,
      message: 'Transportadoras cigam retrieved successfully',
      data: transportadoras
    })
  }

  findById = async (req: Request, res: Response) => {
    const id = String(req.params.id);
    const transportadora = await this.transportadorasCigamService.findById(id);

    res.status(200).json({
      success: true,
      message: 'Transportadora cigam retrieved successfully',
      data: transportadora
    })
  }

  findByIdCigam = async (req: Request, res: Response) => {
    const idCigam = String(req.params.idCigam);
    const transportadora = await this.transportadorasCigamService.findByIdCigam(idCigam);

    res.status(200).json({
      success: true,
      message: 'Transportadora cigam retrieved successfully',
      data: transportadora
    })
  }

  update = async (req: Request, res: Response) => {
    const id = String(req.params.id);
    const data = req.body;
    const transportadora = await this.transportadorasCigamService.update(id, data);

    res.status(200).json({
      success: true,
      message: 'Transportadora cigam updated successfully',
      data: transportadora
    })
  }

  delete = async (req: Request, res: Response) => {
    const id = String(req.params.id);
    await this.transportadorasCigamService.delete(id);

    res.status(200).json({
      success: true,
      message: 'Transportadora cigam deleted successfully'
    })
  }
}
