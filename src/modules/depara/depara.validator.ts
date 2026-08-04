import { z } from "zod";
import { ValidationError } from "@/shared/errors/AppError";

export const deParaSyncSchema = z.object({
  ambiente: z.string().min(1, 'Ambiente é obrigatório'),
});

export const deParaManualSchema = z.object({
  entity: z.enum(['produtos', 'clientes', 'formas_pagamento', 'transportadoras']),
  id_bling: z.string().min(1, 'id_bling é obrigatório'),
  id_cigam: z.string().min(1, 'id_cigam é obrigatório'),
  nome: z.string().min(1, 'nome é obrigatório'),
});

export const deParaExportFilterSchema = z.enum(['all', 'mapped', 'unmapped']);
export const deParaExportSourceSchema = z.enum(['all', 'bling', 'cigam']);

export type DeParaSyncInput = z.infer<typeof deParaSyncSchema>;
export type DeParaManualInput = z.infer<typeof deParaManualSchema>;
export type DeParaExportFilter = z.infer<typeof deParaExportFilterSchema>;
export type DeParaExportSource = z.infer<typeof deParaExportSourceSchema>;

export function validateDeParaSync(input: unknown) {
  const result = deParaSyncSchema.safeParse(input);
  if (!result.success) {
    throw new ValidationError('Dados inválidos.', result.error.flatten());
  }
  return result.data;
}

export function validateDeParaManual(input: unknown) {
  const result = deParaManualSchema.safeParse(input);
  if (!result.success) {
    throw new ValidationError('Dados inválidos.', result.error.flatten());
  }
  return result.data;
}

export function validateDeParaExportFilter(input: unknown): DeParaExportFilter {
  const result = deParaExportFilterSchema.safeParse(input || 'all');
  if (!result.success) {
    throw new ValidationError('Filtro de associação inválido.', result.error.flatten());
  }
  return result.data;
}

export function validateDeParaExportSource(input: unknown): DeParaExportSource {
  const result = deParaExportSourceSchema.safeParse(input || 'all');
  if (!result.success) {
    throw new ValidationError('Origem de exportação inválida.', result.error.flatten());
  }
  return result.data;
}
