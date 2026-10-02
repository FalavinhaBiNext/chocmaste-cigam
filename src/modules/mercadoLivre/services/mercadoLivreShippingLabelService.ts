import { injectable, inject } from 'tsyringe';
import axios from 'axios';
import { MercadoLivreHttpClient } from './mercadoLivreHttpClient';
import { MercadoLivreFiscalService } from './mercadoLivreFiscalService';
import { MercadoLivreTokenRepository } from '../repositories/mercadoLivreTokenRepository';
import { logger } from '@/shared/utils/logger';

const ML_API_BASE = 'https://api.mercadolibre.com';

// A Mercado Envios só disponibiliza a etiqueta pra esses tipos de logística.
// Fulfillment não entra aqui — o próprio ML cuida do envio nesse caso.
const LOGISTIC_TYPES_COM_ETIQUETA = ['drop_off', 'xd_drop_off', 'cross_docking', 'self_service'];

// "ready_to_print": etiqueta ainda não gerada, mas liberada. "printed": já foi
// impressa antes — a etiqueta continua disponível pra reimpressão (ex.: extraviou
// o papel, trocou a impressora). Só bloqueia fora desses dois substatus.
// Exportado pra o controller usar o mesmo critério ao montar o readyToPrint
// devolvido ao frontend (que é o que habilita/desabilita o botão).
export const SUBSTATUS_COM_ETIQUETA_DISPONIVEL = ['ready_to_print', 'printed'];

export interface ShippingLabelResult {
  success: boolean;
  buffer?: Buffer;
  contentType?: string;
  filename?: string;
  error?: string;
  errorCode?: 'NOT_PRINTABLE' | 'NOT_SUPPORTED_LOGISTIC_TYPE' | 'NO_SHIPMENT' | 'ML_ERROR';
}

@injectable()
export class MercadoLivreShippingLabelService {
  constructor(
    @inject(MercadoLivreFiscalService)
    private readonly fiscalService: MercadoLivreFiscalService,
    @inject(MercadoLivreHttpClient)
    private readonly httpClient: MercadoLivreHttpClient,
    @inject(MercadoLivreTokenRepository)
    private readonly tokenRepository: MercadoLivreTokenRepository,
  ) {}

  /**
   * Busca a etiqueta a partir do numero_pedido_cigam, reaproveitando a mesma
   * resolução de shipment_id (com cache) já usada pro envio de NF-e.
   */
  async obterEtiquetaPorPedidoCigam(numeroPedidoCigam: string): Promise<ShippingLabelResult> {
    const shipmentInfo = await this.fiscalService.resolverShipmentId(numeroPedidoCigam);
    if (!shipmentInfo.success || !shipmentInfo.shipmentId) {
      return { success: false, error: shipmentInfo.error, errorCode: 'NO_SHIPMENT' };
    }

    return this.obterEtiquetaPorShipmentId(shipmentInfo.shipmentId);
  }

  /**
   * Fluxo:
   * 1. Verificar status/substatus/logistic_type do shipment
   * 2. Baixar a etiqueta (ZIP com PDF + TXT Zebra) via GET /shipment_labels
   */
  async obterEtiquetaPorShipmentId(shipmentId: string): Promise<ShippingLabelResult> {
    let logisticType: string | undefined;

    try {
      const shipmentData: any = await this.httpClient.get(`/shipments/${shipmentId}`);
      const status = shipmentData.status;
      const substatus = shipmentData.substatus;
      logisticType = shipmentData.logistic?.type ?? shipmentData.logistic_type ?? undefined;

      logger.info(
        `[ML LABEL] Status do shipment ${shipmentId}: ${status}/${substatus}. logistic_type: ${logisticType ?? 'não retornado pelo ML'}.`
      );

      if (logisticType && !LOGISTIC_TYPES_COM_ETIQUETA.includes(logisticType)) {
        logger.warn(`[ML LABEL] Shipment ${shipmentId} é logistic_type "${logisticType}" — etiqueta não disponível via API pra esse tipo (ex.: fulfillment).`);
        return {
          success: false,
          errorCode: 'NOT_SUPPORTED_LOGISTIC_TYPE',
          error: `Envios do tipo "${logisticType}" não têm etiqueta disponível por essa API (ex.: Fulfillment é gerenciado diretamente pelo Mercado Livre).`,
        };
      }

      if (status !== 'ready_to_ship' || !SUBSTATUS_COM_ETIQUETA_DISPONIVEL.includes(substatus)) {
        logger.warn(`[ML LABEL] Shipment ${shipmentId} ainda não está pronto pra impressão. Status atual: ${status}/${substatus}.`);
        return {
          success: false,
          errorCode: 'NOT_PRINTABLE',
          error: `Etiqueta ainda não liberada pelo Mercado Livre. Status atual: ${status}/${substatus}. Aguarde o marketplace liberar a impressão.`,
        };
      }
    } catch (error: any) {
      logger.error(`[ML LABEL] Erro ao verificar status do shipment ${shipmentId}: ${error.message}`);
      return { success: false, errorCode: 'ML_ERROR', error: `Erro ao verificar shipment: ${error.message}` };
    }

    try {
      const token = await this.tokenRepository.findActive();
      if (!token) {
        return { success: false, errorCode: 'ML_ERROR', error: 'Nenhum token Mercado Livre ativo encontrado.' };
      }

      const response = await axios.get(
        `${ML_API_BASE}/shipment_labels`,
        {
          params: {
            shipment_ids: shipmentId,
            response_type: 'pdf',
          },
          headers: {
            'Authorization': `Bearer ${token.access_token}`,
            // O ML decide PDF puro vs. ZIP (PDF + TXT Zebra) com base nesse header,
            // não só no response_type — sem ele, o corpo pode vir num formato
            // diferente do que o Content-Type/nome de arquivo abaixo assumiam.
            'Accept': 'application/zip',
          },
          responseType: 'arraybuffer',
          timeout: 30000,
        }
      );

      // Usa o Content-Type real devolvido pelo ML em vez de assumir sempre "zip" —
      // se vier só o PDF (ou qualquer outro formato), o arquivo salvo tem que
      // refletir isso, senão o cliente recebe um arquivo com extensão errada
      // (ex.: um PDF renomeado pra .zip, que "abre corrompido").
      const actualContentType = String(response.headers['content-type'] || '').split(';')[0].trim();

      // O ML pode responder 200 com um corpo JSON de erro em vez de status HTTP de
      // falha — nesse caso o buffer não é um arquivo válido, é texto.
      if (actualContentType.includes('json') || actualContentType.includes('text')) {
        let jsonMessage: string | undefined;
        try {
          jsonMessage = JSON.parse(Buffer.from(response.data).toString('utf-8'))?.message;
        } catch {
          // corpo não era JSON — segue com a mensagem genérica abaixo
        }
        logger.error(`[ML LABEL] ML devolveu ${actualContentType} em vez de um arquivo para o shipment ${shipmentId}: ${jsonMessage || '(corpo não-JSON)'}`);
        return {
          success: false,
          errorCode: 'NOT_PRINTABLE',
          error: jsonMessage || 'O Mercado Livre não devolveu um arquivo de etiqueta válido para este envio.',
        };
      }

      logger.success(`[ML LABEL] Etiqueta do shipment ${shipmentId} baixada com sucesso.`);

      const isZip = actualContentType.includes('zip');
      const extension = isZip ? 'zip' : actualContentType.includes('pdf') ? 'pdf' : 'bin';

      return {
        success: true,
        buffer: Buffer.from(response.data),
        contentType: actualContentType || 'application/zip',
        filename: `etiqueta-${shipmentId}.${extension}`,
      };
    } catch (error: any) {
      const status = error.response?.status;
      let errorMsg = error.message;
      try {
        // O corpo de erro do ML às vezes vem em JSON mesmo com responseType arraybuffer.
        const parsed = JSON.parse(Buffer.from(error.response?.data ?? '').toString('utf-8'));
        errorMsg = parsed?.message || errorMsg;
      } catch {
        // corpo não era JSON — mantém error.message
      }

      logger.error(`[ML LABEL] Erro ao baixar etiqueta do shipment ${shipmentId}: ${errorMsg}`, { status });

      return {
        success: false,
        errorCode: status === 400 ? 'NOT_PRINTABLE' : 'ML_ERROR',
        error: `Erro ao baixar etiqueta no ML: ${errorMsg}`,
      };
    }
  }
}
