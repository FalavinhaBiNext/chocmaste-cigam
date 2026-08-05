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

  syncProdutos = async (_req: Request, res: Response) => {
    const sendProgress = this.setupSSE(res);
    try {
      const result = await this.blingSyncService.syncProdutos(sendProgress);
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

  syncClientes = async (_req: Request, res: Response) => {
    const sendProgress = this.setupSSE(res);
    try {
      const result = await this.blingSyncService.syncClientes(sendProgress);
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

  syncFormasPagamento = async (_req: Request, res: Response) => {
    const sendProgress = this.setupSSE(res);
    try {
      const result = await this.blingSyncService.syncFormasPagamento(sendProgress);
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

  syncTransportadoras = async (_req: Request, res: Response) => {
    const sendProgress = this.setupSSE(res);
    try {
      const result = await this.blingSyncService.syncTransportadoras(sendProgress);
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

  syncAll = async (_req: Request, res: Response) => {
    const sendProgress = this.setupSSE(res);
    try {
      const results = await this.blingSyncService.syncAll(sendProgress);
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
