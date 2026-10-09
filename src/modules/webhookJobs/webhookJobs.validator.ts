import { z } from 'zod';
import { ValidationError } from '@/shared/errors/AppError';

export const listWebhookJobsQuerySchema = z.object({
  status: z.enum(['pendente', 'processando', 'concluido', 'falha']).optional(),
});

export function validateListWebhookJobsQuery(input: unknown) {
  const result = listWebhookJobsQuerySchema.safeParse(input);

  if (!result.success) {
    throw new ValidationError('Parâmetros de consulta inválidos.', result.error.flatten());
  }

  return result.data;
}
