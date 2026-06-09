import { ResponseEventDTO } from "../dto";

export class EventMapper {
    static eventToDTO(model: any): ResponseEventDTO {
        const eventModel = model.get({ plain: true });
        return {
            id: eventModel.id,
            event: eventModel.event,
            company_id: eventModel.company_id, 
            pedido_id: eventModel.pedido_id,
            data_pedido: eventModel.data_pedido,
            numero_pedido: eventModel.numero_pedido,
            numero_loja: eventModel.numero_loja,
            total_pedido: eventModel.total_pedido,
            created_at: eventModel.created_at
        }
    }
}