import { injectable, inject } from 'tsyringe';
import { ResponseCanalVendaDTO, UpdateCanalVendaDTO, BlingCanalVendaResponse } from "../dto";
import { CanalVendaRepository } from "../repositories/canalVendaRepository";
import { BlingHttpClient } from "@/modules/bling/services/blingHttpClient";
import { logger } from "@/shared/utils/logger";
import { NotFoundError } from "@/shared/errors/AppError";

@injectable()
export class CanalVendaService {
  constructor(
    @inject(CanalVendaRepository) private readonly canalVendaRepository: CanalVendaRepository,
    @inject(BlingHttpClient) private readonly blingHttpClient: BlingHttpClient
  ) {}

  async sincronizar(): Promise<ResponseCanalVendaDTO[]> {
    logger.api('Buscando canais de venda na API do Bling (GET /canais-venda)');

    const response = await this.blingHttpClient.get<BlingCanalVendaResponse>('/canais-venda');
    const canais = response.data || [];

    logger.info(`${canais.length} canais de venda encontrados na Bling`);

    const resultados: ResponseCanalVendaDTO[] = [];

    for (const canal of canais) {
      const existente = await this.canalVendaRepository.findByIdBling(String(canal.id));

      if (existente) {
        logger.process(`Atualizando canal de venda: ${canal.descricao} (ID Bling: ${canal.id})`);

        const atualizado = await this.canalVendaRepository.update(existente.id, {
          descricao: canal.descricao,
          tipo: canal.tipo,
          situacao: canal.situacao,
        });

        resultados.push(atualizado!);
      } else {
        logger.process(`Criando canal de venda: ${canal.descricao} (ID Bling: ${canal.id})`);

        const criado = await this.canalVendaRepository.create({
          id_bling: String(canal.id),
          descricao: canal.descricao,
          tipo: canal.tipo,
          situacao: canal.situacao,
          ativo: true,
        });

        resultados.push(criado);
      }
    }

    logger.success(`${resultados.length} canais de venda sincronizados com sucesso`);
    return resultados;
  }

  async findAll(): Promise<ResponseCanalVendaDTO[]> {
    logger.info('Listando todos os canais de venda');
    const canaisVenda = await this.canalVendaRepository.findAll();
    logger.success(`${canaisVenda.length} canais de venda encontrados`);
    return canaisVenda;
  }

  async findById(id: string): Promise<ResponseCanalVendaDTO> {
    logger.info(`Buscando canal de venda com ID: ${id}`);
    const canalVenda = await this.canalVendaRepository.findById(id);
    if (!canalVenda) {
      logger.error(`Canal de venda com ID: ${id} não encontrado`);
      throw new NotFoundError(`Canal de venda com ID: ${id} não encontrado`);
    }
    logger.success('Canal de venda encontrado');
    return canalVenda;
  }

  async update(id: string, data: UpdateCanalVendaDTO): Promise<ResponseCanalVendaDTO> {
    logger.info(`Atualizando canal de venda com ID: ${id}`);
    const existente = await this.canalVendaRepository.findById(id);
    if (!existente) {
      logger.error('Canal de venda não encontrado');
      throw new NotFoundError(`Canal de venda com ID: ${id} não encontrado`);
    }
    const canalVenda = await this.canalVendaRepository.update(id, data);
    logger.success('Canal de venda atualizado');
    return canalVenda!;
  }

  async delete(id: string): Promise<void> {
    logger.info(`Removendo canal de venda com ID: ${id}`);
    const existente = await this.canalVendaRepository.findById(id);
    if (!existente) {
      logger.error('Canal de venda não encontrado');
      throw new NotFoundError(`Canal de venda com ID: ${id} não encontrado`);
    }
    await this.canalVendaRepository.delete(id);
    logger.success('Canal de venda removido com sucesso');
  }
}
