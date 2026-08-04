import { z } from 'zod';
import { ValidationError } from '@/shared/errors/AppError';

export const createClientesCigamSchema = z.object({
  id_cigam: z.string().min(1, 'id_cigam é obrigatório.'),
  nome: z.string().min(1, 'nome é obrigatório.'),
  documento: z.string().optional(),
  tipo_pessoa: z.string().optional(),
  telefone: z.string().optional(),
  celular: z.string().optional(),
  email: z.string().optional(),
  endereco: z.string().optional(),
  numero: z.string().optional(),
  complemento: z.string().optional(),
  bairro: z.string().optional(),
  cidade: z.string().optional(),
  uf: z.string().optional(),
  cep: z.string().optional(),
  ativo: z.boolean().optional().default(true),
});

export type CreateClientesCigamInput = z.infer<typeof createClientesCigamSchema>;

export function validateCreateClientesCigam(input: unknown) {
  const result = createClientesCigamSchema.safeParse(input);

  if (!result.success) {
    throw new ValidationError('Dados inválidos.', result.error.flatten());
  }

  return result.data;
}
