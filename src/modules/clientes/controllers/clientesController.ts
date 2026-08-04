import { injectable } from 'tsyringe';
import { Request, Response } from "express";
import { ClientesService } from "../services/clientesService";
import { validateCreateClientes } from "../clientes.validator";

@injectable()
export class ClientesController {
  constructor(
    private readonly clientesService: ClientesService
  ) {}

  health = (_req: Request, res: Response) => {
    res.status(200).json({
      success: true,
      status: 'ok',
      service: 'clientes',
      message: 'Clientes Service Running',
      timestamp: new Date().toISOString()
    })
  }

  create = async (req: Request, res: Response) => {
    const input = validateCreateClientes(req.body);
    const clientes = await this.clientesService.create(input);

    res.status(201).json({
      success: true,
      message: 'Cliente created successfully',
      data: clientes
    })
  }

  findAll = async (req: Request, res: Response) => {
    const unassociated = req?.query?.unassociated === 'true';
    const clientes = await this.clientesService.findAll({ unassociated });

    res.status(200).json({
      success: true,
      message: 'Clientes retrieved successfully',
      data: clientes
    })
  }

  findById = async (req: Request, res: Response) => {
    const id = String(req.params.id);
    const clientes = await this.clientesService.findById(id);

    res.status(200).json({
      success: true,
      message: 'Cliente retrieved successfully',
      data: clientes
    })
  }

  findByIdBling = async (req: Request, res: Response) => {
    const idBling = String(req.params.idBling);
    const clientes = await this.clientesService.findByIdBling(idBling);

    res.status(200).json({
      success: true,
      message: 'Cliente retrieved successfully',
      data: clientes
    })
  }

  update = async (req: Request, res: Response) => {
    const id = String(req.params.id);
    const data = req.body;
    const clientes = await this.clientesService.update(id, data);

    res.status(200).json({
      success: true,
      message: 'Cliente updated successfully',
      data: clientes
    })
  }

  delete = async (req: Request, res: Response) => {
    const id = String(req.params.id);
    await this.clientesService.delete(id);

    res.status(200).json({
      success: true,
      message: 'Cliente deleted successfully'
    })
  }
}
