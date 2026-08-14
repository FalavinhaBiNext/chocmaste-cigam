import { inject, injectable } from 'tsyringe';
import axios from 'axios';
import crypto from 'crypto';
import { BlingRepository } from "../repositories/blingRepository";
import { BlingAuthUrlDTO } from "../dto";
import { logger } from '@/shared/utils/logger';
import { IntegrationError, RefreshTokenExpiredError } from '@/shared/errors/AppError';

@injectable()
export class BlingOAuthService {
  private readonly BLING_AUTHORIZE_URL = 'https://www.bling.com.br/Api/v3/oauth/authorize';
  private readonly BLING_TOKEN_URL = 'https://www.bling.com.br/Api/v3/oauth/token';

  constructor(
    @inject(BlingRepository) private readonly blingRepository: BlingRepository
  ) { }

  generateAuthURL(state?: string, clientId?: string, clientSecret?: string): BlingAuthUrlDTO {
    const finalClientId = clientId || process.env.BLING_CLIENT_ID!;
    const finalClientSecret = clientSecret || process.env.BLING_CLIENT_SECRET!;
    const redirectUri = process.env.BLING_REDIRECT_URI!;
    const scope = process.env.BLING_SCOPE || 'all';
    const s = state || crypto.randomBytes(16).toString('hex');

    // Incluir client_id e client_secret no state para recuperar no callback
    const stateData = Buffer.from(JSON.stringify({
      state: s,
      client_id: finalClientId,
      client_secret: finalClientSecret
    })).toString('base64');

    const url = new URL(this.BLING_AUTHORIZE_URL);
    url.searchParams.set('client_id', finalClientId);
    url.searchParams.set('redirect_uri', redirectUri);
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('scope', scope);
    url.searchParams.set('state', stateData);

    logger.auth('URL de autorização Bling gerada');

    return { url: url.toString(), state: s };
  }

  async exchangeCode(code: string, clientId?: string, clientSecret?: string): Promise<void> {
    const finalClientId = clientId || process.env.BLING_CLIENT_ID!;
    const finalClientSecret = clientSecret || process.env.BLING_CLIENT_SECRET!;

    logger.auth('Trocando código de autorização por tokens...');

    try {
      const basicAuth = Buffer
        .from(`${finalClientId}:${finalClientSecret}`)
        .toString('base64');

      const body = new URLSearchParams({
        grant_type: 'authorization_code',
        code
      });

      const response = await axios.post(
        this.BLING_TOKEN_URL,
        body.toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization: `Basic ${basicAuth}`,
          },
          timeout: 15000
        }
      );

      logger.auth('Resposta completa do Bling', {
        responseKeys: Object.keys(response.data || {}),
        hasAccessToken: !!response.data?.access_token,
        hasRefreshToken: !!response.data?.refresh_token,
        expiresInRaw: response.data?.expires_in,
        expiresInType: typeof response.data?.expires_in,
        scope: response.data?.scope,
        tokenType: response.data?.token_type,
      });

      const {
        access_token,
        refresh_token,
        expires_in,
        scope,
        token_type
      } = response.data;

      // Bling pode retornar expires_in em segundos (padrão) ou milissegundos
      // Se o valor for muito grande (> 100000), provavelmente já está em milissegundos
      const expiresInMs = expires_in > 100000 ? expires_in : (expires_in || 3600) * 1000;
      const expiresAt = new Date(Date.now() + expiresInMs);
      logger.auth('Token calculado com expiração', {
        expiresAt: expiresAt.toISOString(),
        expiresInSeconds: expires_in,
        calculatedMs: expiresInMs,
      });

      // Buscar company_id via API do Bling
      let companyIdBling: string | undefined;
      try {
        const userResponse = await axios.get(
          'https://www.bling.com.br/Api/v3/usuarios/me',
          {
            headers: {
              Authorization: `Bearer ${access_token}`,
              Accept: 'application/json',
            },
            timeout: 10000,
          }
        );
        companyIdBling = userResponse.data?.data?.company?.id;
        if (companyIdBling) {
          logger.auth(`CompanyId Bling obtido: ${companyIdBling}`);
        }
      } catch {
        logger.warn('Não foi possível obter companyId do Bling via /usuarios/me');
      }

      // Verificar se já existe um token para esta empresa
      let existingToken = null;
      if (companyIdBling) {
        existingToken = await this.blingRepository.findByCompanyIdBling(companyIdBling);
      }

      if (existingToken) {
        // Atualizar token existente da mesma empresa
        logger.auth(`Atualizando token existente para empresa ${companyIdBling}`);
        await this.blingRepository.update(existingToken.id, {
          access_token,
          refresh_token,
          expires_at: expiresAt,
          scope: scope || 'all',
          token_type: token_type || 'Bearer',
        });
      } else {
        // Criar novo token (sem desativar os outros)
        await this.blingRepository.save({
          access_token,
          refresh_token,
          expires_at: expiresAt,
          scope: scope || 'all',
          token_type: token_type || 'Bearer',
          access_token_url: this.BLING_TOKEN_URL,
          client_id: finalClientId,
          client_secret: finalClientSecret,
          active: true,
          company_id_bling: companyIdBling
        });
      }

      logger.success('Tokens Bling obtidos e armazenados com sucesso');
    } catch (error: any) {
      const errorMsg = error.response?.data?.error_description ||
        (typeof error.response?.data?.error === 'object'
          ? JSON.stringify(error.response?.data?.error)
          : error.response?.data?.error) ||
        error.message;

      logger.error('Falha ao trocar código por tokens Bling', {
        status: error.response?.status,
        data: error.response?.data
      });

      throw new IntegrationError(`Falha ao obter tokens Bling: ${errorMsg}`);
    }
  }

  async refreshAccessToken(currentTokenId: string): Promise<void> {
    const token = await this.blingRepository.findById(currentTokenId);
    if (!token) {
      throw new IntegrationError('Token Bling não encontrado para refresh');
    }

    logger.auth('Renovando token de acesso Bling...');

    try {
      const basicAuth = Buffer
        .from(`${token.client_id}:${token.client_secret}`)
        .toString('base64');

      const body = new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: token.refresh_token
      });

      const response = await axios.post(
        this.BLING_TOKEN_URL,
        body.toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization: `Basic ${basicAuth}`
          },
          timeout: 15000
        }
      );

      const { access_token, refresh_token, expires_in, scope, token_type } = response.data;

      const expiresAt = new Date();
      expiresAt.setSeconds(expiresAt.getSeconds() + (expires_in || 3600));

      await this.blingRepository.update(currentTokenId, {
        access_token,
        refresh_token: refresh_token || token.refresh_token,
        expires_at: expiresAt,
        scope: scope || token.scope,
        token_type: token_type || token.token_type
      });

      logger.success('Token de acesso Bling renovado com sucesso');
    } catch (error: any) {
      const errorData = error.response?.data?.error;
      const errorDescription = error.response?.data?.error_description;

      // Detecta refresh token expirado
      if (errorData?.type === 'invalid_grant' || errorDescription === 'Refresh token has expired') {
        const { url: authUrl } = this.generateAuthURL();
        logger.error('Refresh token Bling expirado. É necessário autenticar novamente.', {
          authUrl
        });
        throw new RefreshTokenExpiredError(
          'O token de acesso do Bling expirou. É necessário autenticar novamente na plataforma Bling.',
          authUrl
        );
      }

      const errorMsg = errorDescription ||
        (typeof errorData === 'object'
          ? JSON.stringify(errorData)
          : errorData) ||
        error.message;

      logger.error('Falha ao renovar token Bling', {
        status: error.response?.status,
        data: error.response?.data
      });
      throw new IntegrationError(`Falha ao renovar token Bling: ${errorMsg}`);
    }
  }
}
