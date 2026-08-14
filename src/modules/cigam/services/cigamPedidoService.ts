import { inject, injectable } from 'tsyringe';
import axios from 'axios';
import https from 'https';
import { CigamHttpClient } from './cigamHttpClient';
import { CigamClienteService } from './cigamClienteService';
import { CigamTransportadoraService } from './cigamTransportadoraService';
import { UsuarioCigamService } from '@/modules/usuarioCigam/services/usuarioCigamService';
import { DeParaFormasPagamentoRepository } from '@/modules/depara/repositories/deparaFormasPagamentoRepository';
import { DeParaProdutosRepository } from '@/modules/depara/repositories/deparaProdutosRepository';
import { logger } from '@/shared/utils/logger';
import { delay } from '@/shared/utils/delay';

@injectable()
export class CigamPedidoService {
  constructor(
    @inject(CigamHttpClient) private readonly cigamHttpClient: CigamHttpClient,
    @inject(CigamClienteService) private readonly cigamClienteService: CigamClienteService,
    @inject(CigamTransportadoraService) private readonly cigamTransportadoraService: CigamTransportadoraService,
    @inject(UsuarioCigamService) private readonly usuarioCigamService: UsuarioCigamService,
    @inject(DeParaFormasPagamentoRepository) private readonly deParaFormasPagamentoRepo: DeParaFormasPagamentoRepository,
    @inject(DeParaProdutosRepository) private readonly deParaProdutosRepo: DeParaProdutosRepository,
  ) {}

  private async getActiveEnv(): Promise<string> {
    const usuarios = await this.usuarioCigamService.findAll();
    const ativo = usuarios.find(u => u.ativo);
    if (!ativo) {
      return 'homologacao';
    }
    return ativo.ambiente;
  }

  async enviarPedido(pedidoBling: any, unidadeNegocio?: string): Promise<string> {
    logger.info(`Iniciando integração do pedido Bling #${pedidoBling.numero} para o CIGAM...`);

    // 1. Resolução do Cliente (obter ou criar dinamicamente)
    const idClienteBling = String(pedidoBling.contato.id);
    const idClienteCigam = (await this.cigamClienteService.obterOuCriarCliente(idClienteBling, unidadeNegocio)).trim();

    // 2. Resolução da Transportadora (obter ou criar dinamicamente)
    let idTransportadoraCigam = '';
    const idTranspBling = pedidoBling.transporte?.contato?.id || pedidoBling.transportador?.id;
    if (idTranspBling && idTranspBling !== 0) {
      idTransportadoraCigam = (await this.cigamTransportadoraService.obterOuCriarTransportadora(String(idTranspBling))).trim();
    } else {
      logger.info('Pedido sem transportadora válida (ID 0 ou ausente). Enviando ao CIGAM sem transportadora.');
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

    // 6. Montar o payload da Capa do Pedido
    let prazo = pedidoBling.dataSaida || pedidoBling.data;
    try {
      if (new Date(prazo) < new Date(pedidoBling.data)) {
        prazo = pedidoBling.data;
      }
    } catch {
      prazo = pedidoBling.data;
    }

    const valorFrete = pedidoBling.transporte?.frete ?? 0;
    const descontoValor = typeof pedidoBling.desconto === 'object' && pedidoBling.desconto !== null
      ? (pedidoBling.desconto.valor ?? 0)
      : (Number(pedidoBling.desconto) || 0);

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

    const payloadCapa = {
      CodigoCliente: idClienteCigam,
      DataPedido: pedidoBling.data,
      CodigoCondicaoPagamento: idCondicaoPagamentoCigam,
      CodigoTransportadora: idTransportadoraCigam,
      Observacao: partesObservacao.join(' - ').toUpperCase(),
      CopiarObservacoesCliente: true,
      PrazoEntrega: prazo,
      PrazoProgramado: pedidoBling.dataPrevisao || prazo,
      OrigemPedido: 'Bling Integration',
      UnidadeNegocio: unidadeNegocio || ''
    };

    logger.info(`Enviando capa do pedido #${pedidoBling.numero} para o CIGAM...`);
    const responseCapa: any = await this.cigamHttpClient.post(
      baseUrl,
      ambiente,
      '/API/api/comercial/fa/Pedido/Salvar',
      payloadCapa
    );

    // O CIGAM costuma retornar o código do pedido criado na propriedade 'data.codigoPedido'
    let codigoPedidoCigam = responseCapa?.data?.codigoPedido || responseCapa?.Codigo || responseCapa?.codigo || responseCapa?.id || String(pedidoBling.numero);
    logger.success(`Capa do pedido criada no CIGAM com sucesso. Código do pedido no CIGAM: ${codigoPedidoCigam}`);

    // 7. Enviar os itens do pedido
    for (const item of itensMapeados) {
      const payloadItem = {
        CodigoPedido: codigoPedidoCigam,
        CodigoMaterial: item.idMaterialCigam,
        Quantidade: item.quantidade,
        ValorUnitario: item.valorUnitario,
        PrecoUnitario: item.valorUnitario,
        ValorTotal: item.valorTotal
      };

      logger.info(`Adicionando item (Material CIGAM: ${item.idMaterialCigam}) ao pedido CIGAM #${codigoPedidoCigam}...`);
      logger.info('Payload do item CIGAM', payloadItem);
      await this.cigamHttpClient.post(
        baseUrl,
        ambiente,
        '/API/api/comercial/fa/Pedido/SalvarItemPedido',
        payloadItem
      );
      await delay(200); // pequeno delay entre itens
    }

    // 8. Aguardar processamento do CIGAM antes de verificar/atualizar
    logger.info('Aguardando 10 segundos para processamento do CIGAM...');
    await delay(10000);

    // 9. Verificar existência do pedido e atualizar frete/desconto (sem autenticação)
    const urlPedidoCigam = `${baseUrl}/hub_pedido/api/pedidos/${codigoPedidoCigam}`;

    const httpsAgent =
      process.env.NODE_ENV !== "production"
        ? new https.Agent({ rejectUnauthorized: false })
        : undefined;

    logger.info(`Verificando existência do pedido CIGAM #${codigoPedidoCigam}...`);
    logger.info(`URL da requisição GET: ${urlPedidoCigam}`);
    const pedidoCigam = await axios.get(urlPedidoCigam, { httpsAgent }).then(r => r.data).catch(() => null);

    if (!pedidoCigam) {
      throw new Error(`Pedido CIGAM #${codigoPedidoCigam} não encontrado após criação.`);
    }

    logger.success(`Pedido CIGAM #${codigoPedidoCigam} encontrado. Atualizando frete e desconto...`);
    logger.info(`URL da requisição PATCH: ${urlPedidoCigam}`);
    await axios.patch(urlPedidoCigam, {
      valorDesconto: descontoValor,
      valorFrete: valorFrete,
    }, { httpsAgent });

    logger.success(`Pedido Bling #${pedidoBling.numero} integrado ao CIGAM com sucesso!`);
    return codigoPedidoCigam;
  }
}
