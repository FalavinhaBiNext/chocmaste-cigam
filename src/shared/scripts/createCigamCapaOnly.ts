import 'reflect-metadata';
import { container } from '../../shared/container';
import sequelize from '../../database/sequelize';
import { PedidoModel } from '../../modules/pedido/models/pedidoModel';
import { CigamHttpClient } from '../../modules/cigam/services/cigamHttpClient';
import { CigamClienteService } from '../../modules/cigam/services/cigamClienteService';
import { UsuarioCigamService } from '../../modules/usuarioCigam/services/usuarioCigamService';
import { DeParaFormasPagamentoRepository } from '../../modules/depara/repositories/deparaFormasPagamentoRepository';
import { DeParaTransportadorasRepository } from '../../modules/depara/repositories/deparaTransportadorasRepository';
import { DeParaProdutosRepository } from '../../modules/depara/repositories/deparaProdutosRepository';
import { BlingHttpClient } from '../../modules/bling/services/blingHttpClient';

async function run() {
  try {
    await sequelize.authenticate();
    console.log('[LOG] Conectado ao banco de dados.');

    const orderIdBling = '25957584103';
    console.log(`[LOG] Carregando dados do pedido Bling ${orderIdBling} do banco local...`);
    const pedidoLocal = await PedidoModel.findOne({ where: { id_bling: orderIdBling } });
    if (!pedidoLocal) {
      throw new Error(`Pedido com ID Bling ${orderIdBling} não encontrado no banco local.`);
    }

    // Resolvendo instâncias do container de DI
    const blingHttpClient = container.resolve(BlingHttpClient);
    const cigamHttpClient = container.resolve(CigamHttpClient);
    const cigamClienteService = container.resolve(CigamClienteService);
    const usuarioCigamService = container.resolve(UsuarioCigamService);
    const deParaFormasPagamentoRepo = container.resolve(DeParaFormasPagamentoRepository);
    const deParaTransportadorasRepo = container.resolve(DeParaTransportadorasRepository);
    const deParaProdutosRepo = container.resolve(DeParaProdutosRepository);

    console.log('[LOG] Buscando dados do pedido completo na API do Bling...');
    const pedidoBlingCompleto = await blingHttpClient.getPedido(Number(orderIdBling));
    const data: any = pedidoBlingCompleto.data;

    // 1. Resolução do Cliente
    console.log(`[LOG] Resolvendo De-Para para o cliente Bling ID: ${data.contato.id}...`);
    const idClienteCigam = await cigamClienteService.obterOuCriarCliente(String(data.contato.id));
    console.log(`[LOG] Cliente resolvido. Código CIGAM: ${idClienteCigam}`);

    // 2. Resolução da Transportadora (Forçado para '000039' para fins de teste)
    let idTransportadoraCigam = '000039';
    console.log(`[LOG] Transportadora (TESTE FORÇADO): Código CIGAM: ${idTransportadoraCigam}`);

    // 3. Resolução da Forma de Pagamento
    let idCondicaoPagamentoCigam = '';
    if (data.parcelas && data.parcelas.length > 0) {
      const primeiraParcela = data.parcelas[0];
      if (primeiraParcela.formaPagamento?.id) {
        const idFormaBling = String(primeiraParcela.formaPagamento.id);
        console.log(`[LOG] Resolvendo De-Para para forma de pagamento Bling ID: ${idFormaBling}...`);
        const mapForma = await deParaFormasPagamentoRepo.findByIdBling(idFormaBling);
        if (!mapForma) {
          console.warn(`[WARNING] Forma de pagamento (ID Bling: ${idFormaBling}) não possui mapeamento De-Para para o CIGAM.`);
        } else {
          idCondicaoPagamentoCigam = mapForma.id_cigam;
          console.log(`[LOG] Forma de pagamento resolvida. Código CIGAM: ${idCondicaoPagamentoCigam}`);
        }
      }
    }

    // 4. Obter ambiente e token do CIGAM
    const usuarios = await usuarioCigamService.findAll();
    const ativo = usuarios.find(u => u.ativo);
    const ambiente = ativo ? ativo.ambiente : 'homologacao';
    const usuarioCigam = await usuarioCigamService.findByEnv(ambiente);
    if (!usuarioCigam) {
      throw new Error(`Configurações do ambiente CIGAM "${ambiente}" não encontradas.`);
    }
    const baseUrl = usuarioCigam.url_ambiente;
    console.log(`[LOG] Usando ambiente CIGAM: ${ambiente} em ${baseUrl}`);

    // 5. Montar o payload da Capa do Pedido (Utilizando data atual para aparecer nos filtros de data do CIGAM)
    const payloadCapa: any = {
      CodigoCliente: idClienteCigam,
      DataPedido: '2026-07-15',
      CodigoCondicaoPagamento: idCondicaoPagamentoCigam,
      CodigoTransportadora: idTransportadoraCigam,
      OrigemPedido: 'Tray',
      Observacao: `Bling Pedido #${data.numero} - ${data.observacoes || ''}`,
      CopiarObservacoesCliente: true,
    };

    if (data.dataSaida || data.data) {
      let prazo = data.dataSaida || data.data;
      // Garantir que o prazo não seja menor que a data de emissão (DataPedido)
      if (new Date(prazo) < new Date('2026-07-15')) {
        prazo = '2026-07-15';
      }
      payloadCapa.PrazoEntrega = prazo;
      payloadCapa.PrazoProgramado = prazo;
    }

    console.log('[LOG] Payload da Capa preparado:', JSON.stringify(payloadCapa, null, 2));

    console.log('[LOG] Enviando capa do pedido para a API do CIGAM...');
    const responseCapa: any = await cigamHttpClient.post(
      baseUrl,
      ambiente,
      '/API/api/comercial/fa/Pedido/Salvar',
      payloadCapa
    );

    console.log('[LOG] RESPOSTA DA API DO CIGAM (Capa):');
    console.log(JSON.stringify(responseCapa, null, 2));

    const codigoPedidoCigam = responseCapa?.data?.codigoPedido || responseCapa?.Codigo || responseCapa?.codigo;
    if (!codigoPedidoCigam) {
      throw new Error('Não foi possível recuperar o código do pedido criado no CIGAM a partir da resposta.');
    }

    // 6. Resolução dos Itens (Produtos) e envio para o CIGAM
    console.log('[LOG] Iniciando envio dos itens do pedido...');
    for (const item of data.itens) {
      const idProdutoBling = String(item.id);
      console.log(`[LOG] Resolvendo De-Para para o produto Bling ID: ${idProdutoBling} ("${item.descricao}")...`);
      const mapProduto = await deParaProdutosRepo.findByIdBling(idProdutoBling);
      if (!mapProduto) {
        throw new Error(`Produto "${item.descricao}" (ID Bling: ${idProdutoBling}) não possui mapeamento De-Para para o CIGAM.`);
      }

      const payloadItem = {
        CodigoPedido: codigoPedidoCigam,
        CodigoMaterial: mapProduto.id_cigam,
        Quantidade: item.quantidade,
        ValorUnitario: item.valor,
        PrecoUnitario: item.valor,
        ValorTotal: item.valorTotal || (item.valor * item.quantidade)
      };

      console.log(`[LOG] Enviando item (Material CIGAM: ${mapProduto.id_cigam}) do Pedido CIGAM #${codigoPedidoCigam}...`);
      console.log('[LOG] Payload do Item preparado:', JSON.stringify(payloadItem, null, 2));

      const responseItem = await cigamHttpClient.post(
        baseUrl,
        ambiente,
        '/API/api/comercial/fa/Pedido/SalvarItemPedido',
        payloadItem
      );

      console.log(`[LOG] Resposta do Item CIGAM:`, JSON.stringify(responseItem, null, 2));
    }

    console.log('[LOG] Integração completa de Capa e Itens concluída com sucesso!');

  } catch (error: any) {
    console.error('[ERROR] Falha na integração completa do pedido no CIGAM:', error.message || error);
    if (error.response?.data) {
      console.error('[ERROR DETAILS]', JSON.stringify(error.response.data, null, 2));
    }
  } finally {
    await sequelize.close();
  }
}

run();
