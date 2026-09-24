import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { CigamNfeRoutingService } from './cigamNfeRoutingService';

describe('CigamNfeRoutingService', () => {
  let service: CigamNfeRoutingService;
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    process.env.CIGAM_DEFAULT_UNIDADE_NEGOCIO = '001';
    service = new CigamNfeRoutingService();
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  describe('extrairCnpjEmitente', () => {
    it('deve extrair CNPJ de dentro da tag <emit><CNPJ> no XML', () => {
      const xml = '<nfeProc><NFe><infNFe><emit><CNPJ>42817349000160</CNPJ><xNome>MADALENA PET STORE</xNome></emit></infNFe></NFe></nfeProc>';
      const cnpj = service.extrairCnpjEmitente(xml);
      expect(cnpj).toBe('42817349000160');
    });

    it('deve extrair CNPJ da chave de acesso de 44 dígitos se XML não contiver', () => {
      const chave = '41260942817349000160550010000111141563626206';
      const cnpj = service.extrairCnpjEmitente(undefined, chave);
      expect(cnpj).toBe('42817349000160');
    });
  });

  describe('identificarUnidadeNegocio', () => {
    it('deve identificar unidade 004 para CNPJ da Madalena Pet Store', () => {
      const xml = '<emit><CNPJ>42817349000160</CNPJ></emit>';
      const result = service.identificarUnidadeNegocio({ xmlContent: xml });
      expect(result.unidade).toBe('004');
      expect(result.cnpj).toBe('42817349000160');
      expect(result.nomeEmpresa).toBe('Madalena Pet Store');
    });

    it('deve identificar unidade 001 para CNPJ da Chocmaster Matriz', () => {
      const xml = '<emit><CNPJ>10330589000140</CNPJ></emit>';
      const result = service.identificarUnidadeNegocio({ xmlContent: xml });
      expect(result.unidade).toBe('001');
      expect(result.cnpj).toBe('10330589000140');
      expect(result.nomeEmpresa).toBe('Chocmaster Matriz');
    });

    it('deve usar o campo unidadeNegocio do body quando CNPJ não for identificado', () => {
      const result = service.identificarUnidadeNegocio({ unidadeNegocio: '004' });
      expect(result.unidade).toBe('004');
    });
  });

  describe('verificarERotear', () => {
    it('deve processar localmente se a nota for da mesma unidade da instância atual (001)', async () => {
      const result = await service.verificarERotear({
        body: {
          numeroPedido: '000266',
          unidadeNegocio: '001',
          chaveAcessoNfe: '41260910330589000140550010000829801537802122',
        },
        xmlContent: '<emit><CNPJ>10330589000140</CNPJ></emit>',
      });

      expect(result.forwarded).toBe(false);
      expect(result.unidadeIdentificada).toBe('001');
      expect(result.unidadeLocal).toBe('001');
    });

    it('não deve encaminhar se a requisição já veio com header x-cigam-forwarded (anti-loop)', async () => {
      const result = await service.verificarERotear({
        body: {
          numeroPedido: '000267',
          unidadeNegocio: '004',
        },
        xmlContent: '<emit><CNPJ>42817349000160</CNPJ></emit>',
        headers: {
          'x-cigam-forwarded': 'true',
        },
      });

      expect(result.forwarded).toBe(false);
      expect(result.unidadeIdentificada).toBe('004');
    });

    it('deve acionar encaminhamento quando a nota for da unidade 004 em servidor 001', async () => {
      const mockResponse = { success: true, message: 'NF-e recebida na Madalena' };
      const encaminharSpy = vi.spyOn(service, 'encaminharRequisicao').mockResolvedValue(mockResponse);

      const result = await service.verificarERotear({
        body: {
          numeroPedido: '000267',
          unidadeNegocio: '004',
          chaveAcessoNfe: '41260942817349000160550010000111141563626206',
        },
        xmlContent: '<emit><CNPJ>42817349000160</CNPJ></emit>',
      });

      expect(result.forwarded).toBe(true);
      expect(result.unidadeIdentificada).toBe('004');
      expect(result.targetUrl).toBe('https://api-chocmaster-madalena.falavinhanext.tec.br/api/v1/notas-fiscais-cigam');
      expect(result.response).toEqual(mockResponse);
      expect(encaminharSpy).toHaveBeenCalledOnce();
    });
  });
});
