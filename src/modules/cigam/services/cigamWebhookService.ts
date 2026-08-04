import { inject, injectable } from 'tsyringe';
import { BlingHttpClient } from '../../bling/services/blingHttpClient';
import { ProdutoService } from '../../produto/services/produtoService';
import { DeParaProdutosRepository } from '../../depara/repositories/deparaProdutosRepository';
import { CigamProdutoWebhookInput } from '../cigamWebhook.validator';
import { logger } from '@/shared/utils/logger';

@injectable()
export class CigamWebhookService {
  constructor(
    @inject(BlingHttpClient) private readonly blingHttpClient: BlingHttpClient,
    @inject(ProdutoService) private readonly produtoService: ProdutoService,
    @inject(DeParaProdutosRepository) private readonly deParaProdutosRepo: DeParaProdutosRepository,
  ) {}

  async processarProdutoCriado(input: CigamProdutoWebhookInput) {
    logger.info(`[CIGAM WEBHOOK] Iniciando sincronização reversa de produto CIGAM ID: ${input.codigoMaterial}`);

    // 1. Verificar se já existe mapeamento De-Para para este material
    const mapping = await this.deParaProdutosRepo.findByIdCigam(input.codigoMaterial);
    if (mapping) {
      logger.info(`[CIGAM WEBHOOK] Produto já mapeado no De-Para local: CIGAM ${input.codigoMaterial} -> Bling ${mapping.id_bling}. Iniciando fluxo de atualização.`);

      const idBling = mapping.id_bling;
      const blingPayload = {
        nome: input.descricao.toUpperCase(),
        unidade: input.unidadeMedida ? input.unidadeMedida.toUpperCase() : 'UN',
        pesoBruto: input.peso,
        pesoLiquido: input.peso
        // PRECO OMITIDO para proteger a diversificação de preços na Bling
      };

      logger.info(`[CIGAM WEBHOOK] Atualizando produto na Bling com ID: ${idBling}...`, { payload: blingPayload });
      try {
        await this.blingHttpClient.put(`/produtos/${idBling}`, blingPayload);
        logger.success(`[CIGAM WEBHOOK] Produto atualizado na Bling com sucesso: ${idBling}`);
      } catch (blingError: any) {
        logger.error(`[CIGAM WEBHOOK] Erro ao atualizar produto na Bling: ${blingError.message}`);
        throw new Error(`Falha na atualização da Bling: ${blingError.message}`);
      }

      // Atualizar no banco local
      logger.info('[CIGAM WEBHOOK] Atualizando produto no banco local...');
      try {
        const produtoLocal = await this.produtoService.findByIdBling(idBling);
        if (produtoLocal) {
          await this.produtoService.update(produtoLocal.id, {
            nome: input.descricao.toUpperCase()
          });
        }
      } catch (dbError: any) {
        logger.warn(`[CIGAM WEBHOOK] Produto com ID Bling ${idBling} não encontrado no banco local para atualização.`);
      }

      return {
        mapped: true,
        id_bling: idBling,
        id_cigam: input.codigoMaterial,
        message: 'Produto atualizado com sucesso no fluxo reverso.'
      };
    }

    // 2. Montar payload do produto para enviar ao Bling
    const blingPayload = {
      nome: input.descricao.toUpperCase(),
      codigo: input.codigoMaterial,
      preco: 0.00,
      tipo: 'P',
      formato: 'S',
      unidade: input.unidadeMedida ? input.unidadeMedida.toUpperCase() : 'UN',
      pesoBruto: input.peso,
      pesoLiquido: input.peso
    };

    logger.info('[CIGAM WEBHOOK] Cadastrando produto na API da Bling...', { payload: blingPayload });
    
    let idBling = '';
    try {
      const response: any = await this.blingHttpClient.post('/produtos', blingPayload);
      idBling = String(response?.data?.id || '');
      if (!idBling) {
        throw new Error('Retorno da API Bling não contém o ID do produto cadastrado.');
      }
      logger.success(`[CIGAM WEBHOOK] Produto cadastrado na Bling com ID: ${idBling}`);
    } catch (blingError: any) {
      logger.error(`[CIGAM WEBHOOK] Erro ao cadastrar produto na Bling: ${blingError.message}`);
      throw new Error(`Falha no cadastro da Bling: ${blingError.message}`);
    }

    // 3. Salvar produto no banco de dados local
    logger.info('[CIGAM WEBHOOK] Gravando produto no banco local...');
    let produtoLocal;
    try {
      produtoLocal = await this.produtoService.findByIdBling(idBling);
    } catch {
      produtoLocal = await this.produtoService.create({
        id_bling: idBling,
        id_produto: input.codigoMaterial,
        nome: input.descricao.toUpperCase(),
        preco: 0.00,
        temVariacoes: false,
        quantidade_estoque: 0,
        ativo: true
      });
    }

    // 4. Salvar relacionamento De-Para
    logger.info('[CIGAM WEBHOOK] Gravando De-Para do produto...');
    const dePara = await this.deParaProdutosRepo.create({
      id_bling: idBling,
      id_cigam: input.codigoMaterial,
      nome: input.descricao.toUpperCase()
    });

    logger.success(`[CIGAM WEBHOOK] Fluxo reverso concluído com sucesso. Código CIGAM: ${input.codigoMaterial} -> Código Bling: ${idBling}`);

    return {
      mapped: false,
      id_bling: idBling,
      id_cigam: input.codigoMaterial,
      produto_local_id: produtoLocal.id,
      depara_id: dePara.id,
      message: 'Produto cadastrado e mapeado com sucesso no fluxo reverso.'
    };
  }
}
