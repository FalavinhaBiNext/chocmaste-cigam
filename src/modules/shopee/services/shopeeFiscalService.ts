import { inject, injectable } from 'tsyringe';
import { ShopeeHttpClient } from './shopeeHttpClient';
import { logger } from '@/shared/utils/logger';

export interface EnviarNFeShopeeResult {
  success: boolean;
  error?: string;
}

@injectable()
export class ShopeeFiscalService {
  constructor(
    @inject(ShopeeHttpClient) private readonly httpClient: ShopeeHttpClient,
  ) {}

  /**
   * Envia a NF-e (XML) para a Shopee.
   * A Shopee Brasil aceita upload de documento fiscal via API.
   */
  async enviarNFe(orderSn: string, xmlContent: string): Promise<EnviarNFeShopeeResult> {
    logger.info(`[SHOPEE FISCAL] Iniciando envio de NF-e para pedido ${orderSn}`);

    try {
      // Converter XML para base64
      const xmlBase64 = Buffer.from(xmlContent).toString('base64');

      const response = await this.httpClient.post<any>('/order/upload_invoice_doc', {
        order_sn: orderSn,
        invoice_file: xmlBase64,
      });

      if (response.error) {
        logger.error(`[SHOPEE FISCAL] Erro ao enviar NF-e: ${response.message || response.error}`);
        return { success: false, error: response.message || response.error };
      }

      logger.success(`[SHOPEE FISCAL] NF-e enviada com sucesso para pedido ${orderSn}`);
      return { success: true };
    } catch (error: any) {
      logger.error(`[SHOPEE FISCAL] Erro ao enviar NF-e para pedido ${orderSn}: ${error.message}`);
      return { success: false, error: error.message };
    }
  }
}
