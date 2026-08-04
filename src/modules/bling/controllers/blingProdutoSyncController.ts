import { inject, injectable } from 'tsyringe';
import { Request, Response } from 'express';
import { BlingProdutoSyncService } from '../services/blingProdutoSyncService';
import { z } from 'zod';
import { ValidationError } from '@/shared/errors/AppError';
import { logger } from '@/shared/utils/logger';

const salvarProdutoSchema = z.object({
  id_bling: z.string().min(1, 'id_bling é obrigatório.'),
});

const salvarProdutosSchema = z.object({
  ids_bling: z.array(z.string()).min(1, 'ids_bling é obrigatório e deve conter ao menos 1 item.'),
});

@injectable()
export class BlingProdutoSyncController {
  constructor(
    @inject(BlingProdutoSyncService)
    private readonly syncService: BlingProdutoSyncService,
  ) {}

  private setupSSE(res: Response): (message: string) => void {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    return (message: string) => {
      res.write(`data: ${JSON.stringify({ type: 'log', message })}\n\n`);
    };
  }

  health = (_req: Request, res: Response) => {
    res.status(200).json({
      success: true,
      status: 'ok',
      service: 'bling-produto-sync',
      message: 'Bling Produto Sync Service Running',
      timestamp: new Date().toISOString(),
    });
  };

  salvarProduto = async (req: Request, res: Response) => {
    const result = salvarProdutoSchema.safeParse(req.body);
    if (!result.success) {
      throw new ValidationError('Dados inválidos.', result.error.flatten());
    }

    const produto = await this.syncService.salvarProduto(result.data.id_bling);

    res.status(201).json({
      success: true,
      message: 'Produto salvo com sucesso.',
      data: produto,
    });
  };

  salvarProdutos = async (req: Request, res: Response) => {
    const result = salvarProdutosSchema.safeParse(req.body);
    if (!result.success) {
      throw new ValidationError('Dados inválidos.', result.error.flatten());
    }

    const syncResult = await this.syncService.salvarProdutos(result.data.ids_bling);

    res.status(200).json({
      success: true,
      message: 'Sincronização de produtos finalizada.',
      data: syncResult,
    });
  };

  sincronizarTodos = async (_req: Request, res: Response) => {
    const sendProgress = this.setupSSE(res);

    try {
      const syncResult = await this.syncService.sincronizarTodosComFila((stats) => {
        sendProgress(`Progresso: ${stats.progress}% (${stats.completed}/${stats.total}) | Erros: ${stats.erros}`);
      });

      res.write(`data: ${JSON.stringify({ type: 'done', result: syncResult })}\n\n`);
    } catch (error: any) {
      logger.error(`Erro na sincronização: ${error.message}`);
      res.write(`data: ${JSON.stringify({ type: 'error', message: error.message })}\n\n`);
    } finally {
      res.end();
    }
  };

  sincronizarTodosComFila = async (_req: Request, res: Response) => {
    const sendProgress = this.setupSSE(res);

    try {
      const syncResult = await this.syncService.sincronizarTodosComFila(
        (stats) => {
          sendProgress(`Progresso: ${stats.progress}% (${stats.completed}/${stats.total}) | Erros: ${stats.erros} | Tempo: ${stats.tempoDecorrido} | Estimado: ${stats.tempoEstimado}`);
        },
        (msg) => {
          sendProgress(msg);
        }
      );

      res.write(`data: ${JSON.stringify({ type: 'done', result: syncResult })}\n\n`);
    } catch (error: any) {
      logger.error(`Erro na sincronização com fila: ${error.message}`);
      res.write(`data: ${JSON.stringify({ type: 'error', message: error.message })}\n\n`);
    } finally {
      res.end();
    }
  };
}
