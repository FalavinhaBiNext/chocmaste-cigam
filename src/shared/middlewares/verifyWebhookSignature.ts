import { Request, Response, NextFunction } from 'express';
import { createHmac, timingSafeEqual } from 'crypto';
import { ValidationError } from '@/shared/errors/AppError';
import { logger } from '@/shared/utils/logger';

export function verifyWebhookSignature(req: Request, _res: Response, next: NextFunction): void {
  console.log('📩 [WEBHOOK] Headers:', JSON.stringify(req.headers, null, 2));
  console.log('📩 [WEBHOOK] Body:', JSON.stringify(req.body, null, 2));

  const signature = req.headers['x-bling-signature-256'] as string | undefined;

  if (!signature) {
    logger.warn('Webhook recebido sem assinatura x-bling-signature-256');
    next();
    return;
  }

  const clientSecret = process.env.BLING_CLIENT_SECRET;

  if (!clientSecret) {
    logger.warn('BLING_CLIENT_SECRET não configurado. Pulando verificação de assinatura.');
    next();
    return;
  }

  const rawBody: Buffer | undefined = (req as any).rawBody;
  if (!rawBody) {
    logger.warn('Raw body não disponível para verificação de assinatura');
    throw new ValidationError('Assinatura do webhook inválida.');
  }
  const expectedSignature = createHmac('sha256', clientSecret)
    .update(rawBody)
    .digest('hex');

  const expectedBuffer = Buffer.from(expectedSignature, 'utf-8');
  const receivedBuffer = Buffer.from(signature, 'utf-8');

  if (expectedBuffer.length !== receivedBuffer.length || !timingSafeEqual(expectedBuffer, receivedBuffer)) {
    logger.error('Assinatura do webhook inválida');
    throw new ValidationError('Assinatura do webhook inválida.');
  }

  logger.security('Assinatura do webhook verificada com sucesso');
  next();
}