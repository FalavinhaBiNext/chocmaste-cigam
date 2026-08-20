import { z } from 'zod';
import { ValidationError } from '@/shared/errors/AppError';

export const createCanalVendaSchema = z.object({
  id_bling: z.string().min(1, 'id_bling é obrigatório.'),
  descricao: z.string().min(1, 'descricao é obrigatório.'),
  tipo: z.string().optional(),
  situacao: z.string().optional(),
  ativo: z.boolean().optional().default(true),
  local_venda: z.string().optional(),
  codigo_conta: z.string().optional(),
});

export type CreateCanalVendaInput = z.infer<typeof createCanalVendaSchema>;

export function validateCreateCanalVenda(input: unknown) {
  const result = createCanalVendaSchema.safeParse(input);

  if (!result.success) {
    throw new ValidationError('Dados inválidos.', result.error.flatten());
  }

  return result.data;
}
