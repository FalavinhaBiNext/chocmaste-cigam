import { inject, injectable } from 'tsyringe';
import { ShopeeHttpClient } from './shopeeHttpClient';
import { ShopeeOrderService } from './shopeeOrderService';
import { logger } from '@/shared/utils/logger';

// NORMAL_AIR_WAYBILL devolve PDF; THERMAL_AIR_WAYBILL devolve documento térmico/TXT,
// incompatível com o resto do fluxo (merge com o PDF do CIGAM via pdf-lib,
// Content-Type application/pdf). Usar THERMAL_AIR_WAYBILL aqui foi a causa raiz
// do erro "No PDF header found" — o download tinha sucesso, mas o conteúdo não
// era PDF de verdade.
const SHIPPING_DOCUMENT_TYPE = 'NORMAL_AIR_WAYBILL';
// Esperas na impressão (~24s cada). Com o envio organizado logo após a NF-e,
// normalmente o rastreio e o documento já estão prontos na 1ª tentativa.
const TRACKING_POLL_ATTEMPTS = 8;
const TRACKING_POLL_DELAY_MS = 3000;
const DOCUMENT_POLL_ATTEMPTS = 8;
const DOCUMENT_POLL_DELAY_MS = 3000;

/**
 * Status do pedido na Shopee em que o envio ainda precisa ser organizado
 * (ship_order). RETRY_SHIP = a Shopee pediu para organizar de novo.
 */
const STATUS_A_ORGANIZAR = new Set(['READY_TO_SHIP', 'RETRY_SHIP']);
/** Status em que o envio já foi organizado — não chamar ship_order de novo. */
const STATUS_JA_ORGANIZADO = new Set(['PROCESSED', 'SHIPPED', 'TO_CONFIRM_RECEIVE', 'COMPLETED']);

export interface VerificacaoEnvioItem {
  orderSn: string;
  /** Status do pedido na Shopee no momento da verificação. */
  status?: string;
  situacao: 'ja_organizado' | 'organizado_agora' | 'falha' | 'ignorado' | 'nao_encontrado';
  erro?: string;
}

export interface OrganizarEnvioResult {
  success: boolean;
  /** true quando o pedido já estava organizado e nada foi chamado. */
  jaOrganizado?: boolean;
  error?: string;
}

export interface ShippingLabelResult {
  success: boolean;
  buffer?: Buffer;
  contentType?: string;
  filename?: string;
  error?: string;
  errorCode?: 'NOT_PRINTABLE' | 'SHOPEE_ERROR';
}

/**
 * Todo endpoint de /logistics/ embrulha os dados reais em "response" — confirmado
 * contra a doc oficial (open.shopee.com/documents, módulo 95) para
 * create_shipping_document, get_shipping_document_parameter, get_tracking_number,
 * get_tracking_info, get_shipping_parameter, get_channel_list e get_address_list.
 * Falhas por item vêm dentro de response.result_list[].fail_error/fail_message
 * mesmo com HTTP 200 — checar isso além do campo "error" de topo.
 */
function getResultItem(response: any, orderSn: string): any {
  const list = response?.response?.result_list;
  return Array.isArray(list) ? list.find((r: any) => r.order_sn === orderSn) : undefined;
}

function mapShippingDocumentError(rawMessage: string): string {
  const msg = rawMessage || '';

  if (/invoice/i.test(msg)) {
    return 'A NF-e deste pedido ainda não foi enviada/validada pela Shopee. Envie a NF-e antes de gerar a etiqueta.';
  }
  if (/order status|not allow|invalid order/i.test(msg)) {
    return 'O pedido não está em um status que permite gerar etiqueta (confirme se já está pronto para envio).';
  }
  if (/shipping_document_should_print_first/i.test(msg)) {
    return 'A Shopee exige que o documento de envio seja criado/processado antes de imprimir — o fluxo tentou baixar antes do status ficar READY.';
  }
  if (/can_not_print_to_label/i.test(msg)) {
    return 'A conta não está habilitada para gerar etiqueta nesse canal logístico, ou não há pedidos em andamento nesse canal.';
  }
  if (/error_server/i.test(msg)) {
    return 'Falha temporária na Shopee (error_server). Tente novamente em instantes.';
  }

  return msg;
}

@injectable()
export class ShopeeShippingLabelService {
  constructor(
    @inject(ShopeeHttpClient) private readonly httpClient: ShopeeHttpClient,
    @inject(ShopeeOrderService) private readonly orderService: ShopeeOrderService,
  ) {}

  /**
   * Organização do envio recomendada pelo suporte da Shopee:
   * v2.logistics.get_shipping_parameter → v2.logistics.ship_order.
   *
   * Em info_needed, a Shopee informa o modo (pickup / dropoff / non_integrated)
   * e a LISTA de campos que o ship_order exige nesse modo. Lista vazia
   * (ex.: {"dropoff": []}, comum no Shopee Xpress) = nenhum dado extra: envia
   * o modo com objeto vazio (dropoff: {}). Só os campos listados são
   * preenchidos — sender_real_name vem da env SHOPEE_SENDER_NAME.
   */
  private async confirmarEnvioIndividual(orderSn: string, packageNumber?: string): Promise<{ success: boolean; error?: string }> {
    let paramResponse: any;
    try {
      const params: Record<string, any> = { order_sn: orderSn };
      if (packageNumber) {
        params.package_number = packageNumber;
      }
      paramResponse = await this.httpClient.get<any>('/logistics/get_shipping_parameter', params);
    } catch (error: any) {
      return { success: false, error: `Falha ao consultar get_shipping_parameter: ${error.message}` };
    }

    if (paramResponse.error) {
      return { success: false, error: paramResponse.message || paramResponse.error };
    }

    logger.info(`[SHOPEE LABEL] get_shipping_parameter de ${orderSn}: ${JSON.stringify(paramResponse)}`);
    // Preview também incluído nas mensagens de erro abaixo (não só no log do
    // servidor) porque o acesso ao log do servidor nem sempre está à mão de
    // quem está depurando isso pelo retorno da própria chamada.
    const rawPreview = JSON.stringify(paramResponse).slice(0, 800);

    const info = paramResponse.response?.info_needed || {};
    // Sem package_number: a Shopee recusa o campo em pedido não dividido
    // ("Please don't request with package_number for this unsplit order").
    // Só é reenviado com ele se a Shopee pedir (pedido dividido) — ver abaixo.
    const body: Record<string, any> = { order_sn: orderSn };

    // Campos que a Shopee exige no modo escolhido. Aceita o formato antigo
    // (true) como "sem lista" por compatibilidade.
    const camposDe = (valor: unknown): string[] => (Array.isArray(valor) ? valor.map(String) : []);
    const naoSuportados = (campos: string[], suportados: string[]) => campos.filter((c) => !suportados.includes(c));

    if (info.pickup !== undefined && info.pickup !== null) {
      const campos = camposDe(info.pickup);
      const faltando = naoSuportados(campos, ['address_id', 'pickup_time_id']);
      if (faltando.length > 0) {
        return { success: false, error: `A Shopee pede campos de coleta que o sistema não preenche automaticamente (${faltando.join(', ')}). Organize este envio pelo painel da Shopee. Resposta bruta: ${rawPreview}` };
      }

      const pickup: Record<string, unknown> = {};
      const address = paramResponse.response?.pickup?.address_list?.[0];
      if (campos.includes('address_id')) {
        if (!address) {
          return { success: false, error: `A Shopee exige coleta (pickup) para este pedido, mas não retornou endereço disponível. Resposta bruta: ${rawPreview}` };
        }
        pickup.address_id = address.address_id;
      }
      if (campos.includes('pickup_time_id')) {
        const pickupTimeId = address?.time_slot_list?.[0]?.pickup_time_id;
        if (!pickupTimeId) {
          return { success: false, error: `A Shopee exige coleta (pickup) para este pedido, mas não retornou horário de coleta disponível. Resposta bruta: ${rawPreview}` };
        }
        pickup.pickup_time_id = pickupTimeId;
      }
      body.pickup = pickup;
    } else if (info.dropoff !== undefined && info.dropoff !== null) {
      const campos = camposDe(info.dropoff);
      const faltando = naoSuportados(campos, ['branch_id', 'sender_real_name']);
      if (faltando.length > 0) {
        return { success: false, error: `A Shopee pede campos de postagem que o sistema não preenche automaticamente (${faltando.join(', ')}). Organize este envio pelo painel da Shopee. Resposta bruta: ${rawPreview}` };
      }

      const dropoff: Record<string, unknown> = {};
      if (campos.includes('branch_id')) {
        const branch = paramResponse.response?.dropoff?.branch_list?.[0];
        if (!branch) {
          return { success: false, error: `A Shopee exige postagem (dropoff) em um ponto de entrega, mas não retornou nenhum disponível. Resposta bruta: ${rawPreview}` };
        }
        dropoff.branch_id = branch.branch_id;
      }
      if (campos.includes('sender_real_name')) {
        const senderName = process.env.SHOPEE_SENDER_NAME;
        if (!senderName) {
          return { success: false, error: 'SHOPEE_SENDER_NAME não configurado no servidor (a Shopee exige o nome do remetente para a postagem deste pedido).' };
        }
        dropoff.sender_real_name = senderName;
      }
      body.dropoff = dropoff;
    } else if (info.non_integrated !== undefined && info.non_integrated !== null) {
      const campos = camposDe(info.non_integrated);
      if (campos.length > 0) {
        return { success: false, error: `Canal logístico não integrado: a Shopee exige dados do envio informados pelo vendedor (${campos.join(', ')}). Organize este envio pelo painel da Shopee. Resposta bruta: ${rawPreview}` };
      }
      body.non_integrated = {};
    } else {
      return {
        success: false,
        error: `A Shopee não indicou um método de envio (pickup/dropoff) suportado para este pedido via get_shipping_parameter. Resposta bruta: ${rawPreview}`,
      };
    }

    let resultado = await this.chamarShipOrder(orderSn, body);

    // Pedido dividido (split): a Shopee exige identificar o pacote.
    if (!resultado.success && packageNumber && /package_number/i.test(resultado.error ?? '')) {
      logger.info(`[SHOPEE LABEL] Shopee pediu package_number para ${orderSn} (pedido dividido). Repetindo ship_order com o pacote ${packageNumber}...`);
      resultado = await this.chamarShipOrder(orderSn, { ...body, package_number: packageNumber });
    }
    if (!resultado.success) {
      return resultado;
    }

    logger.success(`[SHOPEE LABEL] ship_order (individual) confirmado com sucesso para ${orderSn}`);
    return { success: true };
  }

  private async chamarShipOrder(orderSn: string, body: Record<string, unknown>): Promise<{ success: boolean; error?: string }> {
    logger.info(`[SHOPEE LABEL] Chamando ship_order para ${orderSn}: ${JSON.stringify(body)}`);
    try {
      const shipResponse = await this.httpClient.post<any>('/logistics/ship_order', body);
      logger.info(`[SHOPEE LABEL] Retorno do ship_order de ${orderSn}: ${JSON.stringify(shipResponse)}`);
      if (shipResponse.error) {
        return { success: false, error: shipResponse.message || shipResponse.error };
      }
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  private async consultarPedido(orderSn: string): Promise<{ status?: string; packageNumber?: string }> {
    try {
      const [pedido] = await this.orderService.buscarDetalhesPedido([orderSn]);
      const packageNumber = (pedido as any)?.package_list?.[0]?.package_number;
      const status = (pedido as any)?.order_status;
      logger.info(`[SHOPEE LABEL] Pedido ${orderSn}: status=${status ?? 'n/a'}, package_number=${packageNumber ?? 'n/a'}, canal=${(pedido as any)?.shipping_carrier ?? 'n/a'}`);
      return { status, packageNumber };
    } catch (error: any) {
      logger.warn(`[SHOPEE LABEL] Falha ao consultar o pedido ${orderSn} (seguindo sem status/package_number): ${error.message}`);
      return {};
    }
  }

  /**
   * Organiza o envio do pedido na Shopee (passo exigido entre o envio da NF-e
   * e a etiqueta). Chamado logo após o upload da NF-e e, como garantia, na
   * impressão. Não reorganiza pedido já organizado (PROCESSED, SHIPPED…).
   * Caminho principal: ship_order (recomendado pela Shopee); plano B:
   * batch_ship_order.
   */
  async organizarEnvio(orderSn: string, pedido?: { status?: string; packageNumber?: string }): Promise<OrganizarEnvioResult> {
    const { status, packageNumber } = pedido ?? (await this.consultarPedido(orderSn));

    if (status && STATUS_JA_ORGANIZADO.has(status)) {
      logger.info(`[SHOPEE LABEL] Envio do pedido ${orderSn} já organizado (status ${status}). Nada a fazer.`);
      return { success: true, jaOrganizado: true };
    }
    if (status && !STATUS_A_ORGANIZAR.has(status)) {
      return {
        success: false,
        error: `O pedido está com status ${status} na Shopee, que não permite organizar o envio (é preciso estar READY_TO_SHIP).`,
      };
    }

    const individual = await this.confirmarEnvioIndividual(orderSn, packageNumber);
    if (individual.success) {
      return { success: true };
    }
    logger.warn(`[SHOPEE LABEL] ship_order falhou para ${orderSn}: ${individual.error}. Tentando batch_ship_order...`);

    try {
      const shipResponse = await this.httpClient.post<any>('/logistics/batch_ship_order', {
        order_list: [{ order_sn: orderSn }],
      });
      const shipItem = getResultItem(shipResponse, orderSn);
      if (!shipResponse.error && !shipItem?.fail_error) {
        logger.success(`[SHOPEE LABEL] batch_ship_order confirmado para ${orderSn} (plano B).`);
        return { success: true };
      }
      const motivoBatch = shipItem?.fail_message || shipItem?.fail_error || shipResponse.message || shipResponse.error;
      return { success: false, error: `ship_order: ${individual.error} | batch_ship_order: ${motivoBatch}` };
    } catch (error: any) {
      return { success: false, error: `ship_order: ${individual.error} | batch_ship_order: ${error.message}` };
    }
  }

  /**
   * Verifica e organiza em lote o envio de vários pedidos. Consulta o status de
   * até 50 pedidos por chamada (get_order_detail) e só chama ship_order para os
   * que ainda estão READY_TO_SHIP/RETRY_SHIP — um de cada vez, para não estourar
   * o limite de requisições da Shopee.
   */
  async verificarEOrganizarEnvios(orderSns: string[]): Promise<VerificacaoEnvioItem[]> {
    const unicos = [...new Set(orderSns.filter(Boolean))];
    const resultados: VerificacaoEnvioItem[] = [];

    for (let i = 0; i < unicos.length; i += 50) {
      const lote = unicos.slice(i, i + 50);
      let detalhes: any[] = [];
      try {
        detalhes = await this.orderService.buscarDetalhesPedido(lote);
      } catch (error: any) {
        for (const orderSn of lote) {
          resultados.push({ orderSn, situacao: 'falha', erro: `Falha ao consultar o pedido na Shopee: ${error.message}` });
        }
        continue;
      }

      const porOrderSn = new Map(detalhes.map((d: any) => [String(d.order_sn), d]));
      for (const orderSn of lote) {
        const pedido = porOrderSn.get(orderSn);
        if (!pedido) {
          resultados.push({ orderSn, situacao: 'nao_encontrado' });
          continue;
        }

        const status: string | undefined = pedido.order_status;
        if (status && STATUS_JA_ORGANIZADO.has(status)) {
          resultados.push({ orderSn, status, situacao: 'ja_organizado' });
          continue;
        }
        if (!status || !STATUS_A_ORGANIZAR.has(status)) {
          resultados.push({ orderSn, status, situacao: 'ignorado' });
          continue;
        }

        const organizacao = await this.organizarEnvio(orderSn, {
          status,
          packageNumber: pedido.package_list?.[0]?.package_number,
        });
        resultados.push(
          organizacao.success
            ? { orderSn, status, situacao: 'organizado_agora' }
            : { orderSn, status, situacao: 'falha', erro: organizacao.error },
        );
      }
    }

    return resultados;
  }

  /**
   * Fluxo completo de emissão de etiqueta (recomendado pelo suporte da Shopee):
   * 1. upload_invoice_doc (NF-e) — feito antes, em ShopeeFiscalService.
   * 2. ship_order — organiza o envio. Normalmente já foi feito logo após a NF-e;
   *    aqui só é refeito se o pedido ainda estiver READY_TO_SHIP.
   * 3. get_tracking_number — o documento só pode ser criado com rastreio.
   * 4. create_shipping_document — dispara a geração do documento (assíncrono).
   *    shipping_document_type fica DENTRO de cada item de order_list aqui.
   * 5. get_shipping_document_result — poll até o status ficar READY.
   * 6. download_shipping_document — baixa o PDF (resposta binária direta). Aqui
   *    shipping_document_type é campo irmão de order_list, não item por item —
   *    diferente do passo 4.
   */
  async obterEtiqueta(orderSn: string): Promise<ShippingLabelResult> {
    const pedido = await this.consultarPedido(orderSn);
    const { packageNumber } = pedido;

    // Guarda o motivo da falha ao organizar o envio — usado depois pra explicar
    // por que o rastreio nunca chegou, em vez de só dizer "tente novamente".
    let motivoFalhaShipOrder: string | undefined;
    const organizacao = await this.organizarEnvio(orderSn, pedido);
    if (!organizacao.success) {
      motivoFalhaShipOrder = organizacao.error;
      logger.warn(`[SHOPEE LABEL] Não foi possível organizar o envio de ${orderSn} (seguindo mesmo assim): ${organizacao.error}`);
    }

    let trackingNumber: string | undefined;
    for (let attempt = 0; attempt < TRACKING_POLL_ATTEMPTS; attempt++) {
      if (attempt > 0) {
        await new Promise((resolve) => setTimeout(resolve, TRACKING_POLL_DELAY_MS));
      }
      try {
        const tracking = await this.orderService.buscarNumeroRastreio(orderSn, packageNumber);
        if (tracking.trackingNumber) {
          trackingNumber = tracking.trackingNumber;
          break;
        }
      } catch (error: any) {
        logger.warn(`[SHOPEE LABEL] Erro ao consultar tracking number de ${orderSn} (tentativa ${attempt + 1}/${TRACKING_POLL_ATTEMPTS}): ${error.message}`);
      }
    }

    if (!trackingNumber) {
      const sufixoMotivo = motivoFalhaShipOrder
        ? ` Motivo reportado pela Shopee ao confirmar o envio: ${motivoFalhaShipOrder}`
        : '';
      return {
        success: false,
        errorCode: 'NOT_PRINTABLE',
        error: `A Shopee ainda não atribuiu um código de rastreio a este pedido. Isso pode levar alguns minutos após a organização do envio (até cerca de 2 horas, segundo a Shopee) — tente novamente mais tarde.${sufixoMotivo}`,
      };
    }

    try {
      const createResponse = await this.httpClient.post<any>('/logistics/create_shipping_document', {
        order_list: [{
          order_sn: orderSn,
          tracking_number: trackingNumber,
          shipping_document_type: SHIPPING_DOCUMENT_TYPE,
        }],
      });

      const createItem = getResultItem(createResponse, orderSn);
      if (createResponse.error || createItem?.fail_error) {
        const rawMessage = createResponse.message || createResponse.error || createItem?.fail_message;
        logger.error(`[SHOPEE LABEL] Erro ao criar documento de envio para ${orderSn}: ${rawMessage}`);
        return { success: false, errorCode: 'SHOPEE_ERROR', error: mapShippingDocumentError(rawMessage) };
      }
    } catch (error: any) {
      logger.error(`[SHOPEE LABEL] Erro ao criar documento de envio para ${orderSn}: ${error.message}`);
      return { success: false, errorCode: 'SHOPEE_ERROR', error: mapShippingDocumentError(error.message) };
    }

    let ready = false;
    for (let attempt = 0; attempt < DOCUMENT_POLL_ATTEMPTS; attempt++) {
      if (attempt > 0) {
        await new Promise((resolve) => setTimeout(resolve, DOCUMENT_POLL_DELAY_MS));
      }

      try {
        const resultResponse = await this.httpClient.post<any>('/logistics/get_shipping_document_result', {
          order_list: [{ order_sn: orderSn }],
        });

        const orderResult = getResultItem(resultResponse, orderSn);
        const status = orderResult?.status;
        logger.info(`[SHOPEE LABEL] Status do documento do pedido ${orderSn}: ${status ?? 'desconhecido'} (tentativa ${attempt + 1}/${DOCUMENT_POLL_ATTEMPTS})`);

        if (status === 'READY') {
          ready = true;
          break;
        }
        if (status === 'FAILED') {
          return {
            success: false,
            errorCode: 'SHOPEE_ERROR',
            error: orderResult?.fail_message || 'A Shopee falhou ao gerar o documento de envio deste pedido.',
          };
        }
      } catch (error: any) {
        logger.warn(`[SHOPEE LABEL] Erro ao consultar status do documento de ${orderSn}: ${error.message}`);
      }
    }

    if (!ready) {
      return {
        success: false,
        errorCode: 'NOT_PRINTABLE',
        error: 'A etiqueta ainda está sendo processada pela Shopee. Tente novamente em alguns minutos.',
      };
    }

    try {
      const buffer = await this.httpClient.postBinary('/logistics/download_shipping_document', {
        order_list: [{ order_sn: orderSn }],
        shipping_document_type: SHIPPING_DOCUMENT_TYPE,
      });

      logger.success(`[SHOPEE LABEL] Etiqueta do pedido ${orderSn} baixada com sucesso.`);

      return {
        success: true,
        buffer,
        contentType: 'application/pdf',
        filename: `etiqueta-${orderSn}.pdf`,
      };
    } catch (error: any) {
      logger.error(`[SHOPEE LABEL] Erro ao baixar etiqueta do pedido ${orderSn}: ${error.message}`);
      return { success: false, errorCode: 'SHOPEE_ERROR', error: mapShippingDocumentError(error.message) };
    }
  }
}
