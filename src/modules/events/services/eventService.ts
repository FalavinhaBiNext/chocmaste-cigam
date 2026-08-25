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
        const existingEvent = await this.eventRepository.findByPedido(data.data.id);
        if (existingEvent) {
            logger.info(`Evento já existe para o pedido ${data.data.id}. Retornando existente.`);
            return existingEvent;
        }

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

    async findAll(syncStatus?: 'pendente' | 'sincronizado' | 'falha'): Promise<ResponseEventDTO[]>{
        logger.info(syncStatus ? `Searching events with sync_status=${syncStatus}` : 'Searching all events')
        const events = syncStatus
            ? await this.eventRepository.findBySyncStatus(syncStatus)
            : await this.eventRepository.findAll();
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
            logger.info(`Event with PEDIDO ID: ${pedido} not found`)
            return null
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

    /**
     * Marca a integração do pedido com o CIGAM como falha, preservando o motivo
     * do erro e incrementando o contador de tentativas — em vez de só logar.
     */
    async markSyncFailure(eventId: string, errorMessage: string): Promise<void>{
        const event = await this.eventRepository.findById(eventId)
        const retryCount = (event?.retry_count ?? 0) + 1
        await this.eventRepository.updateSyncStatus(eventId, {
            sync_status: 'falha',
            error_message: errorMessage,
            retry_count: retryCount,
        })
        logger.error(`Evento ${eventId} marcado como falha de sincronização (tentativa ${retryCount}): ${errorMessage}`)
    }

    /**
     * Marca a integração do pedido com o CIGAM como concluída, limpando o erro
     * anterior (se houver) e preservando o retry_count acumulado.
     */
    async markSyncSuccess(eventId: string, cigamPedidoId?: string | null): Promise<void>{
        const event = await this.eventRepository.findById(eventId)
        await this.eventRepository.updateSyncStatus(eventId, {
            sync_status: 'sincronizado',
            error_message: null,
            retry_count: event?.retry_count ?? 0,
            cigam_sincronizado: true,
            cigam_pedido_id: cigamPedidoId ?? null,
        })
        logger.success(`Evento ${eventId} marcado como sincronizado com o CIGAM`)
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