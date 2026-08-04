import { z } from 'zod';
import { ValidationError } from '@/shared/errors/AppError';

export const createFormaPagamentoSchema = z.object({
  id_bling: z.string().min(1, 'id_bling é obrigatório.'),
  descricao: z.string().min(1, 'descricao é obrigatório.'),
  tipo: z.string().optional(),
  id_cigam: z.string().optional(),
  active: z.boolean().optional().default(true),
});

export type CreateFormaPagamentoInput = z.infer<typeof createFormaPagamentoSchema>;

export function validateCreateFormaPagamento(input: unknown) {
  const result = createFormaPagamentoSchema.safeParse(input);

  if (!result.success) {
    throw new ValidationError('Dados inválidos.', result.error.flatten());
  }

  return result.data;
}
