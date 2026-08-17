import { z } from 'zod';
import { ValidationError } from '@/shared/errors/AppError';

// Schema completo (para uso interno após extrair o XML do arquivo)
export const receberNotaFiscalSchema = z.object({
  numeroPedido: z.string().min(1, 'numeroPedido é obrigatório.'),
  xml: z.string().min(1, 'xml é obrigatório.'),
  unidadeNegocio: z.string().optional(),
  dataFaturamento: z.string().optional(),
  numeroNf: z.string().optional(),
  serieNf: z.string().optional(),
  chaveAcessoNfe: z.string().optional(),
});

// Schema apenas para os campos do body (sem o xml, que vem do arquivo)
export const receberNotaFiscalBodySchema = z.object({
  numeroPedido: z.string().min(1, 'numeroPedido é obrigatório.'),
  unidadeNegocio: z.string().optional(),
  dataFaturamento: z.string().optional(),
  numeroNf: z.string().optional(),
  serieNf: z.string().optional(),
  chaveAcessoNfe: z.string().optional(),
});

export type ReceberNotaFiscalInput = z.infer<typeof receberNotaFiscalSchema>;
export type ReceberNotaFiscalBodyInput = z.infer<typeof receberNotaFiscalBodySchema>;

export function validateReceberNotaFiscal(input: unknown): ReceberNotaFiscalInput {
  const result = receberNotaFiscalSchema.safeParse(input);

  if (!result.success) {
    throw new ValidationError('Dados do webhook CIGAM inválidos.', result.error.flatten());
  }

  return result.data;
}

export function validateReceberNotaFiscalBody(input: unknown): ReceberNotaFiscalBodyInput {
  const result = receberNotaFiscalBodySchema.safeParse(input);

  if (!result.success) {
    throw new ValidationError('Dados do webhook CIGAM inválidos.', result.error.flatten());
  }

  return result.data;
}
