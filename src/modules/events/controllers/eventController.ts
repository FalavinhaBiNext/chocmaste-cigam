import { injectable } from 'tsyringe';
import { Request, Response } from "express";
import { validateCreateEvent } from "../events.validator";
import { EventService } from "../services/eventService";

@injectable()
export class EventController {
    constructor(
        private readonly eventService: EventService
    ) {}

    health = (_req: Request, res: Response) => {
        res.status(200).json({
            success: true,
            status: 'ok',
            service: 'event',
            message: 'Event Service Running',
            timestamp: new Date().toISOString()
        })
    }

    create = async (req: Request, res: Response) => {
        const input = validateCreateEvent(req.body);
        const event = await this.eventService.create(input);

        res.status(201).json({
            success: true,
            message: 'Event created successfully',
            data: event
        })
    }

    findAll = async (req: Request, res: Response) => {
        const events = await this.eventService.findAll()

        res.status(200).json({
            success: true,
            message: 'Events retrieved successfully',
            data: events
        })
    }

    findById = async (req: Request, res: Response) => {
        const { id } = req.params
        const event = await this.eventService.findById(String(id))

        res.status(200).json({
            success: true,
            message: 'Event retrieved successfully',
            data: event
        })
    }

    findByPedido = async (req: Request, res: Response) => {
        const pedido = Number(req.params.pedido)
        const event = await this.eventService.findByPedido(pedido)

        res.status(200).json({
            success: true,
            message: 'Event retrieved successfully',
            data: event
        })
    }

    findByNumeroPedido = async (req: Request, res: Response) => {
        const numero = Number(req.params.numero)
        const event = await this.eventService.findByNumeroPedido(numero)

        res.status(200).json({
            success: true,
            message: 'Event retrieved successfully',
            data: event
        })
    }
}