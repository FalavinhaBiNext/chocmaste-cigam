import { inject, injectable } from 'tsyringe';
import axios from 'axios';
import https from 'https';
import { CigamHttpClient } from './cigamHttpClient';
import { CigamClienteService } from './cigamClienteService';
import { CigamTransportadoraService } from './cigamTransportadoraService';
import { CanalVendaRepository } from '@/modules/canalVenda/repositories/canalVendaRepository';
import { UsuarioCigamService } from '@/modules/usuarioCigam/services/usuarioCigamService';
import { DeParaFormasPagamentoRepository } from '@/modules/depara/repositories/deparaFormasPagamentoRepository';
import { DeParaProdutosRepository } from '@/modules/depara/repositories/deparaProdutosRepository';
import { PedidoService } from '@/modules/pedido/services/pedidoService';
import { EventService } from '@/modules/events/services/eventService';
import { logger } from '@/shared/utils/logger';
import { delay } from '@/shared/utils/delay';
import { calcularPercentualDesconto } from '@/shared/utils/desconto';

// Mesmos fallbacks fixos de id_loja do Bling usados em webhookService.ts pra
// identificar o marketplace quando o canal ainda não está sincronizado em
// canal_vendas.
const MERCADO_LIVRE_ID_LOJA_FALLBACK = '203347320';
const SHOPEE_ID_LOJA_FALLBACK = '204961504';
// Transportadoras cadastradas no CIGAM pra representar o transporte padrão de
// cada marketplace quando o pedido chega sem transportadora vinculada (id 0/ausente) —
// caso do "Mercado Envios" (Mercado Livre) e do transporte padrão da Shopee.
const MERCADO_LIVRE_TRANSPORTADORA_CIGAM_ID = '000374';
const SHOPEE_TRANSPORTADORA_CIGAM_ID = '000425';

@injectable()
export class CigamPedidoService {
  constructor(
    @inject(CigamHttpClient) private readonly cigamHttpClient: CigamHttpClient,
    @inject(CigamClienteService) private readonly cigamClienteService: CigamClienteService,
    @inject(CigamTransportadoraService) private readonly cigamTransportadoraService: CigamTransportadoraService,
    @inject(CanalVendaRepository) private readonly canalVendaRepository: CanalVendaRepository,
    @inject(UsuarioCigamService) private readonly usuarioCigamService: UsuarioCigamService,
    @inject(DeParaFormasPagamentoRepository) private readonly deParaFormasPagamentoRepo: DeParaFormasPagamentoRepository,
    @inject(DeParaProdutosRepository) private readonly deParaProdutosRepo: DeParaProdutosRepository,
    @inject(PedidoService) private readonly pedidoService: PedidoService,
    @inject(EventService) private readonly eventService?: EventService,
  ) { }

  private async getActiveEnv(): Promise<string> {
    const usuarios = await this.usuarioCigamService.findAll();
    const ativo = usuarios.find(u => u.ativo);
    if (!ativo) {
      return 'homologacao';
    }
    return ativo.ambiente;
  }

  async enviarPedido(
    pedidoBling: any,
    unidadeNegocio?: string,
    codigoConta?: string,
    codigoPedidoCigamExistente?: string | null,
    eventId?: string
  ): Promise<string> {
    logger.info(`Iniciando integração do pedido Bling #${pedidoBling.numero} para o CIGAM...`);

    // 0. Detecção de pedido CIGAM pré-existente (idempotência)
    let codigoPedidoCigam = codigoPedidoCigamExistente ? String(codigoPedidoCigamExistente).trim() : null;

    if (!codigoPedidoCigam && pedidoBling?.id) {
      try {
        const pedidoLocal = await this.pedidoService.findByIdBling(String(pedidoBling.id));
        if (pedidoLocal?.numero_pedido_cigam) {
          codigoPedidoCigam = String(pedidoLocal.numero_pedido_cigam).trim();
          logger.info(`Pedido Bling #${pedidoBling.numero} já possui código CIGAM registrado no banco local: ${codigoPedidoCigam}`);
        }
      } catch (err: any) {
        logger.warn(`Não foi possível verificar pedido local para o pedido Bling #${pedidoBling.numero}: ${err.message}`);
      }
    }

    // Se o código CIGAM for idêntico ao número do pedido Bling, trata-se de resquício de erro antigo (fallback indevido)
    if (codigoPedidoCigam && String(codigoPedidoCigam).trim() === String(pedidoBling.numero).trim()) {
      logger.warn(`Código CIGAM registrado (#${codigoPedidoCigam}) é idêntico ao número do pedido Bling (#${pedidoBling.numero}). Desconsiderando código espúrio para criar nova capa no CIGAM.`);
      codigoPedidoCigam = null;
    }

    // 1. Resolução do Cliente (obter ou criar dinamicamente)
    const idClienteBling = String(pedidoBling.contato.id);
    const idClienteCigam = (await this.cigamClienteService.obterOuCriarCliente(idClienteBling, unidadeNegocio)).trim();

    // 2. Resolução da Transportadora (obter ou criar dinamicamente)
    let idTransportadoraCigam = '';
    const idTranspBling = pedidoBling.transporte?.contato?.id || pedidoBling.transportador?.id;
    if (idTranspBling && idTranspBling !== 0 && idTranspBling !== '0') {
      idTransportadoraCigam = (await this.cigamTransportadoraService.obterOuCriarTransportadora(String(idTranspBling))).trim();
    } else {
      // Pedidos do Mercado Livre ("Mercado Envios") e da Shopee (transporte
      // próprio) chegam do Bling sem transportadora vinculada (id 0/ausente/"").
      // Nesse caso, em vez de enviar o pedido ao CIGAM sem transportadora,
      // força a transportadora padrão cadastrada no CIGAM pro marketplace —
      // mas só quando o canal de venda do pedido realmente for identificado
      // como Mercado Livre ou Shopee.
      const idLoja = pedidoBling.loja?.id ? String(pedidoBling.loja.id) : undefined;
      let ehMercadoLivre = idLoja === MERCADO_LIVRE_ID_LOJA_FALLBACK;
      let ehShopee = idLoja === SHOPEE_ID_LOJA_FALLBACK;
      if (idLoja && !ehMercadoLivre && !ehShopee) {
        const canalVenda = await this.canalVendaRepository.findByIdBling(idLoja);
        const tipoCanalNormalizado = (canalVenda?.tipo || '').toLowerCase();
        ehMercadoLivre = tipoCanalNormalizado.includes('mercado');
        ehShopee = tipoCanalNormalizado.includes('shopee');
      }

      if (ehMercadoLivre) {
        idTransportadoraCigam = MERCADO_LIVRE_TRANSPORTADORA_CIGAM_ID;
        logger.info(
          `Pedido sem transportadora válida, mas canal de venda (loja ${idLoja}) identificado como Mercado Livre. `
          + `Forçando transportadora padrão do CIGAM: ${idTransportadoraCigam}.`
        );
      } else if (ehShopee) {
        idTransportadoraCigam = SHOPEE_TRANSPORTADORA_CIGAM_ID;
        logger.info(
          `Pedido sem transportadora válida, mas canal de venda (loja ${idLoja}) identificado como Shopee. `
          + `Forçando transportadora padrão do CIGAM: ${idTransportadoraCigam}.`
        );
      } else {
        logger.info('Pedido sem transportadora válida (ID 0 ou ausente). Enviando ao CIGAM sem transportadora.');
      }
    }

    // 3. Resolução da Forma de Pagamento
    let idCondicaoPagamentoCigam = '';
    if (pedidoBling.parcelas && pedidoBling.parcelas.length > 0) {
      const primeiraParcela = pedidoBling.parcelas[0];
      if (primeiraParcela.formaPagamento?.id) {
        const idFormaBling = String(primeiraParcela.formaPagamento.id);
        const mapForma = await this.deParaFormasPagamentoRepo.findByIdBling(idFormaBling);
        if (!mapForma) {
          throw new Error(`Forma de pagamento (ID Bling: ${idFormaBling}) não possui mapeamento De-Para para o CIGAM.`);
        }
        idCondicaoPagamentoCigam = mapForma.id_cigam.trim();
      }
    }

    // 4. Resolução dos Itens (Produtos) e validação dos De-Paras
    const itensMapeados = [];
    for (const item of pedidoBling.itens) {
      const idProdutoBling = String(item.produto?.id || item.id);
      const mapProduto = await this.deParaProdutosRepo.findByIdBling(idProdutoBling);
      if (!mapProduto) {
        throw new Error(`Produto "${item.descricao}" (ID Bling: ${idProdutoBling}) não possui mapeamento De-Para para o CIGAM.`);
      }
      itensMapeados.push({
        idProdutoBling,
        idMaterialCigam: mapProduto.id_cigam.trim(),
        quantidade: item.quantidade,
        valorUnitario: item.valor,
        valorTotal: item.valorTotal || (item.valor * item.quantidade)
      });
    }

    // 5. Obter ambiente e token do CIGAM
    const ambiente = await this.getActiveEnv();
    const usuarioCigam = await this.usuarioCigamService.findByEnv(ambiente);
    if (!usuarioCigam) {
      throw new Error(`Configurações do ambiente CIGAM "${ambiente}" não encontradas.`);
    }
    const baseUrl = usuarioCigam.url_ambiente;

    // Dados de frete, desconto e encargos (utilizados na capa e no PATCH)
    const valorFrete = pedidoBling.transporte?.frete ?? 0;
    const descontoValor = typeof pedidoBling.desconto === 'object' && pedidoBling.desconto !== null
      ? (pedidoBling.desconto.valor ?? 0)
      : (Number(pedidoBling.desconto) || 0);
    const outrasDespesas = Number(pedidoBling.outrasDespesas) || 0;
    // Base do percentual: total bruto dos produtos (antes do desconto). Se o
    // Bling não enviar totalProdutos, usa a soma dos itens.
    const totalProdutos = Number(pedidoBling.totalProdutos)
      || itensMapeados.reduce((soma, item) => soma + (Number(item.valorTotal) || 0), 0);
    const percentualDesconto = calcularPercentualDesconto(descontoValor, totalProdutos);

    // 6. Montar o payload da Capa do Pedido e criar apenas se não existir
    if (!codigoPedidoCigam) {
      let prazo = pedidoBling.dataSaida || pedidoBling.data;
      try {
        if (new Date(prazo) < new Date(pedidoBling.data)) {
          prazo = pedidoBling.data;
        }
      } catch {
        prazo = pedidoBling.data;
      }

      let prazoProgramado = pedidoBling.dataPrevista;
      if (!prazoProgramado || prazoProgramado === '0000-00-00') {
        prazoProgramado = prazo;
      }

      const partesObservacao: string[] = [`Bling Pedido #${pedidoBling.numero}`];
      if (pedidoBling.observacoes) {
        partesObservacao.push(pedidoBling.observacoes);
      }
      if (descontoValor > 0) {
        partesObservacao.push(`Desconto: ${descontoValor.toFixed(2).replace('.', ',')}`);
      }
      if (valorFrete > 0) {
        partesObservacao.push(`Frete: ${valorFrete.toFixed(2).replace('.', ',')}`);
      }
      if (outrasDespesas > 0) {
        partesObservacao.push(`Encargos: ${outrasDespesas.toFixed(2).replace('.', ',')}`);
      }

      const payloadCapa = {
        CodigoCliente: idClienteCigam,
        DataPedido: pedidoBling.data,
        CodigoCondicaoPagamento: idCondicaoPagamentoCigam,
        CodigoTransportadora: idTransportadoraCigam,
        Observacao: partesObservacao.join(' - ').toUpperCase(),
        CopiarObservacoesCliente: true,
        PrazoEntrega: prazo,
        PrazoProgramado: prazoProgramado,
        OrigemPedido: 'Bling Integration',
        UnidadeNegocio: unidadeNegocio || process.env.CIGAM_DEFAULT_UNIDADE_NEGOCIO || '',
        ...(codigoConta ? { CodigoConta: codigoConta } : {}),
      };

      logger.info(`Enviando capa do pedido #${pedidoBling.numero} para o CIGAM...`);
      const responseCapa: any = await this.cigamHttpClient.post(
        baseUrl,
        ambiente,
        '/API/api/comercial/fa/Pedido/Salvar',
        payloadCapa
      );

      // CIGAM retorna HTTP 200 com { success: false, messages: [...] } em caso de falha de validação/regra de negócio
      if (responseCapa && responseCapa.success === false) {
        const erros = Array.isArray(responseCapa.messages) ? responseCapa.messages.join(' | ') : (responseCapa.message || 'Erro na API do CIGAM');
        throw new Error(`CIGAM rejeitou a criação da capa do pedido #${pedidoBling.numero}: ${erros}`);
      }

      codigoPedidoCigam =
        responseCapa?.data?.codigoPedido ||
        responseCapa?.data?.Codigo ||
        responseCapa?.CodigoPedido ||
        responseCapa?.codigoPedido ||
        responseCapa?.Codigo ||
        responseCapa?.codigo;

      if (!codigoPedidoCigam) {
        const erros = Array.isArray(responseCapa?.messages) ? responseCapa.messages.join(' | ') : JSON.stringify(responseCapa);
        throw new Error(`Não foi possível recuperar o código do pedido criado no CIGAM. Resposta: ${erros}`);
      }

      const codigoSalvo = String(codigoPedidoCigam);
      logger.success(`Capa do pedido criada no CIGAM com sucesso. Código do pedido no CIGAM: ${codigoSalvo}`);

      try {
        const pedidoLocal = await this.pedidoService.findByIdBling(String(pedidoBling.id));
        await this.pedidoService.update(pedidoLocal.id, { numero_pedido_cigam: codigoSalvo });
        logger.success(`Código do pedido CIGAM (${codigoSalvo}) salvo no pedido local (${pedidoLocal.id}) logo após a criação da capa.`);
      } catch (error: any) {
        logger.error(`Falha ao salvar numero_pedido_cigam no pedido local logo após a criação da capa: ${error.message}`);
      }

      if (this.eventService) {
        try {
          if (eventId) {
            await this.eventService.setEventCigamId(eventId, codigoSalvo);
          } else if (pedidoBling?.id) {
            const ev = await this.eventService.findByPedido(Number(pedidoBling.id));
            if (ev) {
              await this.eventService.setEventCigamId(ev.id, codigoSalvo);
            }
          }
        } catch (error: any) {
          logger.error(`Falha ao salvar cigam_pedido_id no evento logo após a criação da capa: ${error.message}`);
        }
      }
    } else {
      logger.info(`Retomando pedido CIGAM #${codigoPedidoCigam} já existente (capa não será recriada)...`);
      if (this.eventService && eventId) {
        try {
          await this.eventService.setEventCigamId(eventId, codigoPedidoCigam);
        } catch (error: any) {
          logger.error(`Falha ao atualizar cigam_pedido_id no evento durante retomada: ${error.message}`);
        }
      }
    }

    // 7. Enviar os itens do pedido (com reconciliação se a capa já existia)
    let itensParaEnviar = itensMapeados;
    let itensJaPresentesNoCigam: any[] = [];

    if (codigoPedidoCigam) {
      try {
        const respItens: any = await this.cigamHttpClient.get(
          baseUrl,
          ambiente,
          '/API/api/comercial/fa/Pedido/BuscarItensPedido',
          { params: { codigoPedido: codigoPedidoCigam } }
        );
        itensJaPresentesNoCigam = Array.isArray(respItens) ? respItens : (respItens?.data ?? []);

        if (itensJaPresentesNoCigam.length > 0) {
          const codigosMateriaisExistentes = new Set(
            itensJaPresentesNoCigam.map((it: any) =>
              String(it.CodigoMaterial || it.codigoMaterial || it.Material || it.material || it.cd_material || it.CdMaterial || it.codigo || '').trim()
            ).filter(Boolean)
          );

          if (codigosMateriaisExistentes.size > 0) {
            itensParaEnviar = itensMapeados.filter(
              (item) => !codigosMateriaisExistentes.has(String(item.idMaterialCigam).trim())
            );

            if (itensParaEnviar.length === 0) {
              logger.info(`Pedido CIGAM #${codigoPedidoCigam} já possui todos os ${itensMapeados.length} itens cadastrados. Pulando envio de itens.`);
            } else {
              logger.info(`Pedido CIGAM #${codigoPedidoCigam} já possui ${itensMapeados.length - itensParaEnviar.length} itens cadastrados. Enviando ${itensParaEnviar.length} item(ns) pendente(s)...`);
            }
          }
        }
      } catch (err: any) {
        logger.warn(`Não foi possível pré-consultar itens existentes no CIGAM #${codigoPedidoCigam}: ${err.message}. Prosseguindo com envio dos itens.`);
      }
    }

    const centroArmazenagem = process.env.CIGAM_DEFAULT_CENTRO_ARMAZENAGEM || '050';
    for (const item of itensParaEnviar) {
      const payloadItem = {
        CodigoPedido: codigoPedidoCigam,
        CodigoMaterial: item.idMaterialCigam,
        Quantidade: item.quantidade,
        ValorUnitario: item.valorUnitario,
        PrecoUnitario: item.valorUnitario,
        ValorTotal: item.valorTotal,
        CodigoCentroArmazenagem: centroArmazenagem,
        CentroArmazenagem: centroArmazenagem,
      };

      logger.info(`Adicionando item (Material CIGAM: ${item.idMaterialCigam}) ao pedido CIGAM #${codigoPedidoCigam}...`);
      logger.info('Payload do item CIGAM', payloadItem);
      const responseItem: any = await this.cigamHttpClient.post(
        baseUrl,
        ambiente,
        '/API/api/comercial/fa/Pedido/SalvarItemPedido',
        payloadItem
      );

      // CIGAM retorna HTTP 200 com { success: false, messages: [...] } em caso de erro no item
      if (responseItem && responseItem.success === false) {
        const erros = Array.isArray(responseItem.messages) ? responseItem.messages.join(' | ') : (responseItem.message || 'Erro ao adicionar item no CIGAM');
        throw new Error(`Falha ao adicionar item (Material: ${item.idMaterialCigam}) no pedido CIGAM #${codigoPedidoCigam}: ${erros}`);
      }

      await delay(200); // pequeno delay entre itens
    }

    // 8. Se todos os itens já estavam presentes e nenhum novo item precisou ser enviado, reaproveitamos os itens consultados
    const VERIFICACAO_MAX_TENTATIVAS = 5;
    const VERIFICACAO_INTERVALO_MS = 15000;

    let itensPedidoCigam: any[] = (itensParaEnviar.length === 0 && itensJaPresentesNoCigam.length > 0)
      ? itensJaPresentesNoCigam
      : [];
    let erroVerificacao: any = null;

    if (itensPedidoCigam.length === 0) {
      logger.info('Aguardando 10 segundos para processamento do CIGAM...');
      await delay(10000);

      for (let tentativa = 1; tentativa <= VERIFICACAO_MAX_TENTATIVAS; tentativa++) {
        logger.info(`Verificando existência do pedido CIGAM #${codigoPedidoCigam} via BuscarItensPedido (tentativa ${tentativa}/${VERIFICACAO_MAX_TENTATIVAS})...`);

        try {
          const resp: any = await this.cigamHttpClient.get(
            baseUrl,
            ambiente,
            '/API/api/comercial/fa/Pedido/BuscarItensPedido',
            { params: { codigoPedido: codigoPedidoCigam } }
          );
          itensPedidoCigam = Array.isArray(resp) ? resp : (resp?.data ?? []);
          erroVerificacao = null;

          if (itensPedidoCigam.length > 0) {
            break;
          }
        } catch (error: any) {
          erroVerificacao = error;
        }

        const ehUltimaTentativa = tentativa === VERIFICACAO_MAX_TENTATIVAS;
        if (ehUltimaTentativa) {
          logger.error(
            `Todas as ${VERIFICACAO_MAX_TENTATIVAS} tentativas de verificar o pedido CIGAM #${codigoPedidoCigam} via BuscarItensPedido falharam. ` +
            (erroVerificacao ? `Última falha: ${erroVerificacao.message}` : 'BuscarItensPedido retornou lista vazia em todas as tentativas.')
          );
        } else {
          logger.warn(
            `Tentativa ${tentativa}/${VERIFICACAO_MAX_TENTATIVAS}: pedido CIGAM #${codigoPedidoCigam} ainda não encontrado ` +
            (erroVerificacao ? `(erro: ${erroVerificacao.message})` : '(BuscarItensPedido retornou [])') +
            '. Tentando novamente...'
          );
          logger.info(`Aguardando ${VERIFICACAO_INTERVALO_MS / 1000}s antes da próxima tentativa...`);
          await delay(VERIFICACAO_INTERVALO_MS);
        }
      }
    }

    if (itensPedidoCigam.length === 0) {
      const detalhe = erroVerificacao
        ? `Erro na última tentativa: ${erroVerificacao.message}`
        : 'BuscarItensPedido retornou lista vazia em todas as tentativas.';
      throw new Error(`Pedido CIGAM #${codigoPedidoCigam} não encontrado após ${VERIFICACAO_MAX_TENTATIVAS} tentativas. ${detalhe}`);
    }

    // PATCH de frete/desconto continua no hub_pedido (API separada, com X-Api-Key).
    const urlPedidoCigam = `${baseUrl}/hub_pedido/api/pedidos/${codigoPedidoCigam}`;

    const httpsAgent =
      process.env.NODE_ENV !== "production"
        ? new https.Agent({ rejectUnauthorized: false })
        : undefined;

    const hubPedidoApiKey = process.env.CIGAM_HUB_PEDIDO_API_KEY;
    if (!hubPedidoApiKey) {
      throw new Error('CIGAM_HUB_PEDIDO_API_KEY não configurada no servidor.');
    }
    const headersCigam = { 'X-Api-Key': hubPedidoApiKey };

    const payloadPatchCigam = {
      valorDesconto: descontoValor,
      percentualDesconto: percentualDesconto,
      valorFrete: valorFrete,
      valorEncargos: outrasDespesas,
    };

    logger.success(`Pedido CIGAM #${codigoPedidoCigam} encontrado (${itensPedidoCigam.length} item(ns)). Atualizando frete, desconto e encargos...`);
    logger.info(`URL da requisição PATCH: ${urlPedidoCigam}`);
    logger.info(`X-Api-Key utilizada: ${hubPedidoApiKey.slice(0, 4)}...${hubPedidoApiKey.slice(-4)} (mascarada; ver observação abaixo)`);
    logger.info(`Payload PATCH (frete/desconto/encargos) do pedido CIGAM #${codigoPedidoCigam}: ${JSON.stringify(payloadPatchCigam)}`);
    try {
      await axios.patch(urlPedidoCigam, payloadPatchCigam, { httpsAgent, headers: headersCigam });
    } catch (error: any) {
      logger.error(
        `PATCH de valores (frete/desconto/encargos) falhou para o pedido CIGAM #${codigoPedidoCigam}: ` +
        `status=${error.response?.status ?? 'sem status'} ` +
        `corpo=${JSON.stringify(error.response?.data) ?? 'sem corpo'}`
      );
      throw error;
    }

    logger.success(`Pedido Bling #${pedidoBling.numero} integrado ao CIGAM com sucesso!`);
    return String(codigoPedidoCigam);
  }
}
