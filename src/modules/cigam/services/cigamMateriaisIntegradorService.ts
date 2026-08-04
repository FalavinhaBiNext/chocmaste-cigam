import { inject, injectable } from 'tsyringe';
import { CigamIntegradorHttpClient } from './cigamIntegradorHttpClient';
import { UsuarioCigamService } from '@/modules/usuarioCigam/services/usuarioCigamService';
import { ProdutoRepository } from '@/modules/produto/repositories/produtoRepository';
import { DeParaProdutosRepository } from '@/modules/depara/repositories/deparaProdutosRepository';
import {
  CigamIntegradorMaterialPayload,
  CigamIntegradorResponse,
  CigamIntegradorMaterialListItem,
} from './types';
import {
  CadastrarMaterialIntegradorInput,
  CadastrarEMapearInput,
  SincronizacaoResult,
} from '../dto';
import { logger } from '@/shared/utils/logger';

@injectable()
export class CigamMateriaisIntegradorService {
  constructor(
    @inject(CigamIntegradorHttpClient) private readonly integradorClient: CigamIntegradorHttpClient,
    @inject(UsuarioCigamService) private readonly usuarioCigamService: UsuarioCigamService,
    @inject(ProdutoRepository) private readonly produtoRepository: ProdutoRepository,
    @inject(DeParaProdutosRepository) private readonly deParaProdutosRepository: DeParaProdutosRepository,
  ) {}

  private async getActiveEnv(): Promise<string> {
    const usuarios = await this.usuarioCigamService.findAll();
    const ativo = usuarios.find(u => u.ativo);
    if (!ativo) {
      logger.warn('Nenhum usuário CIGAM ativo encontrado. Usando "homologacao" como padrão.');
      return 'homologacao';
    }
    return ativo.ambiente;
  }

  async cadastrarMaterial(input: CadastrarMaterialIntegradorInput): Promise<CigamIntegradorResponse> {
    const ambiente = await this.getActiveEnv();

    const payload: CigamIntegradorMaterialPayload = {
      pin: '', // injetado pelo client
      statusRegistro: 'L',
      codigoGrupo: input.codigoGrupo,
      codigoSubGrupo: input.codigoSubGrupo,
      codigoMaterial: input.codigoMaterial,
      descricao: input.descricao,
      tipo: input.tipo,
      codigoUnidadeMedida: input.codigoUnidadeMedida,
      utilizaGrade: input.utilizaGrade,
      grade: input.grade,
    };

    logger.info(`Cadastrando material "${input.codigoMaterial}" no Integrador CIGAM...`);
    const response = await this.integradorClient.post<CigamIntegradorResponse>(
      '/Cadastrar',
      payload,
      ambiente,
    );

    if (!response.sucesso) {
      throw new Error(`Falha ao cadastrar material no CIGAM: ${response.mensagem || 'Erro desconhecido'}`);
    }

    logger.success(`Material "${input.codigoMaterial}" cadastrado no Integrador CIGAM`);
    return response;
  }

  async listarMateriais(): Promise<CigamIntegradorMaterialListItem[]> {
    const ambiente = await this.getActiveEnv();

    logger.info('Listando materiais do Integrador CIGAM...');
    const response = await this.integradorClient.get<CigamIntegradorMaterialListItem[]>(
      '/Listar',
      { params: { statusRegistro: 'L' } },
    );

    logger.success(`${response.length} material(is) encontrado(s) no Integrador CIGAM`);
    return response;
  }

  async sincronizarComLocal(): Promise<SincronizacaoResult> {
    const result: SincronizacaoResult = {
      materiaisEncontrados: 0,
      criadosLocais: 0,
      mapeamentosCriados: 0,
      erros: [],
    };

    const materiaisRemotos = await this.listarMateriais();
    result.materiaisEncontrados = materiaisRemotos.length;

    const deParaExistente = await this.deParaProdutosRepository.findAll();
    const mapeadosPorCigam = new Set(deParaExistente.map(d => d.id_cigam));

    for (const material of materiaisRemotos) {
      try {
        if (mapeadosPorCigam.has(material.Codigo)) {
          continue;
        }

        const produtoLocal = await this.produtoRepository.create({
          nome: material.Descricao,
          preco: 0,
          temVariacoes: false,
          quantidade_estoque: 0,
          ativo: true,
        });

        await this.deParaProdutosRepository.create({
          id_bling: produtoLocal.id,
          id_cigam: material.Codigo,
          nome: material.Descricao,
        });

        result.criadosLocais++;
        result.mapeamentosCriados++;
      } catch (error: any) {
        result.erros.push(`Material ${material.Codigo}: ${error.message}`);
      }
    }

    logger.success(
      `Sincronização CIGAM Integrador: ${result.criadosLocais} criados, ${result.erros.length} erros`,
    );
    return result;
  }

  async cadastrarEmapear(input: CadastrarEMapearInput): Promise<void> {
    await this.cadastrarMaterial(input);

    if (input.idProdutoLocal) {
      const existingMapping = await this.deParaProdutosRepository.findByIdBling(input.idProdutoLocal);
      if (!existingMapping) {
        await this.deParaProdutosRepository.create({
          id_bling: input.idProdutoLocal,
          id_cigam: input.codigoMaterial,
          nome: input.nomeProduto,
        });
        logger.success(`Mapeamento De-Para criado: Bling ${input.idProdutoLocal} -> CIGAM ${input.codigoMaterial}`);
      }
    }
  }
}
