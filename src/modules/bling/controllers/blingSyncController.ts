import { inject, injectable } from 'tsyringe';
import { Request, Response } from 'express';
import { BlingSyncService } from '../services/blingSyncService';
import { RefreshTokenExpiredError } from '@/shared/errors/AppError';

@injectable()
export class BlingSyncController {
  constructor(
    @inject(BlingSyncService) private readonly blingSyncService: BlingSyncService
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

  syncProdutos = async (req: Request, res: Response) => {
    const sendProgress = this.setupSSE(res);
    const { unidade_negocio, token_id } = req.body || {};
    try {
      const result = await this.blingSyncService.syncProdutos(sendProgress, unidade_negocio, token_id);
      res.write(`data: ${JSON.stringify({ type: 'done', result })}\n\n`);
    } catch (err: any) {
      if (err instanceof RefreshTokenExpiredError) {
        res.write(`data: ${JSON.stringify({
          type: 'auth_required',
          message: err.message,
          authUrl: err.authUrl
        })}\n\n`);
      } else {
        res.write(`data: ${JSON.stringify({ type: 'error', message: err.message })}\n\n`);
      }
    } finally {
      res.end();
    }
  };

  syncClientes = async (req: Request, res: Response) => {
    const sendProgress = this.setupSSE(res);
    const { token_id } = req.body || {};
    try {
      const result = await this.blingSyncService.syncClientes(sendProgress, token_id);
      res.write(`data: ${JSON.stringify({ type: 'done', result })}\n\n`);
    } catch (err: any) {
      if (err instanceof RefreshTokenExpiredError) {
        res.write(`data: ${JSON.stringify({
          type: 'auth_required',
          message: err.message,
          authUrl: err.authUrl
        })}\n\n`);
      } else {
        res.write(`data: ${JSON.stringify({ type: 'error', message: err.message })}\n\n`);
      }
    } finally {
      res.end();
    }
  };

  syncFormasPagamento = async (req: Request, res: Response) => {
    const sendProgress = this.setupSSE(res);
    const { token_id } = req.body || {};
    try {
      const result = await this.blingSyncService.syncFormasPagamento(sendProgress, token_id);
      res.write(`data: ${JSON.stringify({ type: 'done', result })}\n\n`);
    } catch (err: any) {
      if (err instanceof RefreshTokenExpiredError) {
        res.write(`data: ${JSON.stringify({
          type: 'auth_required',
          message: err.message,
          authUrl: err.authUrl
        })}\n\n`);
      } else {
        res.write(`data: ${JSON.stringify({ type: 'error', message: err.message })}\n\n`);
      }
    } finally {
      res.end();
    }
  };

  syncTransportadoras = async (req: Request, res: Response) => {
    const sendProgress = this.setupSSE(res);
    const { token_id } = req.body || {};
    try {
      const result = await this.blingSyncService.syncTransportadoras(sendProgress, token_id);
      res.write(`data: ${JSON.stringify({ type: 'done', result })}\n\n`);
    } catch (err: any) {
      if (err instanceof RefreshTokenExpiredError) {
        res.write(`data: ${JSON.stringify({
          type: 'auth_required',
          message: err.message,
          authUrl: err.authUrl
        })}\n\n`);
      } else {
        res.write(`data: ${JSON.stringify({ type: 'error', message: err.message })}\n\n`);
      }
    } finally {
      res.end();
    }
  };

  syncAll = async (req: Request, res: Response) => {
    const sendProgress = this.setupSSE(res);
    const { unidade_negocio, token_id } = req.body || {};
    try {
      const results = await this.blingSyncService.syncAll(sendProgress, unidade_negocio, token_id);
      res.write(`data: ${JSON.stringify({ type: 'done', result: results })}\n\n`);
    } catch (err: any) {
      if (err instanceof RefreshTokenExpiredError) {
        res.write(`data: ${JSON.stringify({
          type: 'auth_required',
          message: err.message,
          authUrl: err.authUrl
        })}\n\n`);
      } else {
        res.write(`data: ${JSON.stringify({ type: 'error', message: err.message })}\n\n`);
      }
    } finally {
      res.end();
    }
  };
}
