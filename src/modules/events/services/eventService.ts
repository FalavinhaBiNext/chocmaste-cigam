import { injectable, inject } from 'tsyringe';
import { CreateEventInput } from "../events.validator";
import { ResponseEventDTO } from "../dto";
import { logger } from "@/shared/utils/logger";
import { NotFoundError } from "@/shared/errors/AppError";
import { EventRepository } from "../repositories/eventRepository";

@injectable()
export class EventService {
    constructor(
        @inject(EventRepository) private readonly eventRepository: EventRepository
    ) {}

    async create(data: CreateEventInput): Promise<ResponseEventDTO>{
        logger.info('Starting event creation')
        const event = await this.eventRepository.create(data)
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
}