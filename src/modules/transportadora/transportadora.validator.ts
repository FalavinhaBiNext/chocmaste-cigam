import { z } from 'zod';
import { ValidationError } from '@/shared/errors/AppError';

export const createTransportadoraSchema = z.object({
  id_bling: z.string().min(1, 'id_bling é obrigatório.'),
  nome: z.string().min(1, 'nome é obrigatório.'),
  fantasia: z.string().optional(),
  documento: z.string().optional(),
  active: z.boolean().optional().default(true),
});

export type CreateTransportadoraInput = z.infer<typeof createTransportadoraSchema>;

export function validateCreateTransportadora(input: unknown) {
  const result = createTransportadoraSchema.safeParse(input);

  if (!result.success) {
    throw new ValidationError('Dados inválidos.', result.error.flatten());
  }

  return result.data;
}
