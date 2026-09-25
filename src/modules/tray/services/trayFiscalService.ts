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
  valor?: number | string | null;
  xml?: string | null;
}

@injectable()
export class TrayFiscalService {
  constructor(
    @inject(TrayHttpClient) private readonly httpClient: TrayHttpClient,
  ) {}

  private extrairValorXml(xml?: string | null): number | null {
    if (!xml) return null;
    const match = xml.match(/<vNF>([0-9.]+)<\/vNF>/);
    if (match && match[1]) {
      const parsed = parseFloat(match[1]);
      return isNaN(parsed) ? null : parsed;
    }
    return null;
  }

  private formatarData(data: string | null): string {
    if (!data) return new Date().toISOString().slice(0, 10);
    const cleaned = data.trim();
    if (/^\d{4}-\d{2}-\d{2}/.test(cleaned)) {
      return cleaned.slice(0, 10);
    }
    const ddmmyyyy = cleaned.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
    if (ddmmyyyy) {
      return `${ddmmyyyy[3]}-${ddmmyyyy[2]}-${ddmmyyyy[1]}`;
    }
    return cleaned;
  }

  /**
   * Registra a NF-e no pedido Tray via POST /orders/:order_id/invoices.
   * A Tray espera o wrapper OrderInvoice com: number, serie, issue_date (YYYY-MM-DD),
   * key (44 dígitos) e value (numérico).
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

    const valorFinal = Number(nota.valor) || this.extrairValorXml(nota.xml) || 0;
    const issueDate = this.formatarData(nota.dataFaturamento);

    try {
      await this.httpClient.post(`/orders/${orderId}/invoices`, {
        OrderInvoice: {
          number: String(nota.numero).trim(),
          serie: String(nota.serie).trim(),
          issue_date: issueDate,
          key: String(nota.chaveAcesso).trim(),
          value: Number(valorFinal.toFixed(2)),
        },
      });

      logger.success(`[TRAY FISCAL] NF-e registrada com sucesso no pedido Tray ${orderId}`);

      const statusFaturadoId = process.env.TRAY_STATUS_FATURADO_ID;
      if (statusFaturadoId) {
        try {
          const statusIdNum = parseInt(statusFaturadoId, 10);
          if (!isNaN(statusIdNum) && statusIdNum > 0) {
            await this.httpClient.put(`/orders/${orderId}`, {
              Order: {
                status_id: statusIdNum,
              },
            });
            logger.success(`[TRAY FISCAL] Status do pedido Tray ${orderId} atualizado para status_id=${statusIdNum}`);
          }
        } catch (statusError: any) {
          logger.warn(`[TRAY FISCAL] NF-e registrada, mas falha ao atualizar status do pedido Tray ${orderId}: ${statusError.message}`);
        }
      }

      return { success: true };
    } catch (error: any) {
      logger.error(`[TRAY FISCAL] Erro ao registrar NF-e no pedido Tray ${orderId}: ${error.message}`);
      return { success: false, error: error.message };
    }
  }
}
