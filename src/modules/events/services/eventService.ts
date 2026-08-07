import { injectable, inject } from 'tsyringe';
import { CreateEventInput } from "../events.validator";
import { ResponseEventDTO } from "../dto";
import { logger } from "@/shared/utils/logger";
import { NotFoundError } from "@/shared/errors/AppError";
import { EventRepository } from "../repositories/eventRepository";
import { randomUUID } from 'crypto';

@injectable()
export class EventService {
    constructor(
        @inject(EventRepository) private readonly eventRepository: EventRepository
    ) {}

    async create(data: any): Promise<ResponseEventDTO>{
        const id = randomUUID()
        logger.info('Starting event creation')
        logger.event('Performing data processing')
        const payload = {
            id: id,
            event: data.event,
            company_id: data.companyId,
            data_pedido: data.data.data,
            pedido_id: data.data.id,
            numero_pedido: data.data.numero,
            numero_loja: data.data.numeroLoja,
            total_pedido: data.data.total
        }
        const event = await this.eventRepository.create(payload)
        logger.success('Event Created successfully')
        return event;
    }

    async findAll(): Promise<ResponseEventDTO[]>{
        logger.info('Searching all events')
        const events = await this.eventRepository.findAll();
        logger.success(`${events.length} Events retrevied. `)
        return events
    }

    async findById(id: string): Promise<ResponseEventDTO | null>{
        logger.info(`Searching Event with ID: ${id}`)
        const event = await this.eventRepository.findById(id)
        if(!event){
            logger.error(`Event with ID: ${id} not found`)
            throw new NotFoundError(`Event with ID: ${id} not found`)
        }
        logger.finish('Event Found...')
        return event
    }

    async findByPedido(pedido: number): Promise<ResponseEventDTO | null>{
        logger.info(`Searching Event with PEDIDO ID: ${pedido}`)
        const event = await this.eventRepository.findByPedido(pedido)
        if(!event){
            logger.error(`Event with PEDIDO ID: ${pedido} not found`)
            throw new NotFoundError(`Event with PEDIDO ID: ${pedido} not found`)
        }
        logger.finish('Event found...')
        return event
    }

    async findByNumeroPedido(numero: number): Promise<ResponseEventDTO | null>{
        logger.info(`Searching Event with NUMERO PEDIDO: ${numero}`)
        const event = await this.eventRepository.findByNumeroPedido(numero)
        if(!event){
            logger.error(`Event with NUMERO PEDIDO: ${numero} not found`)
            throw new NotFoundError(`Event with NUMERO PEDIDO: ${numero} not found`)
        }
        logger.finish('Event found...')
        return event
    }

    async updateCigamStatus(id: string, cigamSincronizado: boolean, cigamPedidoId?: string | null): Promise<void>{
        await this.eventRepository.update(id, { cigam_sincronizado: cigamSincronizado, cigam_pedido_id: cigamPedidoId })
        logger.success(`Evento ${id} atualizado: cigam_sincronizado=${cigamSincronizado}`)
    }

    async delete(id: string): Promise<void>{
        const event = await this.eventRepository.findById(id)
        if(!event){
            throw new NotFoundError(`Event with ID: ${id} not found`)
        }
        await this.eventRepository.delete(id)
        logger.success(`Event ${id} deleted successfully`)
    }
}