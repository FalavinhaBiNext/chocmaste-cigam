import { inject, injectable } from 'tsyringe';
import { TrayHttpClient } from './trayHttpClient';
import { logger } from '@/shared/utils/logger';

export interface EnviarNFeTrayResult {
  success: boolean;
  error?: string;
  invoiceId?: string;
}

const ATRASO_ATUALIZACAO_NFE_MS = 10_000;

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

  private validarNota(nota: NotaFiscalTrayInput): string | null {
    if (!nota.chaveAcesso || nota.chaveAcesso.length !== 44) {
      return 'A nota fiscal recebida do CIGAM não tem uma chave de acesso válida (44 dígitos), necessária para registrar a NF-e na Tray.';
    }
    if (!nota.numero || !nota.serie || !nota.dataFaturamento) {
      return 'A nota fiscal recebida do CIGAM está sem número, série ou data de faturamento — campos obrigatórios para a Tray.';
    }
    return null;
  }

  private montarOrderInvoice(nota: NotaFiscalTrayInput): Record<string, unknown> {
    const valorFinal = Number(nota.valor) || this.extrairValorXml(nota.xml) || 0;
    const issueDate = this.formatarData(nota.dataFaturamento);

    const orderInvoice: Record<string, unknown> = {
      number: String(nota.numero).trim(),
      serie: String(nota.serie).trim(),
      issue_date: issueDate,
      key: String(nota.chaveAcesso).trim(),
      value: Number(valorFinal.toFixed(2)),
    };
    if (nota.xml) {
      orderInvoice.xml_danfe = nota.xml;
    }
    return orderInvoice;
  }

  /**
   * Registra a NF-e no pedido Tray via POST /orders/:order_id/invoices.
   * A Tray espera o wrapper OrderInvoice com: number, serie, issue_date (YYYY-MM-DD),
   * key (44 dígitos) e value (numérico).
   */
  async enviarNFe(orderId: string, nota: NotaFiscalTrayInput): Promise<EnviarNFeTrayResult> {
    logger.info(`[TRAY FISCAL] Iniciando registro de NF-e para pedido ${orderId}`);

    const erroValidacao = this.validarNota(nota);
    if (erroValidacao) {
      logger.warn(`[TRAY FISCAL] NF-e do pedido ${orderId} inválida: ${erroValidacao}`);
      return { success: false, error: erroValidacao };
    }

    const orderInvoice = this.montarOrderInvoice(nota);

    try {
      const resposta = await this.httpClient.post<{ id?: string | number }>(`/orders/${orderId}/invoices`, {
        OrderInvoice: orderInvoice,
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

      const invoiceId = resposta?.id !== undefined ? String(resposta.id) : undefined;
      if (invoiceId) {
        this.agendarAtualizacaoNFe(orderId, invoiceId, nota);
      }

      return { success: true, invoiceId };
    } catch (error: any) {
      logger.error(`[TRAY FISCAL] Erro ao registrar NF-e no pedido Tray ${orderId}: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  /**
   * Agenda uma chamada de atualizarNFe (PUT) com os mesmos dados enviados no
   * registro, 10 segundos após o POST bem-sucedido. O timer é "unref"ado para
   * não segurar o processo Node vivo (ex.: em testes ou durante um shutdown).
   */
  private agendarAtualizacaoNFe(orderId: string, invoiceId: string, nota: NotaFiscalTrayInput): void {
    const timer = setTimeout(() => {
      this.atualizarNFe(orderId, invoiceId, nota)
        .then((resultado) => {
          if (!resultado.success) {
            logger.warn(`[TRAY FISCAL] Atualização automática da NF-e ${invoiceId} do pedido ${orderId} falhou: ${resultado.error}`);
          }
        })
        .catch((error: any) => {
          logger.error(`[TRAY FISCAL] Erro inesperado na atualização automática da NF-e ${invoiceId} do pedido ${orderId}: ${error.message}`);
        });
    }, ATRASO_ATUALIZACAO_NFE_MS);

    if (typeof timer.unref === 'function') {
      timer.unref();
    }
  }

  /**
   * Atualiza uma NF-e já registrada no pedido Tray via PUT /orders/:order_id/invoices/:invoice_id.
   * Requer o invoiceId retornado pela Tray no momento do cadastro (enviarNFe).
   * Diferente do POST de criação, a doc da Tray para esse PUT mostra os campos
   * direto na raiz do body (sem o wrapper OrderInvoice) — e na prática a Tray
   * rejeita o wrapper aqui com "Invalid parameter id.", então enviamos sem ele.
   */
  async atualizarNFe(orderId: string, invoiceId: string, nota: NotaFiscalTrayInput): Promise<EnviarNFeTrayResult> {
    logger.info(`[TRAY FISCAL] Iniciando atualização da NF-e ${invoiceId} do pedido ${orderId}`);

    const erroValidacao = this.validarNota(nota);
    if (erroValidacao) {
      logger.warn(`[TRAY FISCAL] Atualização da NF-e ${invoiceId} do pedido ${orderId} abortada: ${erroValidacao}`);
      return { success: false, error: erroValidacao };
    }

    const orderInvoice = this.montarOrderInvoice(nota);

    try {
      await this.httpClient.put(`/orders/${orderId}/invoices/${invoiceId}`, orderInvoice);

      logger.success(`[TRAY FISCAL] NF-e ${invoiceId} atualizada com sucesso no pedido Tray ${orderId}`);
      return { success: true, invoiceId };
    } catch (error: any) {
      logger.error(`[TRAY FISCAL] Erro ao atualizar NF-e ${invoiceId} no pedido Tray ${orderId}: ${error.message}`);
      return { success: false, error: error.message };
    }
  }
}
