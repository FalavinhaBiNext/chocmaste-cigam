export interface CreateNotaFiscalCigamDTO {
  numero_pedido_cigam: string;
  numero_pedido_marketplace?: string;
  unidade_negocio?: string;
  data_faturamento?: string;
  numero_nf?: string;
  serie_nf?: string;
  chave_acesso?: string;
  enviado_marketplace?: boolean;
  xml_content: string;
}

export interface ResponseNotaFiscalCigamDTO {
  id: string;
  numero_pedido_cigam: string;
  numero_pedido_marketplace: string | null;
  unidade_negocio: string | null;
  data_faturamento: string | null;
  numero_nf: string | null;
  serie_nf: string | null;
  chave_acesso: string | null;
  enviado_marketplace: boolean;
  xml_content: string;
  created_at: Date;
  updated_at: Date;
}
