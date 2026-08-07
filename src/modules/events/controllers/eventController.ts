import { inject, injectable } from 'tsyringe';
import { Request, Response } from "express";
import { validateWebhookEvent } from "../events.validator";
import { EventService } from "../services/eventService";
import { WebhookService } from "../../bling/services/webhookService";
import { BlingHttpClient } from "../../bling/services/blingHttpClient";
import { CigamPedidoService } from "../../cigam/services/cigamPedidoService";
import { logger } from "@/shared/utils/logger";

@injectable()
export class EventController {
    constructor(
        private readonly eventService: EventService,
        private readonly webhookService: WebhookService,
        @inject(BlingHttpClient) private readonly blingHttpClient: BlingHttpClient,
        @inject(CigamPedidoService) private readonly cigamPedidoService: CigamPedidoService,
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
        const input = validateWebhookEvent(req.body);
        
        // Execute the full integration flow (fetches from Bling API, registers customer, carrier, items, saves to DB, integrates CIGAM)
        const cigamPedidoId = await this.webhookService.processarPedidoCriado(input as any);

        res.status(201).json({
            success: true,
            message: 'Event and order processed successfully',
            data: {
                codigoPedidoCigam: cigamPedidoId
            }
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

    retryCigamSync = async (req: Request, res: Response) => {
        const { id } = req.params
        const event = await this.eventService.findById(String(id))

        if (!event) {
            res.status(404).json({
                success: false,
                message: 'Evento não encontrado.'
            })
            return
        }

        if (event.cigam_sincronizado) {
            res.status(400).json({
                success: false,
                message: 'Este pedido já foi sincronizado com o CIGAM.'
            })
            return
        }

        logger.info(`Iniciando retry CIGAM para evento ${id}, pedido Bling #${event.pedido_id}`)

        const pedidoCompleto = await this.blingHttpClient.getPedido(event.pedido_id)
        const data: any = pedidoCompleto.data

        const cigamPedidoId = await this.cigamPedidoService.enviarPedido(data)

        await this.eventService.updateCigamStatus(event.id, true, cigamPedidoId)

        logger.success(`Retry CIGAM concluído para evento ${id}, código CIGAM: ${cigamPedidoId}`)

        res.status(200).json({
            success: true,
            message: 'Pedido sincronizado com o CIGAM com sucesso.',
            data: {
                cigamPedidoId
            }
        })
    }

    delete = async (req: Request, res: Response) => {
        const { id } = req.params
        await this.eventService.delete(String(id))

        res.status(200).json({
            success: true,
            message: 'Evento excluído com sucesso.'
        })
    }
}