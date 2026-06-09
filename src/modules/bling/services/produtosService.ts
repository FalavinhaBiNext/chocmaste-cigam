import { inject, injectable } from 'tsyringe';
import { BlingHttpClient } from './blingHttpClient';
import { ProdutoBlingResponse } from '../dto';

@injectable()
export class ProdutosService {
  constructor(
    @inject(BlingHttpClient) private readonly blingHttpClient: BlingHttpClient
  ) {}

  async getById(idProduto: number | string): Promise<ProdutoBlingResponse> {
    return this.blingHttpClient.get<ProdutoBlingResponse>(`/produtos/${idProduto}`);
  }
}
