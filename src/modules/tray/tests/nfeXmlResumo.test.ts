import { describe, it, expect } from 'vitest';
import { divergenciasNotaXml, mascararDocumento, resumirXmlNFe } from '../utils/nfeXmlResumo';

const CHAVE = '35261012345678000100550010000829571234567890';

const XML = `<?xml version="1.0" encoding="UTF-8"?>
<nfeProc versao="4.00"><NFe><infNFe Id="NFe${CHAVE}" versao="4.00">
<ide><natOp>Venda de mercadoria</natOp><mod>55</mod><serie>1</serie><nNF>82957</nNF><dhEmi>2026-10-20T10:00:00-03:00</dhEmi><tpAmb>1</tpAmb></ide>
<emit><CNPJ>12345678000100</CNPJ><xNome>CHOCMASTER LTDA</xNome><enderEmit><UF>SP</UF></enderEmit></emit>
<dest><CPF>12345678909</CPF><enderDest><xMun>Curitiba</xMun><UF>PR</UF><CEP>80000000</CEP></enderDest></dest>
<det nItem="1"><prod><cProd>CHOC100</cProd><xProd>Barra 100g</xProd><CFOP>6102</CFOP><qCom>2.0000</qCom><vProd>30.00</vProd></prod></det>
<det nItem="2"><prod><cProd>BOMB01</cProd><xProd>Bombom</xProd><CFOP>6102</CFOP><qCom>1.0000</qCom><vProd>20.00</vProd></prod></det>
<total><ICMSTot><vProd>50.00</vProd><vFrete>10.00</vFrete><vDesc>5.00</vDesc><vNF>55.00</vNF></ICMSTot></total>
</infNFe></NFe>
<protNFe><infProt><chNFe>${CHAVE}</chNFe><cStat>100</cStat><xMotivo>Autorizado o uso da NF-e</xMotivo><nProt>135260000000001</nProt></infProt></protNFe>
</nfeProc>`;

describe('resumirXmlNFe', () => {
  it('extrai identificação, autorização, partes, totais e itens', () => {
    const r = resumirXmlNFe(XML)!;

    expect(r.chave).toBe(CHAVE);
    expect(r.numero).toBe('82957');
    expect(r.serie).toBe('1');
    expect(r.modelo).toBe('55');
    expect(r.ambiente).toBe('produção');
    expect(r.protocolo).toEqual({ cStat: '100', motivo: 'Autorizado o uso da NF-e', nProt: '135260000000001' });
    expect(r.emitente).toEqual({ cnpj: '12345678000100', nome: 'CHOCMASTER LTDA', uf: 'SP' });
    expect(r.destinatario).toEqual({ documento: '123******09', uf: 'PR', municipio: 'Curitiba', cep: '80000000' });
    expect(r.totais).toEqual({ vNF: 55, vProd: 50, vFrete: 10, vDesc: 5 });
    expect(r.itens).toHaveLength(2);
    expect(r.itens[0]).toEqual({ item: '1', cProd: 'CHOC100', xProd: 'Barra 100g', cfop: '6102', qCom: '2.0000', vProd: '30.00' });
  });

  it('retorna null sem XML', () => {
    expect(resumirXmlNFe(null)).toBeNull();
  });

  it('mascara o documento do destinatário', () => {
    expect(mascararDocumento('123.456.789-09')).toBe('123******09');
    expect(mascararDocumento('12345678000199')).toBe('123*********99');
  });
});

describe('divergenciasNotaXml', () => {
  const resumo = resumirXmlNFe(XML);

  it('sem divergências quando sistema e XML batem', () => {
    expect(divergenciasNotaXml({ numero: '082957', serie: '001', chaveAcesso: CHAVE, valorEnviado: 55 }, resumo)).toEqual([]);
  });

  it('aponta chave, número, série e valor divergentes', () => {
    const divergencias = divergenciasNotaXml(
      { numero: '83571', serie: '2', chaveAcesso: CHAVE.replace(/0$/, '1'), valorEnviado: 60 },
      resumo,
    );
    expect(divergencias.join('\n')).toMatch(/chave no sistema/);
    expect(divergencias.join('\n')).toMatch(/número no sistema \(83571\)/);
    expect(divergencias.join('\n')).toMatch(/série no sistema \(2\)/);
    expect(divergencias.join('\n')).toMatch(/valor enviado à Tray \(60.00\) ≠ vNF do XML \(55.00\)/);
  });

  it('avisa sobre homologação e XML sem protocolo', () => {
    const semProt = resumirXmlNFe(XML.replace('<tpAmb>1</tpAmb>', '<tpAmb>2</tpAmb>').replace(/<protNFe>[\s\S]*<\/protNFe>/, ''));
    const divergencias = divergenciasNotaXml({ numero: '82957', serie: '1', chaveAcesso: CHAVE, valorEnviado: 55 }, semProt);
    expect(divergencias.join('\n')).toMatch(/HOMOLOGAÇÃO/);
    expect(divergencias.join('\n')).toMatch(/sem protocolo/);
  });

  it('avisa quando não há XML', () => {
    expect(divergenciasNotaXml({ numero: '1', serie: '1', chaveAcesso: CHAVE, valorEnviado: 0 }, null)[0]).toMatch(/sem XML/);
  });
});
