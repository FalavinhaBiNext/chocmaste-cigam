import { inject, injectable } from 'tsyringe';
import { TrayHttpClient, getTrayResponse } from './trayHttpClient';
import { TrayOrderService } from './trayOrderService';
import { TrayFiscalLogRepository } from '../repositories/trayFiscalLogRepository';
import { TrayFiscalLogOrigem } from '../models/trayFiscalLogModel';
import { divergenciasNotaXml, resumirXmlNFe } from '../utils/nfeXmlResumo';
import { logger } from '@/shared/utils/logger';

export interface EnviarNFeTrayResult {
  success: boolean;
  error?: string;
  invoiceId?: string;
}

const ATRASO_ATUALIZACAO_NFE_MS = 10_000;

/** Contexto do envio iniciado pelo usuário ("Enviar XML"). */
export interface EnvioTrayContexto {
  /** ID curto que aparece em todas as linhas de log do mesmo envio. */
  envioId?: string;
}

/** Prefixo dos logs: "[TRAY ENVIO <id>]" quando há envioId, senão "[TRAY FISCAL]". */
function prefixoLog(contexto?: EnvioTrayContexto): string {
  return contexto?.envioId ? `[TRAY ENVIO ${contexto.envioId}]` : '[TRAY FISCAL]';
}

export interface NotaFiscalTrayInput {
  numero: string | null;
  serie: string | null;
  chaveAcesso: string | null;
  dataFaturamento: string | null;
  valor?: number | string | null;
  xml?: string | null;
}

interface ItemCfopXml {
  cProd: string;
  cfop: string;
}

interface ProductCfopEntry {
  product_id: string;
  variation_id: string;
  cfop: string;
}

@injectable()
export class TrayFiscalService {
  constructor(
    @inject(TrayHttpClient) private readonly httpClient: TrayHttpClient,
    @inject(TrayOrderService) private readonly orderService: TrayOrderService,
    @inject(TrayFiscalLogRepository) private readonly fiscalLogRepository?: TrayFiscalLogRepository,
  ) {}

  /**
   * Faz a chamada de NF-e à Tray e registra request + resposta (status HTTP e
   * corpo) em tray_fiscal_logs — com sucesso ou com erro. É o registro usado
   * para diagnóstico e para responder ao suporte da Tray.
   */
  private async chamarTray<T>(
    metodo: 'POST' | 'PUT',
    origem: TrayFiscalLogOrigem,
    orderId: string,
    invoiceId: string | null,
    path: string,
    body: unknown,
    p = '[TRAY FISCAL]',
  ): Promise<T> {
    const inicio = Date.now();
    try {
      const resposta = await this.httpClient.send<T>(metodo, path, body);
      const idRetornado = (resposta.data as any)?.id;
      logger.info(`${p} Retorno da Tray — ${metodo} ${path}: HTTP ${resposta.status} em ${Date.now() - inicio}ms ${JSON.stringify(resposta.data)}`);
      await this.registrarLog({
        metodo,
        origem,
        order_id: orderId,
        invoice_id: invoiceId ?? (idRetornado !== undefined ? String(idRetornado) : null),
        url: resposta.url,
        request_body: body,
        http_status: resposta.status,
        response_body: resposta.data,
        sucesso: true,
        duracao_ms: Date.now() - inicio,
      });
      return resposta.data;
    } catch (error: any) {
      const trayResponse = getTrayResponse(error);
      logger.error(
        `${p} Retorno da Tray — ${metodo} ${path}: ` +
        `HTTP ${trayResponse?.status ?? 'sem resposta'} em ${Date.now() - inicio}ms ${trayResponse ? JSON.stringify(trayResponse.data) : error.message}`,
      );
      await this.registrarLog({
        metodo,
        origem,
        order_id: orderId,
        invoice_id: invoiceId,
        url: path,
        request_body: body,
        http_status: trayResponse?.status ?? null,
        response_body: trayResponse?.data ?? null,
        sucesso: false,
        erro: error.message,
        duracao_ms: Date.now() - inicio,
      });
      throw error;
    }
  }

  /** Grava o log sem nunca interromper o envio da NF-e. */
  private async registrarLog(data: Parameters<TrayFiscalLogRepository['create']>[0]): Promise<void> {
    if (!this.fiscalLogRepository) return;
    try {
      await this.fiscalLogRepository.create(data);
    } catch (error: any) {
      logger.warn(`[TRAY FISCAL] Falha ao gravar log da chamada ${data.metodo} do pedido ${data.order_id}: ${error.message}`);
    }
  }

  private extrairValorXml(xml?: string | null): number | null {
    if (!xml) return null;
    const match = xml.match(/<vNF>([0-9.]+)<\/vNF>/);
    if (match && match[1]) {
      const parsed = parseFloat(match[1]);
      return isNaN(parsed) ? null : parsed;
    }
    return null;
  }

  /**
   * Extrai o código do produto (cProd) e o CFOP de cada item <det> do XML da NF-e.
   * Usa regex em vez de um parser XML completo — mesma abordagem já usada em
   * extrairValorXml — porque os blocos <det> da NF-e são planos (não aninhados).
   */
  private extrairItensCfopXml(xml?: string | null, p = '[TRAY FISCAL]'): ItemCfopXml[] {
    if (!xml) return [];
    const itens: ItemCfopXml[] = [];
    const detRegex = /<det\b[^>]*>([\s\S]*?)<\/det>/g;
    let match: RegExpExecArray | null;
    while ((match = detRegex.exec(xml)) !== null) {
      const bloco = match[1];
      const cProdMatch = bloco.match(/<cProd>([^<]+)<\/cProd>/);
      const cfopMatch = bloco.match(/<CFOP>([^<]+)<\/CFOP>/);
      if (cProdMatch && cfopMatch) {
        const cProd = cProdMatch[1].trim();
        const cfop = cfopMatch[1].trim();
        logger.info(`${p} CFOP extraído com sucesso do XML — produto ${cProd}: CFOP ${cfop}`);
        itens.push({ cProd, cfop });
      }
    }
    return itens;
  }

  /**
   * Monta o array ProductCfop (CFOP por produto/variação) exigido pela Tray,
   * correlacionando os itens do XML (por cProd) com os produtos do pedido na
   * Tray (por reference, assumindo que o SKU/reference cadastrado na Tray bate
   * com o código do produto usado na NF-e). Retorna undefined se não houver
   * itens no XML, se a consulta à Tray falhar, ou se nenhum item for
   * correlacionado — nesses casos a NF-e segue sem ProductCfop, como hoje.
   */
  private async construirProductCfop(orderId: string, xml?: string | null, p = '[TRAY FISCAL]'): Promise<ProductCfopEntry[] | undefined> {
    const itensXml = this.extrairItensCfopXml(xml, p);
    if (itensXml.length === 0) {
      logger.warn(`${p} Nenhum item <det> com cProd/CFOP encontrado no XML da NF-e do pedido ${orderId}`);
      return undefined;
    }

    let pedidoCompleto;
    try {
      pedidoCompleto = await this.orderService.buscarPedidoCompleto(orderId);
    } catch (error: any) {
      logger.warn(`${p} Falha ao buscar pedido completo ${orderId} na Tray para montar ProductCfop: ${error.message}`);
      return undefined;
    }

    const produtosVendidos = pedidoCompleto?.Order?.ProductsSold || [];
    const referenciasTray = produtosVendidos.map((ps: any) => String(ps?.ProductsSold?.reference || '').trim() || '(sem reference)');
    logger.info(`${p} Pedido ${orderId} na Tray tem ${produtosVendidos.length} produto(s) vendido(s); references: ${JSON.stringify(referenciasTray)}`);
    const productCfop: ProductCfopEntry[] = [];

    for (const item of itensXml) {
      const produto = produtosVendidos.find((p: any) => {
        const ref = String(p?.ProductsSold?.reference || '').trim();
        return ref && ref === item.cProd;
      });

      if (!produto) {
        logger.warn(`${p} Pedido ${orderId}: nenhum produto da Tray com reference="${item.cProd}" (CFOP ${item.cfop}) — item omitido do ProductCfop. References disponíveis: ${JSON.stringify(referenciasTray)}`);
        continue;
      }

      const ps: any = (produto as any).ProductsSold;
      productCfop.push({
        product_id: String(ps.product_id),
        variation_id: String(ps.variation_id ?? '0'),
        cfop: item.cfop,
      });
    }

    if (productCfop.length === 0) {
      logger.warn(`${p} Pedido ${orderId}: nenhum item do XML foi correlacionado a produtos da Tray — ProductCfop não será enviado`);
      return undefined;
    }

    logger.info(`${p} Pedido ${orderId}: ProductCfop montado com ${productCfop.length}/${itensXml.length} item(ns): ${JSON.stringify(productCfop)}`);
    return productCfop;
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
   * Log detalhado do que vai ser enviado: de onde veio o valor, resumo do XML
   * (identificação, autorização, emitente, destinatário mascarado, totais e
   * itens) e divergências entre o registrado no sistema e o XML.
   */
  private logDetalhesNota(orderId: string, nota: NotaFiscalTrayInput, orderInvoice: Record<string, unknown>, p: string): void {
    const valorEnviado = Number(orderInvoice.value) || 0;
    const origemValor = Number(nota.valor)
      ? `total do pedido no sistema (${Number(nota.valor).toFixed(2)})`
      : this.extrairValorXml(nota.xml)
        ? 'vNF do XML (pedido sem total no sistema)'
        : 'nenhum — valor 0 (sem total no pedido e sem vNF no XML)';
    logger.info(
      `${p} Dados estruturados para a Tray — order_id=${orderId}, number=${orderInvoice.number}, serie=${orderInvoice.serie}, ` +
      `issue_date=${orderInvoice.issue_date} (data de faturamento recebida: ${nota.dataFaturamento ?? 'vazia'}), ` +
      `key=${orderInvoice.key}, value=${valorEnviado.toFixed(2)} (origem: ${origemValor})`,
    );

    const resumo = resumirXmlNFe(nota.xml);
    if (resumo) {
      logger.info(
        `${p} XML da NF-e — ${resumo.tamanho} caracteres | chave ${resumo.chave ?? 'não encontrada'} | nNF ${resumo.numero ?? '-'} série ${resumo.serie ?? '-'} modelo ${resumo.modelo ?? '-'} | ` +
        `emissão ${resumo.emissao ?? '-'} | natOp "${resumo.naturezaOperacao ?? '-'}" | ambiente ${resumo.ambiente ?? 'não informado'}`,
      );
      logger.info(
        `${p} Autorização SEFAZ — ` +
        (resumo.protocolo
          ? `cStat ${resumo.protocolo.cStat ?? '-'} "${resumo.protocolo.motivo ?? '-'}", protocolo ${resumo.protocolo.nProt ?? '-'}`
          : 'XML sem protocolo (infProt)'),
      );
      logger.info(
        `${p} Emitente CNPJ ${resumo.emitente.cnpj ?? '-'} (${resumo.emitente.nome ?? '-'}/${resumo.emitente.uf ?? '-'}) → ` +
        `Destinatário ${resumo.destinatario.documento ?? '-'} (${resumo.destinatario.municipio ?? '-'}/${resumo.destinatario.uf ?? '-'}, CEP ${resumo.destinatario.cep ?? '-'})`,
      );
      logger.info(
        `${p} Totais do XML — vNF ${resumo.totais.vNF ?? '-'} | vProd ${resumo.totais.vProd ?? '-'} | vFrete ${resumo.totais.vFrete ?? '-'} | vDesc ${resumo.totais.vDesc ?? '-'} | ${resumo.itens.length} item(ns)`,
      );
      for (const item of resumo.itens) {
        logger.info(
          `${p}   item ${item.item}: cProd ${item.cProd ?? '-'} | CFOP ${item.cfop ?? '-'} | qtd ${item.qCom ?? '-'} | vProd ${item.vProd ?? '-'} | ${item.xProd ?? ''}`,
        );
      }
    }

    const divergencias = divergenciasNotaXml(
      { numero: nota.numero, serie: nota.serie, chaveAcesso: nota.chaveAcesso, valorEnviado },
      resumo,
    );
    if (divergencias.length === 0) {
      logger.info(`${p} Conferência sistema × XML: sem divergências.`);
    }
    for (const divergencia of divergencias) {
      logger.warn(`${p} ATENÇÃO — ${divergencia}`);
    }
  }

  /**
   * Loga se o XML da NF-e foi incluído como xml_danfe no payload enviado à Tray.
   */
  private logEnvioXml(orderId: string, nota: NotaFiscalTrayInput, p = '[TRAY FISCAL]'): void {
    if (nota.xml) {
      logger.info(`${p} XML da NF-e incluído no payload (xml_danfe) do pedido ${orderId} — ${nota.xml.length} caracteres`);
    } else {
      logger.warn(`${p} Nenhum XML disponível para anexar como xml_danfe na NF-e do pedido ${orderId}`);
    }
  }

  /**
   * Loga o payload exato enviado à Tray (criação ou atualização da NF-e). O
   * xml_danfe é substituído por um placeholder com o tamanho, pra não inflar
   * o log com o XML inteiro (o conteúdo já é logado separadamente por logEnvioXml).
   */
  private logPayload(rota: string, orderInvoice: Record<string, unknown>, p = '[TRAY FISCAL]'): void {
    const payloadParaLog = { ...orderInvoice };
    if (typeof payloadParaLog.xml_danfe === 'string') {
      payloadParaLog.xml_danfe = `<xml omitido, ${payloadParaLog.xml_danfe.length} caracteres>`;
    }
    logger.info(`${p} Payload enviado — ${rota}: ${JSON.stringify(payloadParaLog)}`);
  }

  /**
   * Registra a NF-e no pedido Tray via POST /orders/:order_id/invoices.
   * A Tray espera o wrapper OrderInvoice com: number, serie, issue_date (YYYY-MM-DD),
   * key (44 dígitos) e value (numérico).
   */
  async enviarNFe(orderId: string, nota: NotaFiscalTrayInput, contexto?: EnvioTrayContexto): Promise<EnviarNFeTrayResult> {
    const p = prefixoLog(contexto);
    const inicio = Date.now();
    logger.info(`${p} NF-e recebida para registro — pedido ${orderId} (número=${nota.numero}, série=${nota.serie}, chave=${nota.chaveAcesso})`);

    const erroValidacao = this.validarNota(nota);
    if (erroValidacao) {
      logger.warn(`${p} NF-e do pedido ${orderId} inválida: ${erroValidacao}`);
      return { success: false, error: erroValidacao };
    }

    const orderInvoice = this.montarOrderInvoice(nota);
    this.logDetalhesNota(orderId, nota, orderInvoice, p);

    const productCfop = await this.construirProductCfop(orderId, nota.xml, p);
    if (productCfop) {
      orderInvoice.ProductCfop = productCfop;
    } else {
      logger.warn(`${p} ProductCfop NÃO será enviado — a Tray receberá a NF-e sem CFOP por produto.`);
    }

    const rotaEnvio = `POST /orders/${orderId}/invoices`;
    this.logEnvioXml(orderId, nota, p);
    this.logPayload(rotaEnvio, orderInvoice, p);

    try {
      logger.info(`${p} Enviando NF-e à Tray — ${rotaEnvio}`);
      const resposta = await this.chamarTray<{ id?: string | number }>(
        'POST',
        'envio',
        orderId,
        null,
        `/orders/${orderId}/invoices`,
        { OrderInvoice: orderInvoice },
        p,
      );

      logger.success(`${p} SUCESSO — NF-e registrada no pedido Tray ${orderId}`);

      const statusFaturadoId = process.env.TRAY_STATUS_FATURADO_ID;
      if (!statusFaturadoId) {
        logger.info(`${p} TRAY_STATUS_FATURADO_ID não configurado — status do pedido na Tray não será alterado.`);
      }
      if (statusFaturadoId) {
        try {
          const statusIdNum = parseInt(statusFaturadoId, 10);
          if (!isNaN(statusIdNum) && statusIdNum > 0) {
            logger.info(`${p} Atualizando status do pedido Tray ${orderId} para status_id=${statusIdNum}...`);
            await this.httpClient.put(`/orders/${orderId}`, {
              Order: {
                status_id: statusIdNum,
              },
            });
            logger.success(`${p} Status do pedido Tray ${orderId} atualizado para status_id=${statusIdNum}`);
          }
        } catch (statusError: any) {
          logger.warn(`${p} NF-e registrada, mas falha ao atualizar status do pedido Tray ${orderId}: ${statusError.message}`);
        }
      }

      const invoiceId = resposta?.id !== undefined ? String(resposta.id) : undefined;
      if (invoiceId) {
        logger.info(`${p} Tray devolveu invoice_id=${invoiceId} para a NF-e ${nota.numero}.`);
        this.agendarAtualizacaoNFe(orderId, invoiceId, nota, contexto);
      } else {
        logger.warn(`${p} A Tray não devolveu um id da nota — a atualização automática (PUT) não será agendada e o botão "Atualizar na Tray" não funcionará para esta NF-e.`);
      }

      logger.success(`${p} Envio concluído em ${Date.now() - inicio}ms — pedido Tray ${orderId}, NF-e ${nota.numero}/${nota.serie}, invoice_id=${invoiceId ?? 'não informado'}.`);
      return { success: true, invoiceId };
    } catch (error: any) {
      logger.error(`${p} FALHA em ${Date.now() - inicio}ms — erro ao registrar NF-e no pedido Tray ${orderId}: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  /**
   * Agenda uma chamada de atualizarNFe (PUT) com os mesmos dados enviados no
   * registro, 10 segundos após o POST bem-sucedido. O timer é "unref"ado para
   * não segurar o processo Node vivo (ex.: em testes ou durante um shutdown).
   */
  private agendarAtualizacaoNFe(orderId: string, invoiceId: string, nota: NotaFiscalTrayInput, contexto?: EnvioTrayContexto): void {
    const p = prefixoLog(contexto);
    logger.info(`${p} Atualização automática da NF-e ${invoiceId} do pedido ${orderId} agendada para daqui a ${ATRASO_ATUALIZACAO_NFE_MS / 1000}s`);

    const timer = setTimeout(() => {
      this.atualizarNFe(orderId, invoiceId, nota, 'atualizacao_automatica', contexto)
        .then((resultado) => {
          if (resultado.success) {
            logger.success(`${p} SUCESSO — atualização automática da NF-e ${invoiceId} do pedido ${orderId} concluída`);
          } else {
            logger.warn(`${p} FALHA — atualização automática da NF-e ${invoiceId} do pedido ${orderId}: ${resultado.error}`);
          }
        })
        .catch((error: any) => {
          logger.error(`${p} FALHA — erro inesperado na atualização automática da NF-e ${invoiceId} do pedido ${orderId}: ${error.message}`);
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
  async atualizarNFe(
    orderId: string,
    invoiceId: string,
    nota: NotaFiscalTrayInput,
    origem: TrayFiscalLogOrigem = 'atualizacao_manual',
    contexto?: EnvioTrayContexto,
  ): Promise<EnviarNFeTrayResult> {
    const p = prefixoLog(contexto);
    logger.info(`${p} NF-e recebida para atualização — invoice ${invoiceId}, pedido ${orderId} (número=${nota.numero}, série=${nota.serie})`);

    const erroValidacao = this.validarNota(nota);
    if (erroValidacao) {
      logger.warn(`${p} Atualização da NF-e ${invoiceId} do pedido ${orderId} abortada: ${erroValidacao}`);
      return { success: false, error: erroValidacao };
    }

    const orderInvoice = this.montarOrderInvoice(nota);
    const productCfop = await this.construirProductCfop(orderId, nota.xml, p);
    if (productCfop) {
      orderInvoice.ProductCfop = productCfop;
    }

    const rotaAtualizacao = `PUT /orders/${orderId}/invoices/${invoiceId}`;
    this.logEnvioXml(orderId, nota, p);
    this.logPayload(rotaAtualizacao, orderInvoice, p);

    try {
      logger.info(`${p} Enviando atualização da NF-e à Tray — ${rotaAtualizacao}`);
      await this.chamarTray('PUT', origem, orderId, invoiceId, `/orders/${orderId}/invoices/${invoiceId}`, orderInvoice, p);

      logger.success(`${p} SUCESSO — NF-e ${invoiceId} atualizada no pedido Tray ${orderId}`);
      return { success: true, invoiceId };
    } catch (error: any) {
      logger.error(`${p} FALHA — erro ao atualizar NF-e ${invoiceId} no pedido Tray ${orderId}: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  /**
   * Lista as chamadas de NF-e registradas (mais recentes primeiro), com os
   * bodies já convertidos de volta para JSON. O XML da nota (xml_danfe) vem
   * resumido, a menos que incluirXml seja true.
   */
  async listarLogs(orderId?: string, incluirXml = false, limit = 50) {
    if (!this.fiscalLogRepository) return [];
    const logs = orderId
      ? await this.fiscalLogRepository.findByOrderId(orderId, limit)
      : await this.fiscalLogRepository.findRecent(limit);

    return logs.map((log) => ({
      id: log.id,
      data_hora: log.created_at,
      metodo: log.metodo,
      origem: log.origem,
      order_id: log.order_id,
      invoice_id: log.invoice_id,
      url: log.url,
      http_status: log.http_status,
      sucesso: log.sucesso,
      erro: log.erro,
      duracao_ms: log.duracao_ms,
      request_body: resumirXml(parseJson(log.request_body), incluirXml),
      response_body: parseJson(log.response_body),
    }));
  }
}

function parseJson(valor: string | null): unknown {
  if (valor === null) return null;
  try {
    return JSON.parse(valor);
  } catch {
    return valor;
  }
}

/** Troca o XML da nota por um resumo (tamanho), mantendo o restante do body. */
function resumirXml(body: unknown, incluirXml: boolean): unknown {
  if (incluirXml || !body || typeof body !== 'object') return body;
  const resumir = (obj: Record<string, unknown>) =>
    typeof obj.xml_danfe === 'string'
      ? { ...obj, xml_danfe: `<xml omitido, ${obj.xml_danfe.length} caracteres — use incluirXml=true para ver>` }
      : obj;
  const b = body as Record<string, unknown>;
  return b.OrderInvoice && typeof b.OrderInvoice === 'object'
    ? { ...b, OrderInvoice: resumir(b.OrderInvoice as Record<string, unknown>) }
    : resumir(b);
}
