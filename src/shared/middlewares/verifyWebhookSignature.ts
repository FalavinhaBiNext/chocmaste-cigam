import { Request, Response, NextFunction } from 'express';
import { logger } from '@/shared/utils/logger';

export function verifyWebhookSignature(req: Request, _res: Response, next: NextFunction): void {
  console.log('📩 [WEBHOOK] Headers:', JSON.stringify(req.headers, null, 2));
  console.log('📩 [WEBHOOK] Body:', JSON.stringify(req.body, null, 2));

  // TODO: reativar verificação de assinatura antes de subir para produção
  // const signature = req.headers['x-bling-signature-256'] as string | undefined;
  // const clientSecret = process.env.BLING_CLIENT_SECRET;
  // ... (código original de verificação)

  logger.warn('⚠️ Verificação de assinatura desabilitada para testes');
  next();
}