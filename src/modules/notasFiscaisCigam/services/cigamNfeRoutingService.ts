import { injectable } from 'tsyringe';
import { logger } from '@/shared/utils/logger';
import { ReceberNotaFiscalBodyInput } from '../notasFiscaisCigam.validator';

export interface RouteCheckParams {
  body: ReceberNotaFiscalBodyInput;
  xmlContent: string;
  headers?: Record<string, any>;
}

export interface RoutingDecision {
  forwarded: boolean;
  unidadeIdentificada: string;
  unidadeLocal: string;
  cnpjIdentificado?: string;
  targetUrl?: string;
  response?: any;
}

// Mapeamento padrão de CNPJ para Unidade de Negócio e URLs
const CNPJ_UNIDADE_MAP: Record<string, { unidade: string; nome: string }> = {
  '10330589000140': { unidade: '001', nome: 'Chocmaster Matriz' },
  '42817349000160': { unidade: '004', nome: 'Madalena Pet Store' },
};

const DEFAULT_URL_MAP: Record<string, string> = {
  '001': 'https://api-chocmaster.falavinhanext.tec.br/api/v1/notas-fiscais-cigam',
  '004': 'https://api-chocmaster-madalena.falavinhanext.tec.br/api/v1/notas-fiscais-cigam',
};

@injectable()
export class CigamNfeRoutingService {
  /**
   * Extrai o CNPJ do emitente a partir do XML ou da chave de acesso
   */
  extrairCnpjEmitente(xmlContent?: string, chaveAcesso?: string): string | undefined {
    // 1. Tenta extrair do XML na tag <emit><CNPJ>
    if (xmlContent) {
      const matchXml = xmlContent.match(/<emit>[\s\S]*?<CNPJ>(\d{14})<\/CNPJ>/i);
      if (matchXml && matchXml[1]) {
        return matchXml[1];
      }
    }

    // 2. Tenta extrair da chave de acesso de 44 dígitos (posições 6 a 19 são o CNPJ do emitente)
    if (chaveAcesso) {
      const digits = chaveAcesso.replace(/\D/g, '');
      if (digits.length === 44) {
        return digits.slice(6, 20);
      }
    }

    return undefined;
  }

  /**
   * Identifica a unidade de negócio da nota com base no body, XML e chave de acesso
   */
  identificarUnidadeNegocio(params: {
    unidadeNegocio?: string;
    xmlContent?: string;
    chaveAcesso?: string;
  }): { unidade: string; cnpj?: string; nomeEmpresa?: string } {
    const cnpj = this.extrairCnpjEmitente(params.xmlContent, params.chaveAcesso);

    // Se o CNPJ for identificado e mapeado, ele é a fonte mais confiável
    if (cnpj && CNPJ_UNIDADE_MAP[cnpj]) {
      const mapped = CNPJ_UNIDADE_MAP[cnpj];
      return {
        unidade: mapped.unidade,
        cnpj,
        nomeEmpresa: mapped.nome,
      };
    }

    // Se unidadeNegocio veio no body
    if (params.unidadeNegocio && params.unidadeNegocio.trim()) {
      const normalized = params.unidadeNegocio.trim().padStart(3, '0');
      return {
        unidade: normalized,
        cnpj,
      };
    }

    // Padrão fallback: unidade local
    const local = this.obterUnidadeLocal();
    return {
      unidade: local,
      cnpj,
    };
  }

  /**
   * Obtém a unidade de negócio configurada para esta instância
   */
  obterUnidadeLocal(): string {
    const raw = process.env.CIGAM_DEFAULT_UNIDADE_NEGOCIO || '001';
    return raw.trim().padStart(3, '0');
  }

  /**
   * Obtém a URL de destino para onde a nota de determinada unidade deve ser encaminhada
   */
  obterUrlDestino(unidade: string): string | null {
    // 1. Variável de ambiente específica (ex: CIGAM_FORWARD_URL_004 ou CIGAM_FORWARD_URL_001)
    const envVarName = `CIGAM_FORWARD_URL_${unidade}`;
    const envUrl = process.env[envVarName];
    if (envUrl && envUrl.trim()) {
      return envUrl.trim();
    }

    // 2. Mapeamento padrão conhecido
    return DEFAULT_URL_MAP[unidade] || null;
  }

  /**
   * Verifica se a NF-e recebida deve ser encaminhada para outra instância e executa o encaminhamento se necessário
   */
  async verificarERotear(params: RouteCheckParams): Promise<RoutingDecision> {
    const localUnit = this.obterUnidadeLocal();
    const headers = params.headers || {};

    const info = this.identificarUnidadeNegocio({
      unidadeNegocio: params.body.unidadeNegocio,
      xmlContent: params.xmlContent,
      chaveAcesso: params.body.chaveAcessoNfe,
    });

    const isAlreadyForwarded = Boolean(
      headers['x-cigam-forwarded'] === 'true' ||
      headers['x-cigam-forwarded'] === true ||
      headers['x-forwarded-from-cigam']
    );

    // Se já foi encaminhado, nunca reencaminha (evita loops)
    if (isAlreadyForwarded) {
      logger.info(
        `[ROTEADOR NF-E CIGAM] Requisição já encaminhada recebida (unidade nota: ${info.unidade}, unidade local: ${localUnit}). Processando localmente.`
      );
      return {
        forwarded: false,
        unidadeIdentificada: info.unidade,
        unidadeLocal: localUnit,
        cnpjIdentificado: info.cnpj,
      };
    }

    // Se pertence a esta mesma unidade local, processa localmente
    if (info.unidade === localUnit) {
      logger.info(
        `[ROTEADOR NF-E CIGAM] NF-e pertence à unidade local ${localUnit} (${info.nomeEmpresa || 'Matriz'}). Processando localmente.`
      );
      return {
        forwarded: false,
        unidadeIdentificada: info.unidade,
        unidadeLocal: localUnit,
        cnpjIdentificado: info.cnpj,
      };
    }

    // Pertence a outra unidade! Descobre para onde enviar
    const targetUrl = this.obterUrlDestino(info.unidade);
    if (!targetUrl) {
      logger.warn(
        `[ROTEADOR NF-E CIGAM] NF-e identificada como unidade ${info.unidade}, mas nenhuma URL de destino configurada para ela. Processando localmente na unidade ${localUnit}.`
      );
      return {
        forwarded: false,
        unidadeIdentificada: info.unidade,
        unidadeLocal: localUnit,
        cnpjIdentificado: info.cnpj,
      };
    }

    logger.info(
      `[ROTEADOR NF-E CIGAM] NF-e do pedido CIGAM #${params.body.numeroPedido} pertence à unidade ${info.unidade} (${info.nomeEmpresa || 'Outra Empresa'}, CNPJ: ${info.cnpj || 'N/A'}). Encaminhando para: ${targetUrl}...`
    );

    try {
      const responseData = await this.encaminharRequisicao(targetUrl, params.xmlContent, params.body);

      logger.success(
        `[ROTEADOR NF-E CIGAM] NF-e encaminhada com sucesso para ${targetUrl} (Unidade ${info.unidade}).`
      );

      return {
        forwarded: true,
        unidadeIdentificada: info.unidade,
        unidadeLocal: localUnit,
        cnpjIdentificado: info.cnpj,
        targetUrl,
        response: responseData,
      };
    } catch (error: any) {
      logger.error(
        `[ROTEADOR NF-E CIGAM] Falha ao encaminhar NF-e para ${targetUrl}: ${error.message}`
      );
      throw error;
    }
  }

  /**
   * Encaminha a requisição multipart/form-data para a URL de destino
   */
  async encaminharRequisicao(
    targetUrl: string,
    xmlContent: string,
    body: ReceberNotaFiscalBodyInput
  ): Promise<any> {
    const formData = new FormData();

    // Adiciona o XML como Blob/Arquivo
    const xmlBlob = new Blob([xmlContent], { type: 'application/xml' });
    formData.append('xml', xmlBlob, 'nfe.xml');

    // Adiciona os campos de texto
    formData.append('numeroPedido', body.numeroPedido);
    if (body.unidadeNegocio) formData.append('unidadeNegocio', body.unidadeNegocio);
    if (body.dataFaturamento) formData.append('dataFaturamento', body.dataFaturamento);
    if (body.numeroNf) formData.append('numeroNf', body.numeroNf);
    if (body.serieNf) formData.append('serieNf', body.serieNf);
    if (body.chaveAcessoNfe) formData.append('chaveAcessoNfe', body.chaveAcessoNfe);

    const response = await fetch(targetUrl, {
      method: 'POST',
      body: formData,
      headers: {
        'x-cigam-forwarded': 'true',
      },
    });

    const textResponse = await response.text();
    let jsonResponse: any;
    try {
      jsonResponse = JSON.parse(textResponse);
    } catch {
      jsonResponse = { raw: textResponse };
    }

    if (!response.ok) {
      const errMsg = jsonResponse?.message || response.statusText || 'Erro no encaminhamento';
      throw new Error(`API de destino retornou erro HTTP ${response.status}: ${errMsg}`);
    }

    return jsonResponse;
  }
}
