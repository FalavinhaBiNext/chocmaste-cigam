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
    const allTokens = await this.blingRepository.findAll();
    const activeTokens = allTokens.filter(t => t.active);

    if (activeTokens.length === 0) {
      const { url: authUrl } = this.blingOAuthService.generateAuthURL();
      logger.auth('Nenhum token Bling ativo encontrado para renovação preventiva.');
      return {
        refreshed: false,
        message: 'Nenhum token ativo encontrado. É necessário autenticar na plataforma Bling.',
        authUrl,
      };
    }

    let refreshedCount = 0;
    let lastError: { message: string; authUrl?: string } | null = null;

    for (const token of activeTokens) {
      const expiresAt = token.expires_at ? new Date(token.expires_at) : null;
      const now = new Date();

      if (!expiresAt) {
        logger.auth(`Token ${token.id} (${token.nome_unidade || 'sem nome'}) não possui data de expiração. Ignorando.`);
        continue;
      }

      const hoursUntilExpiry = (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60);

      if (hoursUntilExpiry > 24) {
        logger.auth(`Token ${token.id} (${token.nome_unidade || 'sem nome'}) ainda válido por ${Math.round(hoursUntilExpiry)}h.`);
        continue;
      }

      logger.auth(`Token ${token.id} (${token.nome_unidade || 'sem nome'}) expira em ${Math.round(hoursUntilExpiry)}h. Renovando...`);

      try {
        await this.blingOAuthService.refreshAccessToken(token.id);
        refreshedCount++;
        logger.success(`Token ${token.id} renovado com sucesso.`);
      } catch (error) {
        if (error instanceof RefreshTokenExpiredError) {
          logger.error(`Refresh token do Bling ${token.id} expirado. É necessário autenticar novamente.`);
          lastError = { message: error.message, authUrl: error.authUrl ?? undefined };
        } else {
          throw error;
        }
      }
    }

    if (refreshedCount > 0) {
      return {
        refreshed: true,
        message: `${refreshedCount} token(s) renovado(s) com sucesso.`,
      };
    }

    if (lastError) {
      return {
        refreshed: false,
        message: lastError.message,
        authUrl: lastError.authUrl,
      };
    }

    return {
      refreshed: false,
      message: `Todos os ${activeTokens.length} token(s) ainda válidos.`,
    };
  }
}
