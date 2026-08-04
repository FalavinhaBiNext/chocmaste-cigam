export interface DeParaResultDTO {
  entity: string;
  mapped: number;
  unmapped: number;
  errors: string[];
  unmappedItems: { id_bling: string; nome: string }[];
}

export interface DeParaStatusDTO {
  entity: string;
  total_bling: number;
  total_cigam: number;
  total_mapped: number;
  total_unmapped: number;
}
