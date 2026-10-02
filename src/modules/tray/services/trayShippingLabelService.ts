import { inject, injectable } from 'tsyringe';
import puppeteer from 'puppeteer';
import { TrayHttpClient } from './trayHttpClient';
import { TrayOrderService } from './trayOrderService';
import { TrayCompleteOrder, TrayShippingLabelRegisterResponse } from '../dto';
import { renderShippingLabelHtml } from '../templates/shippingLabelTemplate';
import { logger } from '@/shared/utils/logger';

@injectable()
export class TrayShippingLabelService {
  constructor(
    @inject(TrayHttpClient) private readonly httpClient: TrayHttpClient,
    @inject(TrayOrderService) private readonly orderService: TrayOrderService,
  ) {}

  /**
   * Cadastra a URL do emissor de etiqueta da loja (uma única URL por loja).
   * POST /shipping_labels
   */
  async registerLabelUrl(configurationUrl: string): Promise<TrayShippingLabelRegisterResponse> {
    logger.info(`[TRAY LABEL] Cadastrando URL de emissor de etiqueta: ${configurationUrl}`);

    const response = await this.httpClient.post<TrayShippingLabelRegisterResponse>('/shipping_labels', {
      ShippingLabel: {
        configuration_url: configurationUrl,
      },
    });

    logger.success('[TRAY LABEL] URL de emissor cadastrada com sucesso.', { id: response.id });
    return response;
  }

  /**
   * Vincula (marca) um pedido para impressão de etiqueta. Sem corpo — só a requisição.
   * POST /orders/:id/shipping_label
   */
  async linkOrderLabel(orderId: string): Promise<TrayShippingLabelRegisterResponse> {
    logger.info(`[TRAY LABEL] Vinculando etiqueta ao pedido ${orderId}`);

    const response = await this.httpClient.post<TrayShippingLabelRegisterResponse>(
      `/orders/${orderId}/shipping_label`,
    );

    logger.success(`[TRAY LABEL] Pedido ${orderId} vinculado para impressão de etiqueta.`);
    return response;
  }

  /**
   * Remove a vinculação de etiqueta de um pedido.
   * DELETE /orders/:id/shipping_label
   */
  async unlinkOrderLabel(orderId: string): Promise<TrayShippingLabelRegisterResponse> {
    logger.info(`[TRAY LABEL] Removendo vínculo de etiqueta do pedido ${orderId}`);

    const response = await this.httpClient.delete<TrayShippingLabelRegisterResponse>(
      `/orders/${orderId}/shipping_label`,
    );

    logger.success(`[TRAY LABEL] Vínculo de etiqueta removido do pedido ${orderId}.`);
    return response;
  }

  /**
   * Busca os dados completos do pedido (cliente, endereço e itens embutidos)
   * para renderizar a etiqueta dentro do IFRAME aberto pelo admin da Tray.
   */
  async getCompleteOrder(orderId: string): Promise<TrayCompleteOrder> {
    return this.orderService.buscarPedidoCompleto(orderId);
  }

  /**
   * Monta o HTML da etiqueta de um pedido. Usado tanto pelo IFRAME público que a
   * Tray abre no admin da loja quanto pelo botão "Imprimir Etiqueta" do Chocmaster.
   */
  async obterEtiquetaHtml(orderId: string): Promise<string> {
    const completeOrder = await this.getCompleteOrder(orderId);
    return renderShippingLabelHtml(completeOrder);
  }

  /**
   * Renderiza a etiqueta HTML da Tray como PDF via Chromium headless — a Tray não
   * gera PDF nenhum (ver obterEtiquetaHtml), então pra poder juntar essa etiqueta
   * com a do marketplace/ERP num único arquivo, precisamos converter nós mesmos.
   */
  async obterEtiquetaPdf(orderId: string): Promise<Buffer> {
    const html = await this.obterEtiquetaHtml(orderId);

    logger.info(`[TRAY LABEL] Renderizando etiqueta do pedido ${orderId} em PDF via Chromium headless...`);

    const browser = await puppeteer.launch({
      headless: true,
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'domcontentloaded' });
      const pdfBytes = await page.pdf({ format: 'a4', printBackground: true });
      logger.success(`[TRAY LABEL] Etiqueta do pedido ${orderId} renderizada em PDF com sucesso.`);
      return Buffer.from(pdfBytes);
    } finally {
      await browser.close();
    }
  }
}
