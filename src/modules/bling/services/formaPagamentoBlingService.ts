import { inject, injectable } from 'tsyringe';
import { BlingHttpClient } from './blingHttpClient';
import { BlingFormaPagamentoDTO, BlingFormaPagamentoResponse, BlingFormasPagamentoListResponse } from '../dto';

@injectable()
export class FormaPagamentoBlingService {
  constructor(
    @inject(BlingHttpClient) private readonly blingHttpClient: BlingHttpClient
  ) {}

  async getById(id: string, tokenId?: string): Promise<BlingFormaPagamentoDTO> {
    const response = await this.blingHttpClient.get<BlingFormaPagamentoResponse>(`/formas-pagamentos/${id}`, undefined, tokenId);
    return response.data;
  }

  async list(pagina: number = 1, limite: number = 100, tokenId?: string): Promise<BlingFormasPagamentoListResponse> {
    return this.blingHttpClient.get<BlingFormasPagamentoListResponse>(
      `/formas-pagamentos?pagina=${pagina}&limite=${limite}`, undefined, tokenId
    );
  }

  async listAll(tokenId?: string): Promise<BlingFormaPagamentoDTO[]> {
    const all: BlingFormaPagamentoDTO[] = [];
    let pagina = 1;

    while (true) {
      const response = await this.list(pagina, 100, tokenId);
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
