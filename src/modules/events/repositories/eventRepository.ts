import { injectable } from 'tsyringe';
import { Op } from 'sequelize';
import { EventModel } from "../models/eventModel";
import { IEventRepository } from "../interfaces/IEventRepository";
import { ResponseEventDTO } from "../dto";
import { CreateEventInput } from "../events.validator";
import { EventMapper } from "../mappers/EventMapper";
import { parseDateOnly } from "@/shared/utils/date";

@injectable()
export class EventRepository implements IEventRepository {
    async create(data: CreateEventInput): Promise<ResponseEventDTO> {
        const event = await EventModel.create({
            id: data.id,
            event: data.event,
            company_id: data.company_id,
            pedido_id: data.pedido_id,
            data_pedido: parseDateOnly(data.data_pedido) || undefined,
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

    async updateSyncStatus(id: string, data: {
        sync_status?: 'pendente' | 'sincronizado' | 'falha';
        error_message?: string | null;
        retry_count?: number;
        cigam_sincronizado?: boolean;
        cigam_pedido_id?: string | null;
    }): Promise<void> {
        await EventModel.update(data, { where: { id } });
    }

    async countBySyncStatus(): Promise<Record<string, number>> {
        const rows = await EventModel.findAll({
            attributes: [
                'sync_status',
                [EventModel.sequelize!.fn('COUNT', EventModel.sequelize!.col('id')), 'count'],
            ],
            group: ['sync_status'],
            raw: true,
        }) as unknown as Array<{ sync_status: string; count: string | number }>;

        return rows.reduce((acc, row) => {
            acc[row.sync_status] = Number(row.count);
            return acc;
        }, {} as Record<string, number>);
    }

    async findBySyncStatus(syncStatus: string): Promise<ResponseEventDTO[]> {
        const events = await EventModel.findAll({
            where: { sync_status: syncStatus },
            order: [['created_at', 'DESC']],
        });
        return events.map(EventMapper.eventToDTO);
    }

    async delete(id: string): Promise<void> {
        await EventModel.destroy({ where: { id } });
    }

    async findByIds(ids: string[]): Promise<ResponseEventDTO[]> {
        const events = await EventModel.findAll({ where: { id: { [Op.in]: ids } } });
        return events.map(EventMapper.eventToDTO);
    }

    /**
     * Exclui, numa única operação, apenas os eventos ainda não sincronizados
     * com o CIGAM. A condição cigam_sincronizado=false fica no próprio DELETE
     * para que um evento sincronizado entre a consulta e a exclusão não seja
     * apagado. Retorna a quantidade de registros removidos.
     */
    async deletePendingByIds(ids: string[]): Promise<number> {
        return EventModel.destroy({
            where: { id: { [Op.in]: ids }, cigam_sincronizado: false },
        });
    }
}