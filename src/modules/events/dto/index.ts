export interface CreateEventDTO {
    id: string;
    event: string;
    company_id: string;
    pedido_id: string;
    data_pedido: Date;
    numero_pedido?: string;
    numero_loja: string;
    total_pedido: number;
}

export interface ResponseEventDTO {
    id: string;
    event: string;
    company_id: string;
    pedido_id: number;
    data_pedido: Date;
    numero_pedido?: number;
    numero_loja: string;
    total_pedido: number;
    cigam_sincronizado: boolean;
    cigam_pedido_id: string | null;
    created_at: Date
}

export interface UpdateEventDTO {
    event?: string;
    company_id?: string;
    pedido_id?: string;
    data_pedido?: Date;
    numero_pedido?: string;
    numero_loja?: string;
    total_pedido?: number;
    cigam_sincronizado?: boolean;
    cigam_pedido_id?: string | null;
}