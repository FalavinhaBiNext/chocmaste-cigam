import { z } from 'zod';
import { ValidationError } from '@/shared/errors/AppError';

export const createFormasPagamentoCigamSchema = z.object({
  id_cigam: z.string().min(1, 'id_cigam é obrigatório.'),
  descricao: z.string().min(1, 'descricao é obrigatório.'),
  tipo: z.string().optional(),
  ativo: z.boolean().optional().default(true),
});

export type CreateFormasPagamentoCigamInput = z.infer<typeof createFormasPagamentoCigamSchema>;

export function validateCreateFormasPagamentoCigam(input: unknown) {
  const result = createFormasPagamentoCigamSchema.safeParse(input);

  if (!result.success) {
    throw new ValidationError('Dados inválidos.', result.error.flatten());
  }

  return result.data;
}
