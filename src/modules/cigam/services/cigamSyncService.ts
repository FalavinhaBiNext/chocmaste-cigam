import { inject, injectable } from 'tsyringe';
import { CigamHttpClient } from './cigamHttpClient';
import { UsuarioCigamService } from '@/modules/usuarioCigam/services/usuarioCigamService';
import { ProdutosCigamService } from '@/modules/produtosCigam/services/produtosCigamService';
import { ClientesCigamService } from '@/modules/clientesCigam/services/clientesCigamService';
import { FormasPagamentoCigamService } from '@/modules/formasPagamentoCigam/services/formasPagamentoCigamService';
import { TransportadorasCigamService } from '@/modules/transportadorasCigam/services/transportadorasCigamService';
import { NotFoundError } from '@/shared/errors/AppError';
import { logger } from '@/shared/utils/logger';
import { delay } from '@/shared/utils/delay';
import { SyncResultDTO } from '../dto';
import { CigamMaterialResponse, CigamPessoaResponse, CigamCondicaoPagamentoResponse } from './types';

@injectable()
export class CigamSyncService {
  constructor(
    @inject(CigamHttpClient) private readonly cigamHttpClient: CigamHttpClient,
    @inject(UsuarioCigamService) private readonly usuarioCigamService: UsuarioCigamService,
    @inject(ProdutosCigamService) private readonly produtosCigamService: ProdutosCigamService,
    @inject(ClientesCigamService) private readonly clientesCigamService: ClientesCigamService,
    @inject(FormasPagamentoCigamService) private readonly formasPagamentoCigamService: FormasPagamentoCigamService,
    @inject(TransportadorasCigamService) private readonly transportadorasCigamService: TransportadorasCigamService,
  ) {}

  async syncAll(ambiente: string): Promise<SyncResultDTO> {
    logger.info(`Iniciando sync completo do Cigam para ambiente: ${ambiente}`);

    const results: SyncResultDTO[] = await Promise.all([
      this.syncProdutos(ambiente),
      this.syncClientes(ambiente),
      this.syncTransportadoras(ambiente),
      this.syncFormasPagamento(ambiente),
    ]);

    const totalCreated = results.reduce((acc, r) => acc + r.created, 0);
    const totalUpdated = results.reduce((acc, r) => acc + r.updated, 0);
    const totalErrors = results.reduce((acc, r) => acc + r.errors.length, 0);
    const totalItems = results.reduce((acc, r) => acc + (r.total || 0), 0);

    const result: SyncResultDTO = {
      entity: 'all',
      created: totalCreated,
      updated: totalUpdated,
      errors: results.flatMap(r => r.errors),
      total: totalItems,
    };

    logger.success(`Sync completo finalizado. Criados: ${totalCreated}, Atualizados: ${totalUpdated}, Erros: ${totalErrors}`);
    return result;
  }

  async syncProdutos(ambiente?: string): Promise<SyncResultDTO> {
    let resolvedAmbiente = ambiente;
    if (!resolvedAmbiente) {
      const usuarios = await this.usuarioCigamService.findAll();
      const ativo = usuarios.find(u => u.ativo);
      resolvedAmbiente = ativo ? ativo.ambiente : 'homologacao';
    }
    logger.info(`Sincronizando produtos Cigam para ambiente: ${resolvedAmbiente}`);
    return this.syncEntity<CigamMaterialResponse>({
      ambiente: resolvedAmbiente,
      endpoint: '/API/api/suprimentos/es/Materiais/Buscar',
      mapItem: (item) => ({
        id_cigam: item.Material.Codigo,
        nome: item.Material.Descricao,
        unidade: item.Material.CodigoUnidadeMedida || null,
        preco: 0,
        quantidade_estoque: 0,
        ativo: true,
      }),
      findByIdCigam: (id) => this.produtosCigamService.findByIdCigam(id),
      update: (id, data) => this.produtosCigamService.update(id, data),
      create: (data) => this.produtosCigamService.create(data),
      entityName: 'produtos',
    });
  }

  async syncClientes(ambiente: string): Promise<SyncResultDTO> {
    logger.info(`Sincronizando clientes Cigam para ambiente: ${ambiente}`);
    return this.syncEntity<CigamPessoaResponse>({
      ambiente,
      endpoint: '/API/api/genericos/ge/Pessoa/Buscar',
      mapItem: (item) => ({
        id_cigam: item.Codigo,
        nome: item.NomeCompleto,
        documento: item.CnpjCpf || null,
        tipo_pessoa: item.CnpjCpf ? (item.CnpjCpf.length === 14 ? 'J' : 'F') : null,
        telefone: item.Telefone || null,
        endereco: item.Endereco || null,
        numero: item.Numero || null,
        bairro: item.Bairro || null,
        cidade: item.Cidade?.NomeMunicipio || null,
        uf: item.Cidade?.UF || null,
        ativo: item.Ativo,
      }),
      findByIdCigam: (id) => this.clientesCigamService.findByIdCigam(id),
      update: (id, data) => this.clientesCigamService.update(id, data),
      create: (data) => this.clientesCigamService.create(data),
      entityName: 'clientes',
    });
  }

  async syncTransportadoras(ambiente: string): Promise<SyncResultDTO> {
    logger.info(`Sincronizando transportadoras Cigam para ambiente: ${ambiente}`);
    return this.syncEntity<CigamPessoaResponse>({
      ambiente,
      endpoint: '/API/api/genericos/ge/Pessoa/Buscar',
      filter: (item) => item.Divisao === '70',
      mapItem: (item) => ({
        id_cigam: item.Codigo,
        nome: item.NomeCompleto,
        fantasia: item.Fantasia || null,
        documento: item.CnpjCpf || null,
        codigo_divisao: item.Divisao || '70',
        ativo: item.Ativo,
      }),
      findByIdCigam: (id) => this.transportadorasCigamService.findByIdCigam(id),
      update: (id, data) => this.transportadorasCigamService.update(id, data),
      create: (data) => this.transportadorasCigamService.create(data),
      entityName: 'transportadoras',
    });
  }

  async syncFormasPagamento(ambiente: string): Promise<SyncResultDTO> {
    logger.info(`Sincronizando formas de pagamento Cigam para ambiente: ${ambiente}`);
    return this.syncEntity<CigamCondicaoPagamentoResponse>({
      ambiente,
      endpoint: '/API/api/financas/gf/CondicaoPagamento/Buscar',
      mapItem: (item) => ({
        id_cigam: item.Codigo,
        descricao: item.Descricao,
        tipo: item.Forma || null,
        ativo: item.Ativo,
      }),
      findByIdCigam: (id) => this.formasPagamentoCigamService.findByIdCigam(id),
      update: (id, data) => this.formasPagamentoCigamService.update(id, data),
      create: (data) => this.formasPagamentoCigamService.create(data),
      entityName: 'formas-pagamento',
    });
  }

  private async syncEntity<T>(params: {
    ambiente: string;
    endpoint: string;
    filter?: (item: T) => boolean;
    mapItem: (item: T) => Record<string, any>;
    findByIdCigam: (id: string) => Promise<any>;
    update: (id: string, data: any) => Promise<any>;
    create: (data: any) => Promise<any>;
    entityName: string;
  }): Promise<SyncResultDTO> {
    const result: SyncResultDTO = { entity: params.entityName, created: 0, updated: 0, errors: [] };

    try {
      const usuarioCigam = await this.usuarioCigamService.findByEnv(params.ambiente);
      if (!usuarioCigam) {
        throw new Error(`Ambiente CIGAM "${params.ambiente}" não configurado.`);
      }
      const baseUrl = usuarioCigam.url_ambiente;

      const items = await this.cigamHttpClient.get<T[]>(baseUrl, params.ambiente, params.endpoint);
      const filtered = params.filter ? items.filter(params.filter) : items;
      result.total = filtered.length;

      logger.info(`Processando ${filtered.length} itens de ${params.entityName}`);

      for (const item of filtered) {
        try {
          const data = params.mapItem(item);
          const idCigam = String(data.id_cigam);

          try {
            const existing = await params.findByIdCigam(idCigam);
            await params.update(existing.id, data);
            result.updated++;
          } catch (error) {
            if (error instanceof NotFoundError) {
              await params.create(data);
              result.created++;
            } else {
              throw error;
            }
          }
        } catch (itemError: any) {
          const msg = itemError.message || 'Erro desconhecido';
          logger.error(`Erro ao sincronizar item de ${params.entityName}: ${msg}`);
          result.errors.push(msg);
        }

        await delay(100);
      }

      logger.success(`${params.entityName}: ${result.created} criados, ${result.updated} atualizados`);
    } catch (error: any) {
      const msg = error.message || 'Erro desconhecido';
      logger.error(`Falha na sincronização de ${params.entityName}: ${msg}`);
      result.errors.push(msg);
    }

    return result;
  }
}
