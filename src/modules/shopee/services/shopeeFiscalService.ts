import { inject, injectable } from 'tsyringe';
import { ShopeeHttpClient } from './shopeeHttpClient';
import { logger } from '@/shared/utils/logger';

const NFE_UPLOAD_DELAY_MS = 5 * 60 * 1000;

export interface EnviarNFeShopeeResult {
  success: boolean;
  error?: string;
}

export interface NotaFiscalShopeeInput {
  xmlContent: string;
  chaveAcesso: string | null;
  /** Momento em que a NF-e foi recebida do CIGAM — usado para respeitar o delay mínimo exigido pela Shopee/SERPRO. */
  createdAt: Date;
}

/**
 * Traduz as mensagens de erro documentadas pela Shopee para o upload de NF-e
 * (v2.order.upload_invoice_doc), com a causa e a solução indicadas na doc oficial.
 */
function mapUploadInvoiceError(rawMessage: string): string {
  const msg = rawMessage || '';

  if (/Invalid CNPJ/i.test(msg)) {
    return 'CNPJ da NF-e diferente do CNPJ cadastrado na Shopee. Emita a NF-e com o CNPJ cadastrado na Shopee, ou corrija o CNPJ no cadastro da loja.';
  }
  if (/Invalid UF/i.test(msg)) {
    return 'Estado (UF) do emitente da NF-e diferente do estado cadastrado na Shopee. Emita a NF-e com o mesmo estado cadastrado, ou corrija o cadastro da loja.';
  }
  if (/Invalid State Registration Number/i.test(msg)) {
    return 'Inscrição estadual do emitente da NF-e diferente da cadastrada na Shopee. Emita a NF-e com a mesma inscrição estadual, ou corrija o cadastro da loja.';
  }
  if (/Don't support Invoice Issuer now/i.test(msg)) {
    return 'A loja está configurada para usar o emissor de NF-e da própria Shopee. Acesse Central do Vendedor > Shop > Shop Profile > Invoice Setting > Edit > Other para permitir upload de NF-e própria.';
  }
  if (/Canceled NF-e/i.test(msg)) {
    return 'A NF-e informada está cancelada. Envie uma NF-e válida para este pedido.';
  }
  if (/Invalid NF-e model/i.test(msg)) {
    return 'A NF-e não é do modelo 55 (único aceito pela Shopee).';
  }
  if (/Access Key duplicated/i.test(msg)) {
    return 'Essa chave de acesso já foi utilizada em outro pedido da Shopee.';
  }
  if (/access_key must be 44 characters/i.test(msg)) {
    return 'A chave de acesso da NF-e não tem 44 dígitos. Verifique a chave de acesso registrada.';
  }
  if (/access_key is a required field/i.test(msg)) {
    return 'A NF-e enviada não contém chave de acesso.';
  }
  if (/Invalid access key/i.test(msg)) {
    return 'Chave de acesso da NF-e inválida.';
  }
  if (/Invalid issue date/i.test(msg)) {
    return 'Data de emissão da NF-e é posterior à data atual. Corrija a data de emissão.';
  }
  if (/invoice status is invalid to upload invoice data/i.test(msg)) {
    return 'O pedido está com uma transportadora que não aceita NF-e via API (ex: Correios), ou já está cancelado. Para transportadoras sem suporte a NF-e, organize o envio diretamente pelo endpoint de logística (v2.logistics.ship_order).';
  }
  if (/order_sn is a required field/i.test(msg)) {
    return 'Requisição enviada sem o número do pedido (order_sn).';
  }
  if (/CFOP invalid/i.test(msg)) {
    return 'CFOP da NF-e não é aceito pela Shopee. Verifique o CFOP utilizado na nota.';
  }
  if (/valid Invoice XML file/i.test(msg) || /File Error/i.test(msg)) {
    return 'Arquivo XML da NF-e está em formato inválido.';
  }
  if (/Invalid NF-e\.?$/i.test(msg)) {
    return 'NF-e inválida. Se ela acabou de ser emitida, aguarde alguns minutos (validação na SERPRO) e tente novamente.';
  }

  return msg;
}

@injectable()
export class ShopeeFiscalService {
  constructor(
    @inject(ShopeeHttpClient) private readonly httpClient: ShopeeHttpClient,
  ) {}

  /**
   * Envia a NF-e (XML) para a Shopee via v2.order.upload_invoice_doc, liberando
   * o pedido para emissão de etiqueta. Endpoint espera multipart/form-data com
   * order_sn, file_type ("4" = XML) e file — a Shopee extrai chave de acesso,
   * CNPJ, CFOP etc. diretamente do XML, não há campos estruturados no request.
   */
  async enviarNFe(orderSn: string, nota: NotaFiscalShopeeInput): Promise<EnviarNFeShopeeResult> {
    logger.info(`[SHOPEE FISCAL] Iniciando envio de NF-e para pedido ${orderSn}`);

    if (!nota.chaveAcesso || nota.chaveAcesso.length !== 44) {
      logger.warn(`[SHOPEE FISCAL] NF-e do pedido ${orderSn} sem chave de acesso válida (44 dígitos). Envio abortado.`);
      return {
        success: false,
        error: 'A nota fiscal recebida do CIGAM não tem uma chave de acesso válida (44 dígitos), necessária para a Shopee liberar a etiqueta.',
      };
    }

    const elapsedMs = Date.now() - nota.createdAt.getTime();
    if (elapsedMs < NFE_UPLOAD_DELAY_MS) {
      const waitMinutes = Math.ceil((NFE_UPLOAD_DELAY_MS - elapsedMs) / 60000);
      logger.warn(`[SHOPEE FISCAL] NF-e do pedido ${orderSn} foi emitida há menos de 5 minutos. Aguardando validação na SERPRO.`);
      return {
        success: false,
        error: `A Shopee exige aguardar 5 minutos após a emissão da NF-e (validação na SERPRO). Tente novamente em ${waitMinutes} minuto(s).`,
      };
    }

    try {
      const form = new FormData();
      form.append('order_sn', orderSn);
      form.append('file_type', '4');
      form.append('file', new Blob([nota.xmlContent], { type: 'text/xml' }), `${nota.chaveAcesso}.xml`);

      const response = await this.httpClient.postForm<any>('/order/upload_invoice_doc', form);

      if (response.error) {
        const friendlyError = mapUploadInvoiceError(response.message || response.error);
        logger.error(`[SHOPEE FISCAL] Erro ao enviar NF-e: ${response.message || response.error}`);
        return { success: false, error: friendlyError };
      }

      logger.success(`[SHOPEE FISCAL] NF-e enviada com sucesso para pedido ${orderSn}`);
      return { success: true };
    } catch (error: any) {
      const friendlyError = mapUploadInvoiceError(error.message);
      logger.error(`[SHOPEE FISCAL] Erro ao enviar NF-e para pedido ${orderSn}: ${error.message}`);
      return { success: false, error: friendlyError };
    }
  }
}
