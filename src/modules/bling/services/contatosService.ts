import { inject, injectable } from 'tsyringe';
import { BlingHttpClient } from './blingHttpClient';
import { ContatoBlingDTO, ContatoBlingListResponse, ContatoBlingSingleResponse, BlingContatosListResponse } from '../dto';
import { logger } from '@/shared/utils/logger';

@injectable()
export class ContatosService {
  constructor(
    @inject(BlingHttpClient) private readonly blingHttpClient: BlingHttpClient
  ) {}

  async search(nome?: string, cpfCnpj?: string, tokenId?: string): Promise<ContatoBlingDTO[]> {
    const params = new URLSearchParams();
    if (nome) params.append('nome', nome);
    if (cpfCnpj) params.append('cpfCnpj', cpfCnpj);
    const queryString = params.toString();
    const response = await this.blingHttpClient.get<ContatoBlingListResponse>(`/contatos${queryString ? `?${queryString}` : ''}`, undefined, tokenId);
    return response.data;
  }

  async list(pagina: number = 1, limite: number = 100, tipoContato?: number, tokenId?: string): Promise<BlingContatosListResponse> {
    const params = new URLSearchParams({
      pagina: String(pagina),
      limite: String(limite)
    });
    if (tipoContato !== undefined) {
      params.append('tipoContato', String(tipoContato));
    }
    return this.blingHttpClient.get<BlingContatosListResponse>(
      `/contatos?${params.toString()}`, undefined, tokenId
    );
  }

  async listAll(
    tipoContato?: number,
    onLogOrTokenId?: ((msg: string) => void) | string,
    tokenIdParam?: string,
  ): Promise<ContatoBlingDTO[]> {
    const onLog = typeof onLogOrTokenId === 'function' ? onLogOrTokenId : undefined;
    const tokenId = typeof onLogOrTokenId === 'string' ? onLogOrTokenId : tokenIdParam;

    const log = (msg: string) => {
      logger.info(msg);
      if (onLog) onLog(msg);
    };

    const all: ContatoBlingDTO[] = [];
    let pagina = 1;

    while (true) {
      log(`[BLING] Consultando página ${pagina} de contatos...`);
      const response = await this.list(pagina, 100, tipoContato, tokenId);
      if (!response.data || response.data.length === 0) {
        break;
      }
      all.push(...response.data);
      log(`[BLING] Página ${pagina}: ${response.data.length} contatos encontrados`);
      pagina++;
      await new Promise(resolve => setTimeout(resolve, 600));
    }

    log(`[BLING] Listagem finalizada: total de ${all.length} contatos obtidos em ${pagina - 1} páginas.`);
    return all;
  }

  async getById(id: string, tokenId?: string): Promise<ContatoBlingDTO> {
    const response = await this.blingHttpClient.get<ContatoBlingSingleResponse>(`/contatos/${id}`, undefined, tokenId);
    return response.data;
  }
}
