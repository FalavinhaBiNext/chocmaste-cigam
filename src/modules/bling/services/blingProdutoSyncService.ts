import { inject, injectable } from 'tsyringe';
import { ProdutosService } from './produtosService';
import { ProdutoRepository } from '@/modules/produto/repositories/produtoRepository';
import { CreateProdutoInput } from '@/modules/produto/produto.validator';
import { ResponseProdutoDTO } from '@/modules/produto/dto';
import { BlingQueue } from './blingQueue';
import { logger } from '@/shared/utils/logger';

interface BlingProdutoData {
  id: number;
  nome: string;
  codigo?: string;
  preco?: number;
  tipo?: string;
  situacao?: string;
  formato?: string;
  descricaoCurta?: string;
  unidade?: string;
  tipoProducao?: string;
  condicao?: number;
  marca?: string;
  categoria?: { id?: number };
  fornecedor?: {
    id?: number;
    contato?: { id?: number; nome?: string };
    codigo?: string;
    precoCusto?: number;
  };
  tributacao?: { ncm?: string };
  variacoes?: any[];
}

export interface SyncResult {
  criados: number;
  atualizados: number;
  erros: string[];
}

@injectable()
export class BlingProdutoSyncService {
  constructor(
    @inject(ProdutosService) private readonly blingProdutosService: ProdutosService,
    @inject(ProdutoRepository) private readonly produtoRepository: ProdutoRepository,
  ) {}

  async salvarProduto(idBling: string): Promise<ResponseProdutoDTO> {
    logger.info(`Buscando produto Bling #${idBling}...`);

    const response = await this.blingProdutosService.getById(idBling);
    const blingProduto = response.data as BlingProdutoData;

    const produtoData = this.mapearParaProduto(blingProduto);

    const existente = await this.produtoRepository.findByIdBling(idBling);

    if (existente) {
      logger.info(`Produto já existe localmente (ID: ${existente.id}). Atualizando...`);
      const atualizado = await this.produtoRepository.update(existente.id, produtoData);
      logger.success(`Produto #${idBling} atualizado com sucesso`);
      return atualizado!;
    }

    logger.info(`Produto não encontrado localmente. Criando...`);
    const criado = await this.produtoRepository.create({
      id_bling: idBling,
      ...produtoData,
    });
    logger.success(`Produto #${idBling} criado com sucesso (ID local: ${criado.id})`);
    return criado;
  }

  async salvarProdutos(idsBling: string[]): Promise<SyncResult> {
    const result: SyncResult = { criados: 0, atualizados: 0, erros: [] };

    for (const idBling of idsBling) {
      try {
        const existente = await this.produtoRepository.findByIdBling(idBling);
        await this.salvarProduto(idBling);

        if (existente) {
          result.atualizados++;
        } else {
          result.criados++;
        }
      } catch (error: any) {
        result.erros.push(`Produto Bling #${idBling}: ${error.message}`);
        logger.error(`Erro ao salvar produto Bling #${idBling}: ${error.message}`);
      }
    }

    logger.success(`Sincronização Bling: ${result.criados} criados, ${result.atualizados} atualizados, ${result.erros.length} erros`);
    return result;
  }

  async sincronizarTodos(): Promise<SyncResult> {
    logger.info('Iniciando sincronização de todos os produtos Bling...');

    const produtosBling = await this.blingProdutosService.listAllWithDetails((msg) => {
      logger.info(msg);
    });
    logger.info(`Encontrados ${produtosBling.length} produtos no Bling`);

    const result: SyncResult = { criados: 0, atualizados: 0, erros: [] };

    for (const produtoBling of produtosBling) {
      try {
        const blingId = String(produtoBling.id);
        const existente = await this.produtoRepository.findByIdBling(blingId);

        const produtoData = this.mapearParaProduto(produtoBling as BlingProdutoData);

        if (existente) {
          await this.produtoRepository.update(existente.id, produtoData);
          result.atualizados++;
        } else {
          await this.produtoRepository.create({
            id_bling: blingId,
            ...produtoData,
          });
          result.criados++;
        }
      } catch (error: any) {
        result.erros.push(`Produto ${produtoBling.nome}: ${error.message}`);
        logger.error(`Erro ao sincronizar produto ${produtoBling.nome}: ${error.message}`);
      }
    }

    logger.success(`Sincronização completa: ${result.criados} criados, ${result.atualizados} atualizados, ${result.erros.length} erros`);
    return result;
  }

  async sincronizarTodosComFila(
    onProgress?: (stats: { progress: number; completed: number; total: number; erros: number; tempoEstimado: string; tempoDecorrido: string }) => void,
    onLog?: (msg: string) => void
  ): Promise<SyncResult> {
    logger.info('Iniciando sincronização de todos os produtos Bling com fila...');

    const inicio = Date.now();

    const produtosBling = await this.blingProdutosService.listAllWithDetails((msg) => {
      logger.info(msg);
      if (onLog) onLog(msg);
    });
    logger.info(`Encontrados ${produtosBling.length} produtos no Bling`);

    // Envia progresso inicial para mostrar a barra no frontend
    if (onProgress) {
      onProgress({
        progress: 0,
        completed: 0,
        total: produtosBling.length,
        erros: 0,
        tempoEstimado: 'Calculando...',
        tempoDecorrido: '0s',
      });
    }

    const queue = new BlingQueue({
      concurrency: 1,
      delayBetweenRequests: 1000,
      maxRetries: 3,
      retryDelay: 2000,
    });

    const result: SyncResult = { criados: 0, atualizados: 0, erros: [] };
    const total = produtosBling.length;

    const formatTime = (ms: number): string => {
      const seconds = Math.floor(ms / 1000);
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      if (minutes > 0) {
        return `${minutes}m ${remainingSeconds}s`;
      }
      return `${seconds}s`;
    };

    const progressInterval = setInterval(() => {
      if (onProgress) {
        const stats = queue.getStats();
        const tempoDecorrido = Date.now() - inicio;
        const completed = stats.completed + stats.failed;
        const tempoEstimado = completed > 0
          ? formatTime((tempoDecorrido / completed) * (total - completed))
          : 'Calculando...';

        onProgress({
          progress: queue.getProgress(),
          completed,
          total,
          erros: stats.failed,
          tempoEstimado,
          tempoDecorrido: formatTime(tempoDecorrido),
        });
      }
    }, 1000);

    const tasks = produtosBling.map(produtoBling => ({
      id: String(produtoBling.id),
      execute: async () => {
        const blingId = String(produtoBling.id);
        const existente = await this.produtoRepository.findByIdBling(blingId);
        const produtoData = this.mapearParaProduto(produtoBling as BlingProdutoData);

        if (existente) {
          await this.produtoRepository.update(existente.id, produtoData);
          return { action: 'updated' as const };
        } else {
          await this.produtoRepository.create({
            id_bling: blingId,
            ...produtoData,
          });
          return { action: 'created' as const };
        }
      },
    }));

    const results = await queue.addBatch(tasks);

    clearInterval(progressInterval);

    for (const r of results) {
      if (r.action === 'created') result.criados++;
      else result.atualizados++;
    }

    const queueStats = queue.getStats();
    for (let i = 0; i < queueStats.failed; i++) {
      result.erros.push('Erro desconhecido na fila');
    }

    logger.success(`Sincronização com fila completa: ${result.criados} criados, ${result.atualizados} atualizados, ${result.erros.length} erros`);
    return result;
  }

  private mapearParaProduto(bling: BlingProdutoData): Omit<CreateProdutoInput, 'id_bling'> {
    return {
      nome: bling.nome,
      codigo: bling.codigo,
      preco: bling.preco || 0,
      tipo: bling.tipo,
      situacao: bling.situacao,
      formato: bling.formato,
      descricaoCurta: bling.descricaoCurta,
      unidade: bling.unidade,
      tipoProduto: bling.tipoProducao,
      condicao: bling.condicao,
      marca: bling.marca,
      categoria_id: bling.categoria?.id,
      fornecedor_id: bling.fornecedor?.id,
      fornecedor_nome: bling.fornecedor?.contato?.nome,
      fornecedor_codigo: bling.fornecedor?.codigo,
      fornecedor_precoCusto: bling.fornecedor?.precoCusto,
      ncm: bling.tributacao?.ncm,
      temVariacoes: (bling.variacoes?.length || 0) > 0,
      quantidade_estoque: 0,
      ativo: bling.situacao === 'A' || bling.situacao === 'Ativo',
    };
  }
}
