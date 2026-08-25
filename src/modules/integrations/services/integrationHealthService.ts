import { inject, injectable } from 'tsyringe';
import { BlingRepository } from '@/modules/bling/repositories/blingRepository';
import { MercadoLivreTokenRepository } from '@/modules/mercadoLivre/repositories/mercadoLivreTokenRepository';
import { ShopeeTokenRepository } from '@/modules/shopee/repositories/shopeeTokenRepository';
import { TrayTokenRepository } from '@/modules/tray/repositories/trayTokenRepository';
import { logger } from '@/shared/utils/logger';
import { IntegrationHealthDTO, IntegrationName, IntegrationTokenStatus } from '../dto';

// Access token: alerta se faltam menos de 2h para expirar.
const ACCESS_TOKEN_EXPIRING_SOON_MS = 2 * 60 * 60 * 1000;
// Refresh token (só a Tray armazena separadamente): alerta se faltam menos de 5 dias.
const REFRESH_TOKEN_EXPIRING_SOON_MS = 5 * 24 * 60 * 60 * 1000;

@injectable()
export class IntegrationHealthService {
  constructor(
    @inject(BlingRepository) private readonly blingRepository: BlingRepository,
    @inject(MercadoLivreTokenRepository) private readonly mercadoLivreTokenRepository: MercadoLivreTokenRepository,
    @inject(ShopeeTokenRepository) private readonly shopeeTokenRepository: ShopeeTokenRepository,
    @inject(TrayTokenRepository) private readonly trayTokenRepository: TrayTokenRepository,
  ) {}

  async getHealth(): Promise<IntegrationHealthDTO[]> {
    const mappers: Array<{ integration: IntegrationName; map: () => Promise<IntegrationHealthDTO> }> = [
      { integration: 'bling', map: () => this.mapBlingToken() },
      { integration: 'mercado_livre', map: () => this.mapMercadoLivreToken() },
      { integration: 'shopee', map: () => this.mapShopeeToken() },
      { integration: 'tray', map: () => this.mapTrayToken() },
    ];

    return Promise.all(
      mappers.map(async ({ integration, map }) => {
        try {
          return await map();
        } catch (error: any) {
          logger.error(`Falha ao consultar saúde da integração ${integration}: ${error.message}`);
          return this.disconnectedResult(integration);
        }
      }),
    );
  }

  private async mapBlingToken(): Promise<IntegrationHealthDTO> {
    const token = await this.blingRepository.findActive();
    return this.buildResult('bling', toDate(token?.expires_at), null, token?.nome_unidade ?? null);
  }

  private async mapMercadoLivreToken(): Promise<IntegrationHealthDTO> {
    const token = await this.mercadoLivreTokenRepository.findActive();
    return this.buildResult('mercado_livre', toDate(token?.expires_at), null, token?.nickname ?? null);
  }

  private async mapShopeeToken(): Promise<IntegrationHealthDTO> {
    const token = await this.shopeeTokenRepository.findActive();
    return this.buildResult('shopee', toDate(token?.expires_at), null, token?.shop_name ?? null);
  }

  private async mapTrayToken(): Promise<IntegrationHealthDTO> {
    const token = await this.trayTokenRepository.findActive();
    return this.buildResult(
      'tray',
      toDate(token?.date_expiration_access_token),
      toDate(token?.date_expiration_refresh_token),
      token?.store_id ?? null,
    );
  }

  private buildResult(
    integration: IntegrationName,
    accessTokenExpiresAt: Date | null,
    refreshTokenExpiresAt: Date | null,
    label: string | null,
  ): IntegrationHealthDTO {
    if (!accessTokenExpiresAt) {
      return this.disconnectedResult(integration);
    }

    return {
      integration,
      connected: true,
      status: this.classifyStatus(accessTokenExpiresAt, refreshTokenExpiresAt),
      accessTokenExpiresAt: accessTokenExpiresAt.toISOString(),
      refreshTokenExpiresAt: refreshTokenExpiresAt ? refreshTokenExpiresAt.toISOString() : null,
      label,
    };
  }

  private disconnectedResult(integration: IntegrationName): IntegrationHealthDTO {
    return {
      integration,
      connected: false,
      status: 'expired',
      accessTokenExpiresAt: null,
      refreshTokenExpiresAt: null,
      label: null,
    };
  }

  private classifyStatus(accessTokenExpiresAt: Date, refreshTokenExpiresAt: Date | null): IntegrationTokenStatus {
    const now = Date.now();

    const accessMsRemaining = accessTokenExpiresAt.getTime() - now;
    if (accessMsRemaining <= 0) return 'expired';
    if (accessMsRemaining < ACCESS_TOKEN_EXPIRING_SOON_MS) return 'expiring_soon';

    if (refreshTokenExpiresAt) {
      const refreshMsRemaining = refreshTokenExpiresAt.getTime() - now;
      if (refreshMsRemaining <= 0) return 'expired';
      if (refreshMsRemaining < REFRESH_TOKEN_EXPIRING_SOON_MS) return 'expiring_soon';
    }

    return 'ok';
  }
}

function toDate(value: Date | string | null | undefined): Date | null {
  if (!value) return null;
  return value instanceof Date ? value : new Date(value);
}
