import { inject, injectable } from 'tsyringe';
import axios from 'axios';
import { TrayTokenRepository } from '../repositories/trayTokenRepository';
import { TrayAuthResponse, TrayRefreshResponse, TrayTokenDTO, TrayErrorResponse } from '../dto';
import { logger } from '@/shared/utils/logger';
import { IntegrationError, RefreshTokenExpiredError } from '@/shared/errors/AppError';

@injectable()
export class TrayAuthService {
  constructor(
    @inject(TrayTokenRepository) private readonly tokenRepository: TrayTokenRepository,
  ) {}

  /**
   * Gera a URL de redirecionamento para a tela de autorização da loja Tray (Etapa 1).
   * https://{storeDomain}/auth.php?response_type=code&consumer_key={consumer_key}&callback={callback}
   */
  generateAuthURL(storeDomain: string, consumerKey?: string, callbackUrl?: string): string {
    const finalConsumerKey = consumerKey || process.env.TRAY_CONSUMER_KEY;
    const finalCallbackUrl = callbackUrl || process.env.TRAY_CALLBACK_URL;

    if (!finalConsumerKey || !finalCallbackUrl) {
      throw new IntegrationError('TRAY_CONSUMER_KEY e TRAY_CALLBACK_URL não configurados no servidor.');
    }

    const domain = this.normalizeDomain(storeDomain);
    const url = new URL(`https://${domain}/auth.php`);
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('consumer_key', finalConsumerKey);
    url.searchParams.set('callback', finalCallbackUrl);

    logger.auth('URL de autorização Tray gerada', { domain });

    return url.toString();
  }

  /**
   * Troca o authorization code pelo par access_token/refresh_token (Etapa 3).
   * POST https://{api_address}/auth
   * api_address já vem com o sufixo /web_api no callback — nunca removê-lo.
   */
  async exchangeCodeForToken(
    apiAddress: string,
    code: string,
    consumerKey?: string,
    consumerSecret?: string,
  ): Promise<TrayTokenDTO> {
    const finalConsumerKey = consumerKey || process.env.TRAY_CONSUMER_KEY;
    const finalConsumerSecret = consumerSecret || process.env.TRAY_CONSUMER_SECRET;

    if (!finalConsumerKey || !finalConsumerSecret) {
      throw new IntegrationError('TRAY_CONSUMER_KEY e TRAY_CONSUMER_SECRET não configurados no servidor.');
    }

    logger.auth('Trocando authorization code por token na Tray...');
    logger.api(`Chamando POST https://${apiAddress}/auth`);

    try {
      const response = await axios.post<TrayAuthResponse>(
        `https://${apiAddress}/auth`,
        {
          consumer_key: finalConsumerKey,
          consumer_secret: finalConsumerSecret,
          code,
        },
        {
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          timeout: 15000,
        },
      );

      const tokenData = response.data;

      logger.success('Token recebido da API da Tray', {
        store_id: tokenData.store_id,
        date_expiration_access_token: tokenData.date_expiration_access_token,
      });

      // Garante apenas uma loja Tray ativa por vez.
      logger.database('Desativando tokens anteriores');
      await this.tokenRepository.deactivateAll();

      await this.tokenRepository.save({
        store_id: tokenData.store_id,
        api_address: apiAddress,
        consumer_key: finalConsumerKey,
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        date_expiration_access_token: new Date(tokenData.date_expiration_access_token),
        date_expiration_refresh_token: new Date(tokenData.date_expiration_refresh_token),
        date_activated: tokenData.date_activated ? new Date(tokenData.date_activated) : null,
      });

      await this.tokenRepository.setActive(tokenData.store_id);

      logger.success(`Token Tray salvo com sucesso. Store ID: ${tokenData.store_id}`);

      return (await this.tokenRepository.findByStoreId(tokenData.store_id))!;
    } catch (error: any) {
      throw this.mapAuthError(error, 'Falha ao gerar chaves de acesso Tray');
    }
  }

  /**
   * Renova o access_token usando o refresh_token (válido por 30 dias, uso único não documentado
   * como obrigatório — mas o novo refresh_token retornado deve substituir o anterior).
   * GET https://{api_address}/auth?refresh_token={refresh_token}
   */
  async refreshAccessToken(tokenId?: string): Promise<TrayTokenDTO> {
    const token = tokenId
      ? await this.tokenRepository.findById(tokenId)
      : await this.tokenRepository.findActive();

    if (!token) {
      throw new IntegrationError('Token Tray não encontrado para renovação.');
    }

    logger.auth('Renovando token Tray via refresh_token...');
    logger.api(`Chamando GET https://${token.api_address}/auth`);

    try {
      const response = await axios.get<TrayRefreshResponse>(
        `https://${token.api_address}/auth`,
        {
          params: { refresh_token: token.refresh_token },
          headers: { Accept: 'application/json' },
          timeout: 15000,
        },
      );

      const tokenData = response.data;

      await this.tokenRepository.updateTokens(token.id, {
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        date_expiration_access_token: new Date(tokenData.date_expiration_access_token),
        date_expiration_refresh_token: new Date(tokenData.date_expiration_refresh_token),
      });

      logger.success('Token Tray renovado com sucesso.', { store_id: tokenData.store_id });

      return (await this.tokenRepository.findById(token.id))!;
    } catch (error: any) {
      const authUrl = this.tryBuildRecoveryAuthUrl(token);

      if (this.isRefreshTokenExpired(error)) {
        logger.error('Refresh token Tray expirado. É necessário autenticar novamente.', { authUrl });
        throw new RefreshTokenExpiredError(
          'O refresh_token da Tray expirou (30 dias). É necessário autenticar novamente na plataforma.',
          authUrl ?? undefined,
        );
      }

      throw this.mapAuthError(error, 'Falha ao renovar token Tray');
    }
  }

  private isRefreshTokenExpired(error: any): boolean {
    const data: TrayErrorResponse | undefined = error.response?.data;
    // 1001/1002/1003: loja bloqueada/inativa/cancelada — refresh_token não pode ser reaproveitado.
    return [1001, 1002, 1003].includes(Number(data?.error_code)) || error.response?.status === 401;
  }

  private tryBuildRecoveryAuthUrl(token: TrayTokenDTO): string | null {
    try {
      const domain = token.api_address.replace(/\/web_api\/?$/, '');
      return this.generateAuthURL(domain, token.consumer_key);
    } catch {
      return null;
    }
  }

  private normalizeDomain(storeDomain: string): string {
    return storeDomain.replace(/^https?:\/\//, '').replace(/\/+$/, '');
  }

  private mapAuthError(error: any, prefix: string): Error {
    const data: TrayErrorResponse | undefined = error.response?.data;
    const message = data?.causes?.join(', ') || data?.message || error.message;
    const status = error.response?.status;

    logger.error(`${prefix} [${status}] error_code=${data?.error_code}: ${message}`);

    return new IntegrationError(`${prefix}: ${message}`, { status, error_code: data?.error_code });
  }
}
