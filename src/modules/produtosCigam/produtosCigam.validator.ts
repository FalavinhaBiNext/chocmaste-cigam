import { z } from 'zod';
import { ValidationError } from '@/shared/errors/AppError';

export const createProdutosCigamSchema = z.object({
  id_cigam: z.string().min(1, 'id_cigam é obrigatório.'),
  nome: z.string().min(1, 'nome é obrigatório.'),
  preco: z.number({ message: 'preco deve ser um número.' }),
  unidade: z.string().optional(),
  ncm: z.string().optional(),
  quantidade_estoque: z.number({ message: 'quantidade_estoque deve ser um número.' }).optional().default(0),
  ativo: z.boolean().optional().default(true),
});

export type CreateProdutosCigamInput = z.infer<typeof createProdutosCigamSchema>;

export function validateCreateProdutosCigam(input: unknown) {
  const result = createProdutosCigamSchema.safeParse(input);

  if (!result.success) {
    throw new ValidationError('Dados inválidos.', result.error.flatten());
  }

  return result.data;
}
