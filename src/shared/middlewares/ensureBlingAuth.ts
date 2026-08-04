import { Request, Response, NextFunction } from 'express';
import { container } from 'tsyringe';
import { BlingRepository } from '@/modules/bling/repositories/blingRepository';
import { BlingOAuthService } from '@/modules/bling/services/blingOAuthService';

export async function ensureBlingAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const blingRepository = container.resolve(BlingRepository);
  const token = await blingRepository.findActive();

  if (!token) {
    const blingOAuthService = container.resolve(BlingOAuthService);
    const { url } = blingOAuthService.generateAuthURL();

    res.status(401).json({
      success: false,
      message: 'Token Bling não encontrado. É necessário autenticar na plataforma Bling.',
      authUrl: url,
    });
    return;
  }

  next();
}
