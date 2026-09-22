import { inject, injectable } from 'tsyringe';
import { TrayHttpClient } from './trayHttpClient';
import { logger } from '@/shared/utils/logger';

export interface EnviarNFeTrayResult {
  success: boolean;
  error?: string;
}

export interface NotaFiscalTrayInput {
  numero: string | null;
  serie: string | null;
  chaveAcesso: string | null;
  dataFaturamento: string | null;
}

@injectable()
export class TrayFiscalService {
  constructor(
    @inject(TrayHttpClient) private readonly httpClient: TrayHttpClient,
  ) {}

  /**
   * Registra a NF-e no pedido Tray via POST /orders/:order_id/invoices.
   * A Tray não recebe o XML — só os metadados estruturados da nota. A chave
   * de acesso (44 dígitos) é o único campo que a Tray usa pra vincular a nota
   * de verdade; o restante é só exibido no admin da loja.
   */
  async enviarNFe(orderId: string, nota: NotaFiscalTrayInput): Promise<EnviarNFeTrayResult> {
    logger.info(`[TRAY FISCAL] Iniciando registro de NF-e para pedido ${orderId}`);

    if (!nota.chaveAcesso || nota.chaveAcesso.length !== 44) {
      logger.warn(`[TRAY FISCAL] NF-e do pedido ${orderId} sem chave de acesso válida (44 dígitos). Envio abortado.`);
      return {
        success: false,
        error: 'A nota fiscal recebida do CIGAM não tem uma chave de acesso válida (44 dígitos), necessária para registrar a NF-e na Tray.',
      };
    }

    if (!nota.numero || !nota.serie || !nota.dataFaturamento) {
      logger.warn(`[TRAY FISCAL] NF-e do pedido ${orderId} sem número, série ou data de faturamento.`);
      return {
        success: false,
        error: 'A nota fiscal recebida do CIGAM está sem número, série ou data de faturamento — campos obrigatórios para a Tray.',
      };
    }

    try {
      await this.httpClient.post(`/orders/${orderId}/invoices`, {
        Invoice: {
          number: nota.numero,
          series: nota.serie,
          issue_date: nota.dataFaturamento,
          key: nota.chaveAcesso,
        },
      });

      logger.success(`[TRAY FISCAL] NF-e registrada com sucesso no pedido Tray ${orderId}`);
      return { success: true };
    } catch (error: any) {
      logger.error(`[TRAY FISCAL] Erro ao registrar NF-e no pedido Tray ${orderId}: ${error.message}`);
      return { success: false, error: error.message };
    }
  }
}
