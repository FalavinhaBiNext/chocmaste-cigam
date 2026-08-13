import { z } from 'zod';
import { ValidationError } from '@/shared/errors/AppError';

export const createClientesSchema = z.object({
  id_bling: z.string().optional(),
  id_cigam: z.string().optional(),
  nome: z.string().min(1, 'nome é obrigatório.'),
  documento: z.string().optional(),
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
  ie: z.string().optional(),
  tipo: z.string().optional(),
  active: z.boolean().optional().default(true),
});

export type CreateClientesInput = z.infer<typeof createClientesSchema>;

export function validateCreateClientes(input: unknown) {
  const result = createClientesSchema.safeParse(input);

  if (!result.success) {
    throw new ValidationError('Dados inválidos.', result.error.flatten());
  }

  return result.data;
}
