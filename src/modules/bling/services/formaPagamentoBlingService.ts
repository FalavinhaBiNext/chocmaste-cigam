import { inject, injectable } from 'tsyringe';
import { BlingHttpClient } from './blingHttpClient';
import { BlingFormaPagamentoDTO, BlingFormaPagamentoResponse, BlingFormasPagamentoListResponse } from '../dto';

@injectable()
export class FormaPagamentoBlingService {
  constructor(
    @inject(BlingHttpClient) private readonly blingHttpClient: BlingHttpClient
  ) {}

  async getById(id: string): Promise<BlingFormaPagamentoDTO> {
    const response = await this.blingHttpClient.get<BlingFormaPagamentoResponse>(`/formas-pagamentos/${id}`);
    return response.data;
  }

  async list(pagina: number = 1, limite: number = 100): Promise<BlingFormasPagamentoListResponse> {
    return this.blingHttpClient.get<BlingFormasPagamentoListResponse>(
      `/formas-pagamentos?pagina=${pagina}&limite=${limite}`
    );
  }

  async listAll(): Promise<BlingFormaPagamentoDTO[]> {
    const all: BlingFormaPagamentoDTO[] = [];
    let pagina = 1;

    while (true) {
      const response = await this.list(pagina, 100);
      if (!response.data || response.data.length === 0) {
        break;
      }
      all.push(...response.data);
      pagina++;
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    return all;
  }
}
