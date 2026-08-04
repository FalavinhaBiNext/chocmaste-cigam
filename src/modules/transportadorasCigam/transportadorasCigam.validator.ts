import { z } from 'zod';
import { ValidationError } from '@/shared/errors/AppError';

export const createTransportadorasCigamSchema = z.object({
  id_cigam: z.string().min(1, 'id_cigam é obrigatório.'),
  nome: z.string().min(1, 'nome é obrigatório.'),
  fantasia: z.string().optional(),
  documento: z.string().optional(),
  codigo_divisao: z.string().optional().default("70"),
  ativo: z.boolean().optional().default(true),
});

export type CreateTransportadorasCigamInput = z.infer<typeof createTransportadorasCigamSchema>;

export function validateCreateTransportadorasCigam(input: unknown) {
  const result = createTransportadorasCigamSchema.safeParse(input);

  if (!result.success) {
    throw new ValidationError('Dados inválidos.', result.error.flatten());
  }

  return result.data;
}
