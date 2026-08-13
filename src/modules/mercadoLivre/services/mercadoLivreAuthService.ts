import { inject, injectable } from 'tsyringe';
import axios from 'axios';
import { MercadoLivreTokenRepository } from '../repositories/mercadoLivreTokenRepository';
import { MercadoLivreTokenResponse, MercadoLivreUserResponse } from '../dto';
import { logger } from '@/shared/utils/logger';

const ML_API_BASE = 'https://api.mercadolibre.com';
const ML_AUTH_URL = 'https://auth.mercadolibre.com.ar';

@injectable()
export class MercadoLivreAuthService {
  constructor(
    @inject(MercadoLivreTokenRepository) private readonly tokenRepository: MercadoLivreTokenRepository,
  ) {}

  /**
   * Gera a URL de autorização para redirecionar o usuário.
   * O fluxo OAuth2 é: Authorization Code Grant (Server Side)
   */
  generateAuthURL(appId: string, redirectUri: string, state?: string): string {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: appId,
      redirect_uri: redirectUri,
    });

    if (state) {
      params.append('state', state);
    }

    return `${ML_AUTH_URL}/authorization?${params.toString()}`;
  }

  /**
   * Troca o authorization_code por access_token e refresh_token.
   * Endpoint: POST https://api.mercadolibre.com/oauth/token
   */
  async exchangeCodeForToken(
    code: string,
    appId: string,
    clientSecret: string,
    redirectUri: string,
  ): Promise<MercadoLivreTokenResponse> {
    logger.auth('Trocando authorization code por token no Mercado Livre...');

    const response = await axios.post<MercadoLivreTokenResponse>(
      `${ML_API_BASE}/oauth/token`,
      new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: appId,
        client_secret: clientSecret,
        code,
        redirect_uri: redirectUri,
      }).toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Accept: 'application/json',
        },
      },
    );

    const tokenData = response.data;

    // Buscar dados do usuário para salvar nickname
    let nickname: string | undefined;
    try {
      const userResponse = await axios.get<MercadoLivreUserResponse>(
        `${ML_API_BASE}/users/me`,
        {
          headers: { Authorization: `Bearer ${tokenData.access_token}` },
        },
      );
      nickname = userResponse.data.nickname;
    } catch {
      logger.warn('Não foi possível obter dados do usuário ML.');
    }

    // Salvar token no banco
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + tokenData.expires_in);

    await this.tokenRepository.save({
      user_id_ml: String(tokenData.user_id),
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expires_at: expiresAt,
      scope: tokenData.scope,
      token_type: tokenData.token_type,
      app_id: appId,
      nickname,
    });

    // Ativar este token (desativar os outros)
    await this.tokenRepository.setActive(String(tokenData.user_id));

    logger.success(`Token Mercado Livre salvo com sucesso. User ID: ${tokenData.user_id}, Nickname: ${nickname}`);
    return tokenData;
  }

  /**
   * Renova o access_token usando o refresh_token.
   * Endpoint: POST https://api.mercadolibre.com/oauth/token
   * IMPORTANTE: O refresh_token é de uso único. Um novo refresh_token é retornado a cada renovação.
   */
  async refreshAccessToken(refreshToken: string, appId: string): Promise<MercadoLivreTokenResponse> {
    logger.auth('Renovando token Mercado Livre via refresh_token...');

    const response = await axios.post<MercadoLivreTokenResponse>(
      `${ML_API_BASE}/oauth/token`,
      new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: appId,
        refresh_token: refreshToken,
      }).toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Accept: 'application/json',
        },
      },
    );

    const tokenData = response.data;
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + tokenData.expires_in);

    // Atualizar token existente
    const existingToken = await this.tokenRepository.findActive();
    if (existingToken) {
      await this.tokenRepository.save({
        user_id_ml: existingToken.user_id_ml,
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        expires_at: expiresAt,
        scope: tokenData.scope,
        token_type: tokenData.token_type,
        app_id: existingToken.app_id,
        nickname: existingToken.nickname || undefined,
      });
    }

    logger.success('Token Mercado Livre renovado com sucesso.');
    return tokenData;
  }

  /**
   * Obtém a URL de autorização para um novo usuário.
   */
  getAuthUrlForNewUser(appId: string, redirectUri: string): string {
    return this.generateAuthURL(appId, redirectUri);
  }
}
