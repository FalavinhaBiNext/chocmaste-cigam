import { ResponseEventDTO, UpdateEventDTO } from "../dto";
import { CreateEventInput } from "../events.validator";

export interface IEventRepository {
    create(data: CreateEventInput): Promise<ResponseEventDTO>;
    findAll(): Promise<ResponseEventDTO[]>;
    findById(id: string): Promise<ResponseEventDTO | null >;
    findByPedido(pedido_id: number): Promise<ResponseEventDTO | null>;
    findByNumeroPedido(numero_pedido: number): Promise<ResponseEventDTO | null >
    delete(id: string): Promise<void>;
}