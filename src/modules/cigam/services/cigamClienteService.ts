import { inject, injectable } from 'tsyringe';
import { CigamHttpClient } from './cigamHttpClient';
import { UsuarioCigamService } from '@/modules/usuarioCigam/services/usuarioCigamService';
import { ClientesCigamService } from '@/modules/clientesCigam/services/clientesCigamService';
import { DeParaClientesRepository } from '@/modules/depara/repositories/deparaClientesRepository';
import { ClientesService } from '@/modules/clientes/services/clientesService';
import { CigamPessoaResponse } from './types';
import { logger } from '@/shared/utils/logger';
import { delay } from '@/shared/utils/delay';

@injectable()
export class CigamClienteService {
  constructor(
    @inject(CigamHttpClient) private readonly cigamHttpClient: CigamHttpClient,
    @inject(UsuarioCigamService) private readonly usuarioCigamService: UsuarioCigamService,
    @inject(ClientesCigamService) private readonly clientesCigamService: ClientesCigamService,
    @inject(DeParaClientesRepository) private readonly deParaClientesRepo: DeParaClientesRepository,
    @inject(ClientesService) private readonly clientesService: ClientesService,
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

  async obterOuCriarCliente(idClienteBling: string, unidadeNegocio?: string): Promise<string> {
    logger.info(`Iniciando resolução de cliente Bling ID: ${idClienteBling}`);

    // 1. Verificar se já existe o De-Para local
    const mapping = await this.deParaClientesRepo.findByIdBling(idClienteBling);
    if (mapping) {
      logger.success(`Mapeamento De-Para encontrado: ${idClienteBling} -> ${mapping.id_cigam}`);
      return mapping.id_cigam;
    }

    // Obter dados do cliente local do Bling
    const clienteBling = await this.clientesService.findByIdBling(idClienteBling);
    if (!clienteBling) {
      throw new Error(`Cliente Bling com ID ${idClienteBling} não encontrado no banco local.`);
    }

    const docClean = clienteBling.documento ? clienteBling.documento.replace(/\D/g, '') : '';
    if (!docClean) {
      throw new Error(`Cliente Bling ${clienteBling.nome} não possui documento (CPF/CNPJ) válido.`);
    }

    const ambiente = await this.getActiveEnv();
    const usuarioCigam = await this.usuarioCigamService.findByEnv(ambiente);
    if (!usuarioCigam) {
      throw new Error(`Configurações do ambiente CIGAM "${ambiente}" não encontradas.`);
    }
    const baseUrl = usuarioCigam.url_ambiente;

    // 2. Buscar cliente no CIGAM pelo documento
    logger.info(`Buscando cliente por documento no CIGAM: ${docClean}`);
    let idCigam: string | null = null;
    try {
      const results = await this.cigamHttpClient.get<CigamPessoaResponse[]>(
        baseUrl,
        ambiente,
        '/API/api/genericos/ge/Pessoa/Buscar',
        { params: { cnpjCpf: docClean } }
      );

      if (results && results.length > 0) {
        const matched = results.find(r => r.CnpjCpf?.replace(/\D/g, '') === docClean);
        if (matched) {
          idCigam = matched.Codigo;
          logger.success(`Cliente localizado no CIGAM com Código: ${idCigam}`);
        }
      }
    } catch (error: any) {
      logger.warn(`Erro ao buscar cliente por documento no CIGAM: ${error.message}`);
    }

    // 3. Se não existir no CIGAM, cadastrá-lo
    if (!idCigam) {
      logger.info(`Cliente não encontrado no CIGAM. Cadastrando cliente: ${clienteBling.nome}`);

      const cidadeNormalizada = clienteBling.cidade
        ? clienteBling.cidade.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase()
        : '';

      const payload = {
        NomeCompleto: (clienteBling.nome || '').toUpperCase(),
        CnpjCpf: docClean,
        PessoaFisica: clienteBling.tipo ? clienteBling.tipo === 'F' : docClean.length === 11,
        Divisao: '10', // Código padrão CIGAM para Clientes
        Endereco: (clienteBling.endereco || '').toUpperCase(),
        Numero: (clienteBling.numero || '').toUpperCase(),
        Bairro: (clienteBling.bairro || '').toUpperCase(),
        Municipio: cidadeNormalizada, // cidadeNormalizada is already toUpperCase() above
        Uf: (clienteBling.uf || '').toUpperCase(),
        Telefone: clienteBling.telefone || clienteBling.celular || '',
        Email: (clienteBling.email || '').toUpperCase(),
        Cep: clienteBling.cep ? clienteBling.cep.replace(/\D/g, '') : '',
        Inscricao: clienteBling.ie || '',
        Inscrito: !!clienteBling.ie,
        UnidadeNegocio: unidadeNegocio || '',
        Ativo: true,
        CodigoPais: '031'
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
            const matched = retryResults.find(r => r.CnpjCpf?.replace(/\D/g, '') === docClean);
            if (matched) {
              idCigam = matched.Codigo;
            }
          }
        }
      } catch (postError: any) {
        throw new Error(`Falha ao cadastrar cliente no CIGAM: ${postError.message}`);
      }

      if (!idCigam) {
        throw new Error(`Cliente enviado para cadastro no CIGAM, mas não foi possível recuperar o Código gerado.`);
      }

      logger.success(`Cliente cadastrado no CIGAM com sucesso. Código gerado: ${idCigam}`);
    }

    // 4. Salvar localmente em clientes_cigam se necessário
    try {
      await this.clientesCigamService.findByIdCigam(idCigam);
    } catch {
      await this.clientesCigamService.create({
        id_cigam: idCigam,
        nome: clienteBling.nome,
        documento: docClean,
        tipo_pessoa: docClean.length === 14 ? 'J' : 'F',
        telefone: clienteBling.telefone || clienteBling.celular || undefined,
        celular: clienteBling.celular || undefined,
        email: clienteBling.email || undefined,
        endereco: clienteBling.endereco || undefined,
        numero: clienteBling.numero || undefined,
        complemento: clienteBling.complemento || undefined,
        bairro: clienteBling.bairro || undefined,
        cidade: clienteBling.cidade || undefined,
        uf: clienteBling.uf || undefined,
        cep: clienteBling.cep ? clienteBling.cep.replace(/\D/g, '') : undefined,
        ativo: true
      });
    }

    // 5. Criar o mapeamento De-Para local
    await this.deParaClientesRepo.create({
      id_bling: idClienteBling,
      id_cigam: idCigam,
      nome: clienteBling.nome
    });

    logger.success(`Mapeamento De-Para de cliente criado com sucesso para o ID Bling: ${idClienteBling}`);
    return idCigam;
  }
}
