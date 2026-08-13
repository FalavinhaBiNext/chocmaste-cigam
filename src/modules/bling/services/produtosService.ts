import { inject, injectable } from 'tsyringe';
import { BlingHttpClient } from './blingHttpClient';
import { ProdutoBlingResponse, BlingProdutosListResponse } from '../dto';
import { logger } from '@/shared/utils/logger';

@injectable()
export class ProdutosService {
  constructor(
    @inject(BlingHttpClient) private readonly blingHttpClient: BlingHttpClient
  ) {}

  async getById(idProduto: number | string, tokenId?: string): Promise<ProdutoBlingResponse> {
    return this.blingHttpClient.get<ProdutoBlingResponse>(`/produtos/${idProduto}`, undefined, tokenId);
  }

  async list(pagina: number = 1, limite: number = 100, tokenId?: string): Promise<BlingProdutosListResponse> {
    return this.blingHttpClient.get<BlingProdutosListResponse>(
      `/produtos?pagina=${pagina}&limite=${limite}`, undefined, tokenId
    );
  }

  async listAll(onLog?: (msg: string) => void, tokenId?: string): Promise<import('../dto').ProdutoBlingDTO[]> {
    const log = (msg: string) => {
      logger.info(msg);
      if (onLog) onLog(msg);
    };

    const all: import('../dto').ProdutoBlingDTO[] = [];
    let pagina = 1;

    while (true) {
      const response = await this.list(pagina, 100, tokenId);
      if (!response.data || response.data.length === 0) {
        break;
      }
      all.push(...response.data);
      log(`[BLING] Pagina ${pagina}: ${response.data.length} produtos encontrados`);
      pagina++;
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    return all;
  }

  async listAllWithDetails(onLog?: (msg: string) => void, tokenId?: string): Promise<any[]> {
    const log = (msg: string) => {
      logger.info(msg);
      if (onLog) onLog(msg);
    };

    const basicProducts = await this.listAll(onLog, tokenId);
    const detailedProducts: any[] = [];

    for (let i = 0; i < basicProducts.length; i++) {
      const product = basicProducts[i];
      try {
        const response = await this.getById(product.id, tokenId);
        detailedProducts.push(response.data);
        log(`[BLING] Produto ${i + 1}/${basicProducts.length}: ${product.nome} (ID: ${product.id})`);
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error: any) {
        log(`[BLING] Erro ao buscar produto ${product.id}: ${error.message}`);
        detailedProducts.push(product);
      }
    }

    return detailedProducts;
  }
}
