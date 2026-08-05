import { inject, injectable } from 'tsyringe';
import { BlingRepository } from '../repositories/blingRepository';
import { BlingOAuthService } from './blingOAuthService';
import { logger } from '@/shared/utils/logger';
import { RefreshTokenExpiredError } from '@/shared/errors/AppError';

@injectable()
export class BlingTokenScheduler {
  constructor(
    @inject(BlingRepository) private readonly blingRepository: BlingRepository,
    @inject(BlingOAuthService) private readonly blingOAuthService: BlingOAuthService,
  ) {}

  async checkAndRefresh(): Promise<{ refreshed: boolean; message: string; authUrl?: string }> {
    const token = await this.blingRepository.findActive();

    if (!token) {
      const { url: authUrl } = this.blingOAuthService.generateAuthURL();
      logger.auth('Nenhum token Bling ativo encontrado para renovação preventiva.');
      return {
        refreshed: false,
        message: 'Nenhum token ativo encontrado. É necessário autenticar na plataforma Bling.',
        authUrl,
      };
    }

    const expiresAt = token.expires_at ? new Date(token.expires_at) : null;
    const now = new Date();

    if (!expiresAt) {
      logger.auth('Token Bling não possui data de expiração. Renovação preventiva ignorada.');
      return {
        refreshed: false,
        message: 'Token sem data de expiração.',
      };
    }

    const hoursUntilExpiry = (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursUntilExpiry > 24) {
      logger.auth(`Token Bling ainda válido por ${Math.round(hoursUntilExpiry)}h. Renovação não necessária.`);
      return {
        refreshed: false,
        message: `Token ainda válido por ${Math.round(hoursUntilExpiry)}h.`,
      };
    }

    logger.auth(`Token Bling expira em ${Math.round(hoursUntilExpiry)}h. Iniciando renovação preventiva...`);

    try {
      await this.blingOAuthService.refreshAccessToken(token.id);

      const refreshedToken = await this.blingRepository.findActive();
      const newExpiry = refreshedToken?.expires_at
        ? new Date(refreshedToken.expires_at)
        : null;
      const newHours = newExpiry
        ? Math.round((newExpiry.getTime() - Date.now()) / (1000 * 60 * 60))
        : null;

      logger.success(`Token Bling renovado preventivamente. Nova expiração em ${newHours}h.`);

      return {
        refreshed: true,
        message: `Token renovado. Nova expiração em ${newHours}h.`,
      };
    } catch (error) {
      if (error instanceof RefreshTokenExpiredError) {
        logger.error('Refresh token Bling expirado. É necessário autenticar novamente.', {
          authUrl: error.authUrl
        });
        return {
          refreshed: false,
          message: error.message,
          authUrl: error.authUrl ?? undefined,
        };
      }
      throw error;
    }
  }
}
