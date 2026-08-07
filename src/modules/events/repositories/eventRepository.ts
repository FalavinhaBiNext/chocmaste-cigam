import { injectable } from 'tsyringe';
import { EventModel } from "../models/eventModel";
import { IEventRepository } from "../interfaces/IEventRepository";
import { ResponseEventDTO } from "../dto";
import { CreateEventInput } from "../events.validator";
import { EventMapper } from "../mappers/EventMapper";

@injectable()
export class EventRepository implements IEventRepository {
    async create(data: CreateEventInput): Promise<ResponseEventDTO> {
        const event = await EventModel.create({
            id: data.id,
            event: data.event,
            company_id: data.company_id,
            pedido_id: data.pedido_id,
            data_pedido: data.data_pedido,
            numero_pedido: data.numero_pedido,
            numero_loja: data.numero_loja,
            total_pedido: data.total_pedido
        })

        return EventMapper.eventToDTO(event)
    }

    async findAll(): Promise<ResponseEventDTO[]> {
        const events = await EventModel.findAll();
        if(events.length === 0){
            return []
        }
        return events.map(EventMapper.eventToDTO)
    }

    async findById(id: string): Promise<ResponseEventDTO | null> {
        const event = await EventModel.findByPk(id)
        if(!event){
            return null
        }
        return EventMapper.eventToDTO(event)
    }

    async findByPedido(pedido_id: number): Promise<ResponseEventDTO | null> {
        const event = await EventModel.findOne({
            where:{
                pedido_id: pedido_id
            }
        })
        if(!event){
            return null
        }
        return EventMapper.eventToDTO(event)
    }

    async findByNumeroPedido(numero_pedido: number): Promise<ResponseEventDTO | null> {
        const event = await EventModel.findOne({
            where: {
                numero_pedido: numero_pedido
            }
        })
        if(!event){
            return null
        }

        return EventMapper.eventToDTO(event)
    }

    async update(id: string, data: { cigam_sincronizado: boolean; cigam_pedido_id?: string | null }): Promise<void> {
        await EventModel.update(data, { where: { id } });
    }

    async delete(id: string): Promise<void> {
        await EventModel.destroy({ where: { id } });
    }
}