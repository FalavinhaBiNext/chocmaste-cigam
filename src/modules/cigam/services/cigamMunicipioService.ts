import { inject, injectable } from 'tsyringe';
import axios from 'axios';
import { CigamHttpClient } from './cigamHttpClient';
import { UsuarioCigamService } from '@/modules/usuarioCigam/services/usuarioCigamService';
import { CigamMunicipioItem } from './types';
import { logger } from '@/shared/utils/logger';

@injectable()
export class CigamMunicipioService {
  private cachedMunicipios: CigamMunicipioItem[] | null = null;
  private lastFetchTime = 0;
  private readonly CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 horas

  constructor(
    @inject(CigamHttpClient) private readonly cigamHttpClient: CigamHttpClient,
    @inject(UsuarioCigamService) private readonly usuarioCigamService: UsuarioCigamService,
  ) {}

  private async getActiveEnv(): Promise<{ ambiente: string; baseUrl: string } | null> {
    const usuarios = await this.usuarioCigamService.findAll();
    const ativo = usuarios.find(u => u.ativo);
    const ambiente = ativo ? ativo.ambiente : 'homologacao';
    const usuarioCigam = await this.usuarioCigamService.findByEnv(ambiente);
    if (!usuarioCigam) {
      logger.warn(`Configurações do ambiente CIGAM "${ambiente}" não encontradas para consulta de municípios.`);
      return null;
    }
    return { ambiente, baseUrl: usuarioCigam.url_ambiente };
  }

  async obterMunicipios(): Promise<CigamMunicipioItem[]> {
    const now = Date.now();
    if (this.cachedMunicipios && now - this.lastFetchTime < this.CACHE_TTL_MS) {
      return this.cachedMunicipios;
    }

    try {
      const envData = await this.getActiveEnv();
      if (!envData) {
        return this.cachedMunicipios || [];
      }

      logger.info('Carregando tabela de municípios do CIGAM para cache...');
      const results = await this.cigamHttpClient.get<CigamMunicipioItem[]>(
        envData.baseUrl,
        envData.ambiente,
        '/API/api/genericos/ge/Municipio/Buscar'
      );

      if (Array.isArray(results) && results.length > 0) {
        this.cachedMunicipios = results;
        this.lastFetchTime = now;
        logger.success(`Tabela de municípios CIGAM carregada com sucesso (${results.length} municípios).`);
        return this.cachedMunicipios;
      }
    } catch (error: any) {
      logger.warn(`Falha ao obter lista de municípios do CIGAM: ${error.message}`);
    }

    return this.cachedMunicipios || [];
  }

  private cleanString(str: string): string {
    return (str || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .toUpperCase();
  }

  private alphanumeric(str: string): string {
    return this.cleanString(str).replace(/[^A-Z0-9]/g, '');
  }

  private gjNormalized(str: string): string {
    return this.alphanumeric(str).replace(/G/g, 'J');
  }

  async resolverMunicipio(cidade: string, uf: string, cep?: string): Promise<string> {
    const cidadeClean = this.cleanString(cidade);
    const ufUpper = this.cleanString(uf);

    if (!cidadeClean) {
      return '';
    }

    const municipios = await this.obterMunicipios();
    if (municipios.length === 0) {
      return cidadeClean;
    }

    // Filtrar por UF se informado
    const municipiosUf = ufUpper
      ? municipios.filter(m => this.cleanString(m.UF) === ufUpper)
      : municipios;

    const listToSearch = municipiosUf.length > 0 ? municipiosUf : municipios;

    // 1. Match exato normalizado (sem acentos)
    const exact = listToSearch.find(m => this.cleanString(m.NomeMunicipio) === cidadeClean);
    if (exact) {
      return exact.NomeMunicipio.trim();
    }

    // 2. Match alfanumérico (ignora espaços, hífens como "BIRITIBA-MIRIM" vs "BIRITIBA MIRIM")
    const cidadeAlpha = this.alphanumeric(cidade);
    const alphaMatch = listToSearch.find(m => this.alphanumeric(m.NomeMunicipio) === cidadeAlpha);
    if (alphaMatch) {
      logger.info(
        `[CIGAM MUNICIPIO] Município "${cidade}" resolvido por similaridade alfanumérica para "${alphaMatch.NomeMunicipio.trim()}" (UF: ${ufUpper})`
      );
      return alphaMatch.NomeMunicipio.trim();
    }

    // 3. Match fonético G <-> J (ex: "MOGI MIRIM" vs "MOJI MIRIM")
    const cidadeGJ = this.gjNormalized(cidade);
    const gjMatch = listToSearch.find(m => this.gjNormalized(m.NomeMunicipio) === cidadeGJ);
    if (gjMatch) {
      logger.info(
        `[CIGAM MUNICIPIO] Município "${cidade}" resolvido por variação fonética (G/J) para "${gjMatch.NomeMunicipio.trim()}" (UF: ${ufUpper})`
      );
      return gjMatch.NomeMunicipio.trim();
    }

    // 4. Se ainda não encontrou e possui CEP, buscar código IBGE via ViaCEP
    const cepClean = (cep || '').replace(/\D/g, '');
    if (cepClean.length === 8) {
      try {
        const viacepResponse = await axios.get(`https://viacep.com.br/ws/${cepClean}/json/`, {
          timeout: 3000,
        });
        const ibge = viacepResponse.data?.ibge;
        if (ibge) {
          const ibgeMatch = municipios.find(m => (m.Codigo || '').trim() === String(ibge).trim());
          if (ibgeMatch) {
            logger.info(
              `[CIGAM MUNICIPIO] Município "${cidade}" resolvido via IBGE (${ibge}) pelo CEP ${cepClean} para "${ibgeMatch.NomeMunicipio.trim()}" (UF: ${ibgeMatch.UF?.trim()})`
            );
            return ibgeMatch.NomeMunicipio.trim();
          }
        }
      } catch (viaCepErr: any) {
        logger.warn(`Não foi possível consultar ViaCEP para CEP ${cepClean}: ${viaCepErr.message}`);
      }
    }

    logger.warn(
      `[CIGAM MUNICIPIO] Município "${cidade}" (UF: ${ufUpper}) não localizado na tabela do CIGAM. Enviando como digitado.`
    );
    return cidadeClean;
  }
}
