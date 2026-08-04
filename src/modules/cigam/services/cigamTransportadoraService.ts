import { inject, injectable } from 'tsyringe';
import { CigamHttpClient } from './cigamHttpClient';
import { UsuarioCigamService } from '@/modules/usuarioCigam/services/usuarioCigamService';
import { TransportadorasCigamService } from '@/modules/transportadorasCigam/services/transportadorasCigamService';
import { DeParaTransportadorasRepository } from '@/modules/depara/repositories/deparaTransportadorasRepository';
import { TransportadoraService } from '@/modules/transportadora/services/transportadoraService';
import { CigamPessoaResponse } from './types';
import { logger } from '@/shared/utils/logger';
import { delay } from '@/shared/utils/delay';
import { ContatosService } from '@/modules/bling/services/contatosService';

@injectable()
export class CigamTransportadoraService {
  constructor(
    @inject(CigamHttpClient) private readonly cigamHttpClient: CigamHttpClient,
    @inject(UsuarioCigamService) private readonly usuarioCigamService: UsuarioCigamService,
    @inject(TransportadorasCigamService) private readonly transportadorasCigamService: TransportadorasCigamService,
    @inject(DeParaTransportadorasRepository) private readonly deParaTransportadorasRepo: DeParaTransportadorasRepository,
    @inject(TransportadoraService) private readonly transportadoraService: TransportadoraService,
    @inject(ContatosService) private readonly contatosService: ContatosService,
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

  async obterOuCriarTransportadora(idTransportadoraBling: string): Promise<string> {
    logger.info(`Iniciando resolução de transportadora Bling ID: ${idTransportadoraBling}`);

    // 1. Verificar se já existe o De-Para local
    const mapping = await this.deParaTransportadorasRepo.findByIdBling(idTransportadoraBling);
    if (mapping) {
      logger.success(`Mapeamento De-Para encontrado: ${idTransportadoraBling} -> ${mapping.id_cigam}`);
      return mapping.id_cigam;
    }

    // Obter dados da transportadora local do Bling
    const transportadoraBling = await this.transportadoraService.findByIdBling(idTransportadoraBling);
    if (!transportadoraBling) {
      throw new Error(`Transportadora Bling com ID ${idTransportadoraBling} não encontrada no banco local.`);
    }

    let transportadoraDetalhada: Awaited<ReturnType<ContatosService['getById']>> | null = null;
    const docClean = (transportadoraBling.documento || '').replace(/\D/g, '');
    if (!docClean) {
      throw new Error(`Transportadora Bling ${transportadoraBling.nome} não possui documento (CPF/CNPJ) válido.`);
    }

    const ambiente = await this.getActiveEnv();
    const usuarioCigam = await this.usuarioCigamService.findByEnv(ambiente);
    if (!usuarioCigam) {
      throw new Error(`Configurações do ambiente CIGAM "${ambiente}" não encontradas.`);
    }
    const baseUrl = usuarioCigam.url_ambiente;

    // 2. Buscar transportadora no CIGAM pelo documento
    logger.info(`Buscando transportadora por documento no CIGAM: ${docClean}`);
    let idCigam: string | null = null;
    try {
      const results = await this.cigamHttpClient.get<CigamPessoaResponse[]>(
        baseUrl,
        ambiente,
        '/API/api/genericos/ge/Pessoa/Buscar',
        { params: { cnpjCpf: docClean } }
      );

      if (results && results.length > 0) {
        // Transportadora tem divisão '70' no CIGAM
        const matched = results.find(
          r => r.CnpjCpf?.replace(/\D/g, '') === docClean && r.Divisao === '70'
        );
        if (matched) {
          idCigam = matched.Codigo;
          logger.success(`Transportadora localizada no CIGAM com Código: ${idCigam}`);
        }
      }
    } catch (error: any) {
      logger.warn(`Erro ao buscar transportadora por documento no CIGAM: ${error.message}`);
    }

    // 3. Se não existir no CIGAM, cadastrá-la
    if (!idCigam) {
      logger.info(`Transportadora não encontrada no CIGAM. Cadastrando transportadora: ${transportadoraBling.nome}`);

      try {
        transportadoraDetalhada = await this.contatosService.getById(idTransportadoraBling);
      } catch (error: any) {
        throw new Error(
          `Não foi possível consultar os dados completos da transportadora ${transportadoraBling.nome} na Bling: ${error.message}`,
        );
      }

      const endereco = transportadoraDetalhada.endereco?.geral;
      const municipio = endereco?.municipio
        ? endereco.municipio.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toUpperCase()
        : '';
      const uf = (endereco?.uf || '').trim().toUpperCase();

      if (!municipio || !uf) {
        throw new Error(
          `A transportadora ${transportadoraDetalhada.nome || transportadoraBling.nome} não possui município e UF no endereço geral da Bling.`,
        );
      }

      const payload = {
        NomeCompleto: (transportadoraDetalhada.nome || transportadoraBling.nome || '').trim().toUpperCase(),
        Fantasia: (transportadoraDetalhada.fantasia || transportadoraBling.fantasia || '').trim().toUpperCase(),
        CnpjCpf: docClean,
        PessoaFisica: transportadoraDetalhada.tipo === 'F' || docClean.length === 11,
        Divisao: '70', // Código padrão CIGAM para Transportadoras
        Endereco: (endereco?.endereco || '').trim().toUpperCase(),
        Numero: (endereco?.numero || '').trim().toUpperCase(),
        Complemento: (endereco?.complemento || '').trim().toUpperCase(),
        Bairro: (endereco?.bairro || '').trim().toUpperCase(),
        Municipio: municipio,
        Uf: uf,
        Telefone: transportadoraDetalhada.telefone || transportadoraDetalhada.celular || '',
        Email: (transportadoraDetalhada.email || '').trim().toUpperCase(),
        Cep: (endereco?.cep || '').replace(/\D/g, ''),
        Ativo: transportadoraDetalhada.situacao === 'A' || transportadoraDetalhada.situacao === 'Ativo',
      };

      try {
        const response: any = await this.cigamHttpClient.post(
          baseUrl,
          ambiente,
          '/API/api/genericos/ge/Pessoa/Salvar',
          payload
        );

        if (response && response.Codigo) {
          idCigam = String(response.Codigo);
        } else {
          // POST assíncrono: aguardar um momento e tentar buscar por documento novamente
          logger.info('Aguardando 2 segundos para processamento assíncrono do CIGAM...');
          await delay(2000);

          const retryResults = await this.cigamHttpClient.get<CigamPessoaResponse[]>(
            baseUrl,
            ambiente,
            '/API/api/genericos/ge/Pessoa/Buscar',
            { params: { cnpjCpf: docClean } }
          );

          if (retryResults && retryResults.length > 0) {
            const matched = retryResults.find(
              r => r.CnpjCpf?.replace(/\D/g, '') === docClean && r.Divisao === '70'
            );
            if (matched) {
              idCigam = matched.Codigo;
            }
          }
        }
      } catch (postError: any) {
        throw new Error(`Falha ao cadastrar transportadora no CIGAM: ${postError.message}`);
      }

      if (!idCigam) {
        throw new Error(`Transportadora enviada para cadastro no CIGAM, mas não foi possível recuperar o Código gerado.`);
      }

      logger.success(`Transportadora cadastrada no CIGAM com sucesso. Código gerado: ${idCigam}`);
    }

    // 4. Salvar localmente em transportadoras_cigam se necessário
    try {
      await this.transportadorasCigamService.findByIdCigam(idCigam);
    } catch {
      await this.transportadorasCigamService.create({
        id_cigam: idCigam,
        nome: transportadoraDetalhada?.nome || transportadoraBling.nome,
        fantasia: transportadoraDetalhada?.fantasia || transportadoraBling.fantasia || undefined,
        documento: docClean,
        codigo_divisao: '70',
        ativo: true
      });
    }

    // 5. Criar o mapeamento De-Para local
    await this.deParaTransportadorasRepo.create({
      id_bling: idTransportadoraBling,
      id_cigam: idCigam,
      nome: transportadoraBling.nome
    });

    logger.success(`Mapeamento De-Para de transportadora criado com sucesso para o ID Bling: ${idTransportadoraBling}`);
    return idCigam;
  }
}
