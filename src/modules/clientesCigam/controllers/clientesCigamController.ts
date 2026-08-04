import { injectable } from 'tsyringe';
import { Request, Response } from "express";
import { ClientesCigamService } from "../services/clientesCigamService";
import { validateCreateClientesCigam } from "../clientesCigam.validator";

@injectable()
export class ClientesCigamController {
  constructor(
    private readonly clientesCigamService: ClientesCigamService
  ) {}

  health = (_req: Request, res: Response) => {
    res.status(200).json({
      success: true,
      status: 'ok',
      service: 'clientes-cigam',
      message: 'Clientes Cigam Service Running',
      timestamp: new Date().toISOString()
    })
  }

  create = async (req: Request, res: Response) => {
    const input = validateCreateClientesCigam(req.body);
    const cliente = await this.clientesCigamService.create(input);

    res.status(201).json({
      success: true,
      message: 'Cliente cigam created successfully',
      data: cliente
    })
  }

  findAll = async (req: Request, res: Response) => {
    const clientes = await this.clientesCigamService.findAll();

    res.status(200).json({
      success: true,
      message: 'Clientes cigam retrieved successfully',
      data: clientes
    })
  }

  findById = async (req: Request, res: Response) => {
    const id = String(req.params.id);
    const cliente = await this.clientesCigamService.findById(id);

    res.status(200).json({
      success: true,
      message: 'Cliente cigam retrieved successfully',
      data: cliente
    })
  }

  findByIdCigam = async (req: Request, res: Response) => {
    const idCigam = String(req.params.idCigam);
    const cliente = await this.clientesCigamService.findByIdCigam(idCigam);

    res.status(200).json({
      success: true,
      message: 'Cliente cigam retrieved successfully',
      data: cliente
    })
  }

  update = async (req: Request, res: Response) => {
    const id = String(req.params.id);
    const data = req.body;
    const cliente = await this.clientesCigamService.update(id, data);

    res.status(200).json({
      success: true,
      message: 'Cliente cigam updated successfully',
      data: cliente
    })
  }

  delete = async (req: Request, res: Response) => {
    const id = String(req.params.id);
    await this.clientesCigamService.delete(id);

    res.status(200).json({
      success: true,
      message: 'Cliente cigam deleted successfully'
    })
  }
}
