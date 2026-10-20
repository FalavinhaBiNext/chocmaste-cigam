/**
 * Resumo legível do XML de uma NF-e, para os logs de envio à Tray.
 * Usa regex (mesma abordagem do TrayFiscalService): os campos lidos aqui são
 * folhas simples do XML da NF-e. Documento do destinatário sai mascarado.
 */

export interface ItemNFeResumo {
  item: string;
  cProd: string | null;
  xProd: string | null;
  cfop: string | null;
  qCom: string | null;
  vProd: string | null;
}

export interface NFeXmlResumo {
  tamanho: number;
  chave: string | null;
  numero: string | null;
  serie: string | null;
  modelo: string | null;
  emissao: string | null;
  naturezaOperacao: string | null;
  ambiente: 'produção' | 'homologação' | null;
  protocolo: { cStat: string | null; motivo: string | null; nProt: string | null } | null;
  emitente: { cnpj: string | null; nome: string | null; uf: string | null };
  destinatario: { documento: string | null; uf: string | null; municipio: string | null; cep: string | null };
  totais: { vNF: number | null; vProd: number | null; vFrete: number | null; vDesc: number | null };
  itens: ItemNFeResumo[];
}

const tag = (xml: string, nome: string): string | null => {
  const match = xml.match(new RegExp(`<${nome}>([^<]*)</${nome}>`));
  return match ? match[1].trim() : null;
};

const bloco = (xml: string, nome: string): string => {
  const match = xml.match(new RegExp(`<${nome}\\b[^>]*>([\\s\\S]*?)</${nome}>`));
  return match ? match[1] : '';
};

const numero = (valor: string | null): number | null => {
  if (valor === null) return null;
  const n = parseFloat(valor);
  return Number.isNaN(n) ? null : n;
};

/** Mantém só os 3 primeiros e os 2 últimos dígitos (ex.: 123******89). */
export function mascararDocumento(doc: string | null): string | null {
  if (!doc) return null;
  const digitos = doc.replace(/\D/g, '');
  if (digitos.length <= 5) return '*'.repeat(digitos.length);
  return `${digitos.slice(0, 3)}${'*'.repeat(digitos.length - 5)}${digitos.slice(-2)}`;
}

export function resumirXmlNFe(xml: string | null | undefined): NFeXmlResumo | null {
  if (!xml) return null;

  const ide = bloco(xml, 'ide');
  const emit = bloco(xml, 'emit');
  const dest = bloco(xml, 'dest');
  const total = bloco(xml, 'ICMSTot');
  const prot = bloco(xml, 'infProt');

  const chaveAttr = xml.match(/<infNFe\b[^>]*\bId="NFe(\d{44})"/);
  const tpAmb = tag(ide, 'tpAmb');

  const itens: ItemNFeResumo[] = [];
  const detRegex = /<det\b[^>]*nItem="(\d+)"[^>]*>([\s\S]*?)<\/det>/g;
  let match: RegExpExecArray | null;
  while ((match = detRegex.exec(xml)) !== null) {
    const det = match[2];
    itens.push({
      item: match[1],
      cProd: tag(det, 'cProd'),
      xProd: tag(det, 'xProd'),
      cfop: tag(det, 'CFOP'),
      qCom: tag(det, 'qCom'),
      vProd: tag(det, 'vProd'),
    });
  }

  return {
    tamanho: xml.length,
    chave: chaveAttr ? chaveAttr[1] : tag(prot, 'chNFe'),
    numero: tag(ide, 'nNF'),
    serie: tag(ide, 'serie'),
    modelo: tag(ide, 'mod'),
    emissao: tag(ide, 'dhEmi') ?? tag(ide, 'dEmi'),
    naturezaOperacao: tag(ide, 'natOp'),
    ambiente: tpAmb === '1' ? 'produção' : tpAmb === '2' ? 'homologação' : null,
    protocolo: prot ? { cStat: tag(prot, 'cStat'), motivo: tag(prot, 'xMotivo'), nProt: tag(prot, 'nProt') } : null,
    emitente: { cnpj: tag(emit, 'CNPJ'), nome: tag(emit, 'xNome'), uf: tag(bloco(emit, 'enderEmit'), 'UF') },
    destinatario: {
      documento: mascararDocumento(tag(dest, 'CNPJ') ?? tag(dest, 'CPF')),
      uf: tag(bloco(dest, 'enderDest'), 'UF'),
      municipio: tag(bloco(dest, 'enderDest'), 'xMun'),
      cep: tag(bloco(dest, 'enderDest'), 'CEP'),
    },
    totais: {
      vNF: numero(tag(total, 'vNF')),
      vProd: numero(tag(total, 'vProd')),
      vFrete: numero(tag(total, 'vFrete')),
      vDesc: numero(tag(total, 'vDesc')),
    },
    itens,
  };
}

/**
 * Compara os dados da NF-e registrados no sistema com o que está no XML.
 * Cada divergência vira uma mensagem para o log (aviso).
 */
export function divergenciasNotaXml(
  nota: { numero: string | null; serie: string | null; chaveAcesso: string | null; valorEnviado: number },
  resumo: NFeXmlResumo | null,
): string[] {
  if (!resumo) return ['NF-e sem XML: a Tray receberá só os dados estruturados, sem xml_danfe.'];
  const divergencias: string[] = [];
  const semZeros = (v: string | null) => (v ?? '').replace(/^0+/, '');

  if (nota.chaveAcesso && resumo.chave && nota.chaveAcesso.trim() !== resumo.chave) {
    divergencias.push(`chave no sistema (${nota.chaveAcesso}) ≠ chave no XML (${resumo.chave})`);
  }
  if (nota.numero && resumo.numero && semZeros(nota.numero) !== semZeros(resumo.numero)) {
    divergencias.push(`número no sistema (${nota.numero}) ≠ nNF no XML (${resumo.numero})`);
  }
  if (nota.serie && resumo.serie && semZeros(nota.serie) !== semZeros(resumo.serie)) {
    divergencias.push(`série no sistema (${nota.serie}) ≠ série no XML (${resumo.serie})`);
  }
  if (resumo.totais.vNF !== null && Math.abs(resumo.totais.vNF - nota.valorEnviado) > 0.01) {
    divergencias.push(`valor enviado à Tray (${nota.valorEnviado.toFixed(2)}) ≠ vNF do XML (${resumo.totais.vNF.toFixed(2)})`);
  }
  if (resumo.ambiente === 'homologação') {
    divergencias.push('XML emitido em HOMOLOGAÇÃO (tpAmb=2) — não é uma NF-e válida em produção.');
  }
  if (resumo.protocolo && resumo.protocolo.cStat && !['100', '150'].includes(resumo.protocolo.cStat)) {
    divergencias.push(`protocolo da SEFAZ com cStat=${resumo.protocolo.cStat} (${resumo.protocolo.motivo ?? 'sem motivo'}) — a nota pode não estar autorizada.`);
  }
  if (!resumo.protocolo) {
    divergencias.push('XML sem protocolo de autorização (infProt) — pode ser a NF-e sem o nfeProc.');
  }
  return divergencias;
}
