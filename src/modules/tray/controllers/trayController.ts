import { inject, injectable } from 'tsyringe';
import { Request, Response } from 'express';
import { TrayAuthService } from '../services/trayAuthService';
import { TrayTokenRepository } from '../repositories/trayTokenRepository';
import { TrayHttpClient } from '../services/trayHttpClient';
import { logger } from '@/shared/utils/logger';
import { ValidationError } from '@/shared/errors/AppError';

@injectable()
export class TrayController {
  constructor(
    @inject(TrayAuthService) private readonly authService: TrayAuthService,
    @inject(TrayTokenRepository) private readonly tokenRepository: TrayTokenRepository,
    @inject(TrayHttpClient) private readonly httpClient: TrayHttpClient,
  ) {}

  /**
   * Gera a URL de autorização para o lojista redirecionar à tela da Tray (Etapa 1).
   * GET /tray/auth-url?store_domain=urldaloja.com.br
   */
  getAuthUrl = async (req: Request, res: Response) => {
    logger.route('Endpoint GET /tray/auth-url chamado');

    const storeDomain = String(req.query.store_domain || process.env.TRAY_STORE_DOMAIN || '');
    if (!storeDomain) {
      throw new ValidationError('Parâmetro store_domain é obrigatório (ou configure TRAY_STORE_DOMAIN).');
    }

    const authUrl = this.authService.generateAuthURL(storeDomain);

    logger.success('URL de autorização Tray gerada com sucesso', { authUrl });

    res.status(200).json({
      success: true,
      data: { authUrl },
    });
  };

  /**
   * Callback OAuth2 — recebe code, adm_user, store e api_address (Etapa 2 → 3).
   * GET /tray/callback?code=xxx&adm_user=xxx&store=xxx&api_address=xxx
   */
  handleCallback = async (req: Request, res: Response) => {
    logger.route('Endpoint GET /tray/callback chamado');

    const { code, api_address: apiAddress, store, adm_user: admUser } = req.query;

    if (!code || !apiAddress) {
      logger.warn('Callback da Tray sem código de autorização ou api_address');
      throw new ValidationError('Parâmetros code e api_address são obrigatórios no callback da Tray.');
    }

    logger.auth(`Código de autorização Tray recebido de ${store}. Usuário: ${admUser}`);

    const token = await this.authService.exchangeCodeForToken(String(apiAddress), String(code));

    logger.success('Autenticação Tray concluída', { store_id: token.store_id });

    res.status(200).json({
      success: true,
      message: 'Autenticação Tray realizada com sucesso.',
      data: {
        store_id: token.store_id,
        api_address: token.api_address,
        date_expiration_access_token: token.date_expiration_access_token,
        date_expiration_refresh_token: token.date_expiration_refresh_token,
      },
    });
  };

  /**
   * Renova manualmente o access_token da loja ativa.
   * POST /tray/tokens/:id/refresh
   */
  refreshToken = async (req: Request, res: Response) => {
    const id = String(req.params.id);
    const token = await this.authService.refreshAccessToken(id);

    res.status(200).json({
      success: true,
      message: 'Token Tray renovado com sucesso.',
      data: {
        store_id: token.store_id,
        date_expiration_access_token: token.date_expiration_access_token,
      },
    });
  };

  /**
   * Lista tokens salvos (sem expor access_token/refresh_token).
   * GET /tray/tokens
   */
  listTokens = async (_req: Request, res: Response) => {
    const tokens = await this.tokenRepository.findAll();
    const safeTokens = tokens.map(t => ({
      id: t.id,
      store_id: t.store_id,
      api_address: t.api_address,
      active: t.active,
      date_expiration_access_token: t.date_expiration_access_token,
      date_expiration_refresh_token: t.date_expiration_refresh_token,
      created_at: t.created_at,
    }));

    res.status(200).json({
      success: true,
      data: safeTokens,
    });
  };

  /**
   * Remove um token (desconectar loja Tray).
   * DELETE /tray/tokens/:id
   */
  deleteToken = async (req: Request, res: Response) => {
    const id = String(req.params.id);
    await this.tokenRepository.deleteById(id);

    res.status(200).json({
      success: true,
      message: 'Loja Tray desconectada com sucesso.',
    });
  };

  /**
   * Ativa uma loja específica (caso existam múltiplas contas salvas).
   * PATCH /tray/tokens/:id/activate
   */
  activateToken = async (req: Request, res: Response) => {
    const id = String(req.params.id);
    const token = await this.tokenRepository.findById(id);
    if (!token) {
      res.status(404).json({ success: false, message: 'Token Tray não encontrado.' });
      return;
    }

    await this.tokenRepository.setActive(token.store_id);

    res.status(200).json({
      success: true,
      message: 'Loja Tray ativada com sucesso.',
    });
  };

  /**
   * Consulta as informações da loja para validar que o token ativo funciona.
   * GET /tray/info
   */
  getStoreInfo = async (_req: Request, res: Response) => {
    const info = await this.httpClient.get<any>('/info');

    res.status(200).json({
      success: true,
      data: info,
    });
  };
}
