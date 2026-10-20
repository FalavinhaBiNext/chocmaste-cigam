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

  /**
   * Busca contatos no Bling por CPF/CNPJ. Tenta o filtro `numeroDocumento` da
   * API v3 e, sem resultado, a busca textual `pesquisa`. Como um filtro que o
   * Bling não reconhece é ignorado (e a resposta traria contatos quaisquer),
   * só são aceitos os contatos cujo documento confere dígito a dígito.
   */
  async buscarPorDocumento(documento: string, tokenId?: string): Promise<ContatoBlingDTO[]> {
    const digitos = documento.replace(/\D/g, '');
    const confere = (c: ContatoBlingDTO) =>
      (c.numeroDocumento || c.cpfCnpj || '').replace(/\D/g, '') === digitos;

    for (const filtro of ['numeroDocumento', 'pesquisa']) {
      const response = await this.blingHttpClient.get<ContatoBlingListResponse>(
        `/contatos?${new URLSearchParams({ [filtro]: digitos }).toString()}`,
        undefined,
        tokenId,
      );
      const retornados = response?.data ?? [];
      const encontrados = retornados.filter(confere);
      logger.info(
        `[BLING CONTATOS] Busca por documento ${digitos} via "${filtro}": ${retornados.length} retornado(s), ${encontrados.length} com o documento exato.`,
      );
      if (encontrados.length > 0) {
        return [...new Map(encontrados.map((c) => [c.id, c])).values()];
      }
    }

    return [];
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
