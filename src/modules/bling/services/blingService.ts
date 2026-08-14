import { inject, injectable } from 'tsyringe';
import { BlingOAuthService } from './blingOAuthService';
import { BlingRepository } from '../repositories/blingRepository';
import { BlingAuthUrlDTO } from '../dto';
import { SaveTokenInput } from '../bling.validator';
import { IntegrationError } from '@/shared/errors/AppError';

export interface TokenStatusResponse {
  authenticated: boolean;
  expiresAt: Date | null;
  hoursUntilExpiry: number | null;
  needsRefresh: boolean;
  warning: string | null;
  authUrl: string | null;
}

export interface TokenStatusMultiAccountResponse {
  tokens: Array<{
    id: string;
    active: boolean;
    nome_unidade: string | null;
    company_id_bling: string | null;
    expiresAt: Date | null;
    hoursUntilExpiry: number | null;
    needsRefresh: boolean;
    warning: string | null;
  }>;
  authUrl: string | null;
}

@injectable()
export class BlingService {
  constructor(
    @inject(BlingOAuthService) private readonly blingOAuthService: BlingOAuthService,
    @inject(BlingRepository) private readonly blingRepository: BlingRepository
  ) {}

  generateAuthURL(state?: string, clientId?: string, clientSecret?: string): BlingAuthUrlDTO {
    return this.blingOAuthService.generateAuthURL(state, clientId, clientSecret);
  }

  async handleCallback(code: string, clientId?: string, clientSecret?: string): Promise<void> {
    await this.blingOAuthService.exchangeCode(code, clientId, clientSecret);
  }

  async refreshToken(): Promise<void> {
    const token = await this.blingRepository.findActive();
    if (!token) {
      throw new IntegrationError('Nenhum token ativo para renovar.');
    }
    await this.blingOAuthService.refreshAccessToken(token.id);
  }

  async manualSaveToken(data: SaveTokenInput): Promise<void> {
    const existing = await this.blingRepository.findActive();

    if (existing) {
      await this.blingRepository.update(existing.id, {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        access_token_url: data.access_token_url,
        client_id: data.client_id,
        client_secret: data.client_secret,
        expires_at: data.expires_at ? new Date(data.expires_at) : undefined,
        scope: data.scope,
        token_type: data.token_type,
        active: data.active,
      });
    } else {
      await this.blingRepository.save({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        access_token_url: data.access_token_url,
        client_id: data.client_id,
        client_secret: data.client_secret,
        expires_at: data.expires_at ? new Date(data.expires_at) : undefined,
        scope: data.scope,
        token_type: data.token_type,
        active: data.active,
      });
    }
  }

  async getTokenStatus(): Promise<TokenStatusResponse> {
    const token = await this.blingRepository.findActive();

    if (!token) {
      const { url } = this.blingOAuthService.generateAuthURL();
      return {
        authenticated: false,
        expiresAt: null,
        hoursUntilExpiry: null,
        needsRefresh: false,
        warning: 'Token Bling não encontrado. É necessário autenticar na plataforma.',
        authUrl: url,
      };
    }

    const expiresAt = token.expires_at ? new Date(token.expires_at) : null;
    const now = new Date();
    const hoursUntilExpiry = expiresAt
      ? Math.round((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60))
      : null;

    let warning: string | null = null;
    let needsRefresh = false;

    if (expiresAt && expiresAt <= now) {
      warning = 'Token Bling expirado. A renovação será tentada automaticamente na próxima requisição.';
      needsRefresh = true;
    } else if (hoursUntilExpiry !== null && hoursUntilExpiry < 24) {
      warning = `Token Bling expira em ${hoursUntilExpiry}h. Renovação preventiva recomendada.`;
      needsRefresh = true;
    } else if (hoursUntilExpiry !== null && hoursUntilExpiry < 72) {
      warning = `Token Bling expira em aproximadamente ${hoursUntilExpiry}h.`;
      needsRefresh = false;
    }

    return {
      authenticated: true,
      expiresAt: token.expires_at,
      hoursUntilExpiry,
      needsRefresh,
      warning,
      authUrl: null,
    };
  }

  async getTokenStatusMultiAccount(): Promise<TokenStatusMultiAccountResponse> {
    const allTokens = await this.blingRepository.findAll();
    const now = new Date();

    const tokens = allTokens.map(token => {
      const expiresAt = token.expires_at ? new Date(token.expires_at) : null;
      const hoursUntilExpiry = expiresAt
        ? Math.round((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60))
        : null;

      let warning: string | null = null;
      let needsRefresh = false;

      if (token.active) {
        if (expiresAt && expiresAt <= now) {
          warning = 'Token expirado.';
          needsRefresh = true;
        } else if (hoursUntilExpiry !== null && hoursUntilExpiry < 24) {
          warning = `Expira em ${hoursUntilExpiry}h.`;
          needsRefresh = true;
        }
      }

      return {
        id: token.id,
        active: token.active,
        nome_unidade: token.nome_unidade,
        company_id_bling: token.company_id_bling,
        expiresAt: token.expires_at,
        hoursUntilExpiry,
        needsRefresh,
        warning,
      };
    });

    const hasActiveTokens = tokens.some(t => t.active);
    const { url: authUrl } = this.blingOAuthService.generateAuthURL();

    return {
      tokens,
      authUrl: hasActiveTokens ? null : authUrl,
    };
  }

}
