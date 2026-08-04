import { z } from 'zod';
import { ValidationError } from '@/shared/errors/AppError';

export const cigamProdutoWebhookSchema = z.object({
  codigoMaterial: z.string().min(1, 'codigoMaterial é obrigatório.'),
  descricao: z.string().min(1, 'descricao é obrigatório.'),
  unidadeMedida: z.string().optional().default('UN'),
  referencia: z.string().optional().default(''),
  peso: z.number().optional().default(0),
  volume: z.number().optional().default(0),
  precoUnitario: z.number({ message: 'precoUnitario deve ser um número.' }).min(0, 'precoUnitario não pode ser negativo.'),
});

export type CigamProdutoWebhookInput = z.infer<typeof cigamProdutoWebhookSchema>;

export function validateCigamProdutoWebhook(input: unknown): CigamProdutoWebhookInput {
  const result = cigamProdutoWebhookSchema.safeParse(input);

  if (!result.success) {
    throw new ValidationError('Dados do webhook CIGAM inválidos.', result.error.flatten());
  }

  return result.data;
}
