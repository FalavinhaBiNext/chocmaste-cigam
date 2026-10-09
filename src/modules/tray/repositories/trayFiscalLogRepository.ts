import { injectable } from 'tsyringe';
import { randomUUID } from 'crypto';
import { TrayFiscalLogModel, TrayFiscalLogOrigem } from '../models/trayFiscalLogModel';

export interface CreateTrayFiscalLogInput {
    metodo: 'POST' | 'PUT';
    origem: TrayFiscalLogOrigem;
    order_id: string;
    invoice_id?: string | null;
    url: string;
    request_body?: unknown;
    http_status?: number | null;
    response_body?: unknown;
    sucesso: boolean;
    erro?: string | null;
    duracao_ms?: number | null;
}

const serializar = (valor: unknown): string | null => {
    if (valor === undefined || valor === null) return null;
    return typeof valor === 'string' ? valor : JSON.stringify(valor);
};

@injectable()
export class TrayFiscalLogRepository {
    async create(data: CreateTrayFiscalLogInput): Promise<TrayFiscalLogModel> {
        return TrayFiscalLogModel.create({
            id: randomUUID(),
            metodo: data.metodo,
            origem: data.origem,
            order_id: String(data.order_id),
            invoice_id: data.invoice_id ?? null,
            url: data.url,
            request_body: serializar(data.request_body),
            http_status: data.http_status ?? null,
            response_body: serializar(data.response_body),
            sucesso: data.sucesso,
            erro: data.erro ?? null,
            duracao_ms: data.duracao_ms ?? null,
        });
    }

    async findByOrderId(orderId: string, limit = 50): Promise<TrayFiscalLogModel[]> {
        return TrayFiscalLogModel.findAll({
            where: { order_id: String(orderId) },
            order: [['created_at', 'DESC']],
            limit,
        });
    }

    async findRecent(limit = 50): Promise<TrayFiscalLogModel[]> {
        return TrayFiscalLogModel.findAll({
            order: [['created_at', 'DESC']],
            limit,
        });
    }
}
