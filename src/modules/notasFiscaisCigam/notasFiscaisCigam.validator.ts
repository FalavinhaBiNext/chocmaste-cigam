import { z } from 'zod';
import { ValidationError } from '@/shared/errors/AppError';

export const receberNotaFiscalSchema = z.object({
  numeroPedido: z.string().min(1, 'numeroPedido é obrigatório.'),
  xml: z.string().min(1, 'xml é obrigatório.'),
  unidadeNegocio: z.string().optional(),
  dataFaturamento: z.string().optional(),
  numeroNf: z.string().optional(),
  serieNf: z.string().optional(),
  chaveAcessoNfe: z.string().optional(),
});

export type ReceberNotaFiscalInput = z.infer<typeof receberNotaFiscalSchema>;

export function validateReceberNotaFiscal(input: unknown): ReceberNotaFiscalInput {
  const result = receberNotaFiscalSchema.safeParse(input);

  if (!result.success) {
    throw new ValidationError('Dados do webhook CIGAM inválidos.', result.error.flatten());
  }

  return result.data;
}
