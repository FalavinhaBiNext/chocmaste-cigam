import { inject, injectable } from 'tsyringe';
import { BlingOAuthService } from './blingOAuthService';
import { BlingHttpClient } from './blingHttpClient';
import { BlingRepository } from '../repositories/blingRepository';
import { BlingAuthUrlDTO } from '../dto';
import { IntegrationError } from '@/shared/errors/AppError';
import { logger } from '@/shared/utils/logger';

@injectable()
export class BlingService {
  constructor(
    @inject(BlingOAuthService) private readonly blingOAuthService: BlingOAuthService,
    @inject(BlingHttpClient) private readonly blingHttpClient: BlingHttpClient,
    @inject(BlingRepository) private readonly blingRepository: BlingRepository
  ) {}

  generateAuthURL(state?: string): BlingAuthUrlDTO {
    return this.blingOAuthService.generateAuthURL(state);
  }

  async handleCallback(code: string): Promise<void> {
    await this.blingOAuthService.exchangeCode(code);
  }

  async refreshToken(): Promise<void> {
    const token = await this.blingRepository.findActive();
    if (!token) {
      throw new IntegrationError('Nenhum token ativo para renovar.');
    }
    await this.blingOAuthService.refreshAccessToken(token.id);
  }

  async getTokenStatus(): Promise<{ authenticated: boolean; expiresAt: Date | null }> {
    const token = await this.blingRepository.findActive();
    return {
      authenticated: !!token,
      expiresAt: token?.expires_at || null
    };
  }

  getHttpClient(): BlingHttpClient {
    return this.blingHttpClient;
  }
}
