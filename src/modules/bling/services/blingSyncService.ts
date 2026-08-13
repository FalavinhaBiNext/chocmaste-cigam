import { inject, injectable } from 'tsyringe';
import { ProdutosService } from './produtosService';
import { ContatosService } from './contatosService';
import { FormaPagamentoBlingService } from './formaPagamentoBlingService';
import { ProdutoService } from '@/modules/produto/services/produtoService';
import { ClientesService } from '@/modules/clientes/services/clientesService';
import { FormaPagamentoService } from '@/modules/formaPagamento/services/formaPagamentoService';
import { TransportadoraService } from '@/modules/transportadora/services/transportadoraService';
import { SyncBlingResultDTO, ProdutoBlingDTO, ContatoBlingDTO, BlingFormaPagamentoDTO } from '../dto';
import { logger } from '@/shared/utils/logger';
import { delay } from '@/shared/utils/delay';

@injectable()
export class BlingSyncService {
  constructor(
    @inject(ProdutosService) private readonly blingProdutos: ProdutosService,
    @inject(ContatosService) private readonly blingContatos: ContatosService,
    @inject(FormaPagamentoBlingService) private readonly blingFormasPagamento: FormaPagamentoBlingService,
    @inject(ProdutoService) private readonly localProdutos: ProdutoService,
    @inject(ClientesService) private readonly localClientes: ClientesService,
    @inject(FormaPagamentoService) private readonly localFormasPagamento: FormaPagamentoService,
    @inject(TransportadoraService) private readonly localTransportadoras: TransportadoraService,
  ) {}

  async syncProdutos(onProgress?: (msg: string) => void, unidadeNegocio?: string, tokenId?: string): Promise<SyncBlingResultDTO> {
    const log = (msg: string, type: 'info' | 'success' | 'error' = 'info') => {
      if (type === 'success') logger.success(msg);
      else if (type === 'error') logger.error(msg);
      else logger.info(msg);
      if (onProgress) onProgress(msg);
    };
    log('Iniciando importação de produtos do Bling...');
    const result: SyncBlingResultDTO = { entity: 'produtos', imported: 0, updated: 0, errors: [] };

    try {
      const items = await this.blingProdutos.listAllWithDetails(onProgress, tokenId);
      log(`Encontrados ${items.length} produtos no Bling`);

      for (const item of items) {
        try {
          const existing = await this.tryFindProduto(String(item.id));
          const data = {
            id_bling: String(item.id),
            nome: item.nome,
            codigo: item.codigo,
            preco: item.preco || 0,
            tipo: item.tipo,
            situacao: item.situacao,
            formato: item.formato,
            descricaoCurta: item.descricaoCurta,
            unidade: item.unidade,
            tipoProduto: item.tipoProducao,
            condicao: item.condicao,
            marca: item.marca,
            categoria_id: item.categoria?.id,
            fornecedor_id: item.fornecedor?.id,
            fornecedor_nome: item.fornecedor?.contato?.nome,
            fornecedor_codigo: item.fornecedor?.codigo,
            fornecedor_precoCusto: item.fornecedor?.precoCusto,
            ncm: item.tributacao?.ncm,
            temVariacoes: (item.variacoes?.length || 0) > 0,
            quantidade_estoque: item.estoque?.saldoFisico || 0,
            ativo: item.situacao === 'A' || item.situacao === 'Ativo',
            unidade_negocio: unidadeNegocio,
          };

          if (existing) {
            await this.localProdutos.update(existing.id, data);
            result.updated++;
            log(`[PRODUTO] ${item.nome} atualizado com sucesso`, 'success');
          } else {
            await this.localProdutos.create(data);
            result.imported++;
            log(`[PRODUTO] ${item.nome} importado com sucesso`, 'success');
          }
        } catch (err: any) {
          result.errors.push(`Produto ${item.nome}: ${err.message}`);
          log(`Erro no produto ${item.nome}: ${err.message}`, 'error');
        }
      }

      log(`Produtos Bling finalizados: ${result.imported} importados, ${result.updated} atualizados`, 'success');
    } catch (error: any) {
      result.errors.push(error.message);
      log(`Erro na importação de produtos Bling: ${error.message}`, 'error');
    }

    return result;
  }

  async syncClientes(onProgress?: (msg: string) => void, tokenId?: string): Promise<SyncBlingResultDTO> {
    const log = (msg: string, type: 'info' | 'success' | 'error' = 'info') => {
      if (type === 'success') logger.success(msg);
      else if (type === 'error') logger.error(msg);
      else logger.info(msg);
      if (onProgress) onProgress(msg);
    };
    log('Iniciando importação de contatos do Bling...');
    const result: SyncBlingResultDTO = { entity: 'clientes', imported: 0, updated: 0, errors: [] };

    try {
      const items = await this.blingContatos.listAll(2, tokenId); // 2 = Cliente
      log(`Encontrados ${items.length} clientes no Bling`);

      for (const listItem of items) {
        try {
          await delay(350); // Small delay to avoid API rate limits
          const item = await this.blingContatos.getById(String(listItem.id), tokenId);

          const existing = await this.tryFindCliente(String(item.id));
          const endereco = item.endereco?.geral;
          const data = {
            id_bling: String(item.id),
            nome: item.nome,
            documento: item.numeroDocumento || item.cpfCnpj || undefined,
            telefone: item.telefone || undefined,
            celular: item.celular || undefined,
            email: item.email || undefined,
            endereco: endereco?.endereco,
            numero: endereco?.numero || undefined,
            complemento: endereco?.complemento || undefined,
            bairro: endereco?.bairro,
            cidade: endereco?.municipio,
            uf: endereco?.uf,
            cep: endereco?.cep,
            ie: item.ie || undefined,
            tipo: item.tipo || undefined,
            active: item.situacao === 'A' || item.situacao === 'Ativo',
          };

          if (existing) {
            await this.localClientes.update(existing.id, data);
            result.updated++;
            log(`[CLIENTE] ${item.nome} atualizado com sucesso`, 'success');
          } else {
            await this.localClientes.create(data);
            result.imported++;
            log(`[CLIENTE] ${item.nome} importado com sucesso`, 'success');
          }
        } catch (err: any) {
          result.errors.push(`Cliente ${listItem.nome}: ${err.message}`);
          log(`Erro no cliente ${listItem.nome}: ${err.message}`, 'error');
        }
      }

      log(`Clientes Bling finalizados: ${result.imported} importados, ${result.updated} atualizados`, 'success');
    } catch (error: any) {
      result.errors.push(error.message);
      log(`Erro na importação de clientes Bling: ${error.message}`, 'error');
    }

    return result;
  }

  async syncFormasPagamento(onProgress?: (msg: string) => void, tokenId?: string): Promise<SyncBlingResultDTO> {
    const log = (msg: string, type: 'info' | 'success' | 'error' = 'info') => {
      if (type === 'success') logger.success(msg);
      else if (type === 'error') logger.error(msg);
      else logger.info(msg);
      if (onProgress) onProgress(msg);
    };
    log('Iniciando importação de formas de pagamento do Bling...');
    const result: SyncBlingResultDTO = { entity: 'formas_pagamento', imported: 0, updated: 0, errors: [] };

    try {
      const items = await this.blingFormasPagamento.listAll(tokenId);
      log(`Encontradas ${items.length} formas de pagamento no Bling`);

      for (const item of items) {
        try {
          const existing = await this.tryFindFormaPagamento(String(item.id));
          const data = {
            id_bling: String(item.id),
            descricao: item.descricao,
            active: item.ativo,
          };

          if (existing) {
            await this.localFormasPagamento.update(existing.id, data);
            result.updated++;
            log(`[FORMA PAGAMENTO] ${item.descricao} atualizada com sucesso`, 'success');
          } else {
            await this.localFormasPagamento.create(data);
            result.imported++;
            log(`[FORMA PAGAMENTO] ${item.descricao} importada com sucesso`, 'success');
          }
        } catch (err: any) {
          result.errors.push(`Forma pagamento ${item.descricao}: ${err.message}`);
          log(`Erro na forma pagamento ${item.descricao}: ${err.message}`, 'error');
        }
      }

      log(`Formas pagamento Bling finalizadas: ${result.imported} importadas, ${result.updated} atualizadas`, 'success');
    } catch (error: any) {
      result.errors.push(error.message);
      log(`Erro na importação de formas de pagamento Bling: ${error.message}`, 'error');
    }

    return result;
  }

  async syncTransportadoras(onProgress?: (msg: string) => void, tokenId?: string): Promise<SyncBlingResultDTO> {
    const log = (msg: string, type: 'info' | 'success' | 'error' = 'info') => {
      if (type === 'success') logger.success(msg);
      else if (type === 'error') logger.error(msg);
      else logger.info(msg);
      if (onProgress) onProgress(msg);
    };
    log('Iniciando importação de transportadoras do Bling...');
    const result: SyncBlingResultDTO = { entity: 'transportadoras', imported: 0, updated: 0, errors: [] };

    try {
      const items = await this.blingContatos.listAll(undefined, tokenId);
      const transportadoras = items.filter(c => c.tipo === 'Transportador');
      log(`Encontradas ${transportadoras.length} transportadoras no Bling`);

      for (const item of transportadoras) {
        try {
          const existing = await this.tryFindTransportadora(String(item.id));
          const data = {
            id_bling: String(item.id),
            fantasia: item.fantasia || undefined,
            documento: item.numeroDocumento || item.cpfCnpj || undefined,
            nome: item.nome || `Transportadora ${item.id}`,
            active: item.situacao === 'A' || item.situacao === 'Ativo',
          };

          if (existing) {
            await this.localTransportadoras.update(existing.id, data);
            result.updated++;
            log(`[TRANSPORTADORA] ${item.nome} atualizada com sucesso`, 'success');
          } else {
            await this.localTransportadoras.create(data);
            result.imported++;
            log(`[TRANSPORTADORA] ${item.nome} importada com sucesso`, 'success');
          }
        } catch (err: any) {
          result.errors.push(`Transportadora ${item.nome}: ${err.message}`);
          log(`Erro na transportadora ${item.nome}: ${err.message}`, 'error');
        }
      }

      log(`Transportadoras Bling finalizadas: ${result.imported} importadas, ${result.updated} atualizadas`, 'success');
    } catch (error: any) {
      result.errors.push(error.message);
      log(`Erro na importação de transportadoras Bling: ${error.message}`, 'error');
    }

    return result;
  }

  async syncAll(onProgress?: (msg: string) => void, unidadeNegocio?: string, tokenId?: string): Promise<SyncBlingResultDTO[]> {
    const log = (msg: string, type: 'info' | 'success' | 'error' = 'info') => {
      if (type === 'success') logger.success(msg);
      else if (type === 'error') logger.error(msg);
      else logger.info(msg);
      if (onProgress) onProgress(msg);
    };
    log('Iniciando importação completa do Bling...');

    const results = [
      await this.syncProdutos(onProgress, unidadeNegocio, tokenId),
      await this.syncFormasPagamento(onProgress, tokenId),
      await this.syncTransportadoras(onProgress, tokenId),
    ];

    const totalImported = results.reduce((acc, r) => acc + r.imported, 0);
    const totalUpdated = results.reduce((acc, r) => acc + r.updated, 0);
    log(`Importação Bling completa finalizada: ${totalImported} importados, ${totalUpdated} atualizados`, 'success');
    return results;
  }

  private async tryFindProduto(idBling: string) {
    try {
      return await this.localProdutos.findByIdBling(idBling);
    } catch {
      return null;
    }
  }

  private async tryFindCliente(idBling: string) {
    try {
      return await this.localClientes.findByIdBling(idBling);
    } catch {
      return null;
    }
  }

  private async tryFindFormaPagamento(idBling: string) {
    try {
      return await this.localFormasPagamento.findByIdBling(idBling);
    } catch {
      return null;
    }
  }

  private async tryFindTransportadora(idBling: string) {
    try {
      return await this.localTransportadoras.findByIdBling(idBling);
    } catch {
      return null;
    }
  }
}
