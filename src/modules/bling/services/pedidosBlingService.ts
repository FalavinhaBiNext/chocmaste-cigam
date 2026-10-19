import { inject, injectable } from 'tsyringe';
import { BlingHttpClient } from './blingHttpClient';
import { BlingPedidoDataDTO } from '../dto/blingPedido.dto';
import { AppError } from '@/shared/errors/AppError';

interface BlingPedidosListResponse {
  data: Array<{ id: number; numero: number }>;
}

@injectable()
export class PedidosBlingService {
  constructor(
    @inject(BlingHttpClient) private readonly blingHttpClient: BlingHttpClient
  ) {}

  async getById(id: string, tokenId?: string): Promise<BlingPedidoDataDTO> {
    if (!/^\d+$/.test(id)) {
      throw new AppError('O ID do pedido Bling deve ser numérico.', 400);
    }
    const response = await this.blingHttpClient.getPedido(Number(id), tokenId);
    return response.data;
  }

  async getByNumero(numero: string, tokenId?: string): Promise<BlingPedidoDataDTO> {
    if (!/^\d+$/.test(numero)) {
      throw new AppError('O número do pedido Bling deve ser numérico.', 400);
    }
    const lista = await this.blingHttpClient.get<BlingPedidosListResponse>(
      `/pedidos/vendas?numero=${numero}`, undefined, tokenId
    );
    const encontrado = lista.data?.find(p => String(p.numero) === numero);
    if (!encontrado) {
      throw new AppError(`Pedido Bling #${numero} não encontrado.`, 404);
    }
    return this.getById(String(encontrado.id), tokenId);
  }
}
