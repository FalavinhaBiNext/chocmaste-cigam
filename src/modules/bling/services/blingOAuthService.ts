import { inject, injectable } from 'tsyringe';
import axios from 'axios';
import crypto from 'crypto';
import { BlingRepository } from "../repositories/blingRepository";
import { BlingAuthUrlDTO } from "../dto";
import { logger } from '@/shared/utils/logger';
import { IntegrationError } from '@/shared/errors/AppError';

@injectable()
export class BlingOAuthService {
  private readonly BLING_AUTHORIZE_URL = 'https://www.bling.com.br/Api/v3/oauth/authorize';
  private readonly BLING_TOKEN_URL = 'https://www.bling.com.br/Api/v3/oauth/token';

  constructor(
    @inject(BlingRepository) private readonly blingRepository: BlingRepository
  ) { }

  generateAuthURL(state?: string): BlingAuthUrlDTO {
    const clientId = process.env.BLING_CLIENT_ID!;
    const redirectUri = process.env.BLING_REDIRECT_URI!;
    const scope = process.env.BLING_SCOPE || 'all';
    const s = state || crypto.randomBytes(16).toString('hex');

    const url = new URL(this.BLING_AUTHORIZE_URL);
    url.searchParams.set('client_id', clientId);
    url.searchParams.set('redirect_uri', redirectUri);
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('scope', scope);
    url.searchParams.set('state', s);

    logger.auth('URL de autorização Bling gerada');

    return { url: url.toString(), state: s };
  }

  async acquireNewToken(code: string): Promise<void> {
    const clientId = process.env.BLING_CLIENT_ID!;
    const clientSecret = process.env.BLING_CLIENT_SECRET!;

    logger.auth('Adquirindo novo token Bling...');

    try {
      const basicAuth = Buffer
        .from(`${clientId}:${clientSecret}`)
        .toString('base64');

      const body = new URLSearchParams({
        grant_type: 'authorization_code',
        code
      });

      const response = await axios.post(this.BLING_TOKEN_URL, body, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Accept: 'application/json',
          Authorization: `Basic ${basicAuth}`,
          'enable-jwt': '1'
        },
        timeout: 15000
      });

      const {
        access_token,
        refresh_token,
        expires_in,
        scope,
        token_type
      } = response.data;

      const expiresAt = new Date(
        Date.now() + (expires_in || 3600) * 1000
      );

      await this.blingRepository.save({
        access_token,
        refresh_token,
        expires_at: expiresAt,
        scope: scope || 'all',
        token_type: token_type || 'Bearer',
        access_token_url: this.BLING_TOKEN_URL,
        client_id: clientId,
        client_secret: clientSecret,
        active: true
      });

      logger.success('Novo token Bling salvo com sucesso');
    } catch (error: any) {
      logger.error('Erro ao adquirir novo token Bling', {
        status: error.response?.status,
        data: error.response?.data
      });

      throw new IntegrationError(
        `Erro ao adquirir token Bling: ${error.response?.data?.error_description ||
        error.response?.data?.error ||
        error.message
        }`
      );
    }
  }

  async exchangeCode(code: string): Promise<void> {
    const clientId = process.env.BLING_CLIENT_ID!;
    const clientSecret = process.env.BLING_CLIENT_SECRET!;

    logger.auth('Trocando código de autorização por tokens...');

    try {
      const basicAuth = Buffer
        .from(`${clientId}:${clientSecret}`)
        .toString('base64');

      const body = new URLSearchParams({
        grant_type: 'authorization_code',
        code
      });

      console.log('PASSOU POR AQUI - ANTES DO POST PARA BLING')
      
      const response = await axios.post(
        this.BLING_TOKEN_URL,
        body.toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization: `Basic ${basicAuth}`,
            'enable-jwt': '1'
          },
          timeout: 15000
        }
      );
      
      const {
        access_token,
        refresh_token,
        expires_in,
        scope,
        token_type
      } = response.data;
      
      const expiresAt = new Date(Date.now() + (expires_in || 3600) * 1000);
      
      console.log('PASSOU POR AQUI - DEPOIS DO POST PARA BLING - ANTES DO SAVE')
      
      await this.blingRepository.save({
        access_token,
        refresh_token,
        expires_at: expiresAt,
        scope: scope || 'all',
        token_type: token_type || 'Bearer',
        access_token_url: this.BLING_TOKEN_URL,
        client_id: clientId,
        client_secret: clientSecret,
        active: true
      });

      logger.success('Tokens Bling obtidos e armazenados com sucesso');
    } catch (error: any) {
      logger.error('Falha ao trocar código por tokens Bling', {
        status: error.response?.status,
        data: error.response?.data
      });

      throw new IntegrationError(
        `Falha ao obter tokens Bling: ${error.response?.data?.error_description ||
        error.response?.data?.error ||
        error.message
        }`
      );
    }
  }

  async refreshAccessToken(currentTokenId: string): Promise<void> {
    const token = await this.blingRepository.findById(currentTokenId);
    if (!token) {
      throw new IntegrationError('Token Bling não encontrado para refresh');
    }

    logger.auth('Renovando token de acesso Bling...');

    try {
      const response = await axios.post(this.BLING_TOKEN_URL, null, {
        params: {
          grant_type: 'refresh_token',
          refresh_token: token.refresh_token,
          client_id: token.client_id,
          client_secret: token.client_secret
        },
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        timeout: 15000
      });

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
      logger.error('Falha ao renovar token Bling', {
        status: error.response?.status,
        data: error.response?.data
      });
      throw new IntegrationError(
        `Falha ao renovar token Bling: ${error.response?.data?.error || error.message}`
      );
    }
  }
}
