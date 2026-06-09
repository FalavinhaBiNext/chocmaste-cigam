import { z } from 'zod';
import { ValidationError } from '@/shared/errors/AppError';

export const callbackQuerySchema = z.object({
  code: z.string().min(1, 'Code é obrigatório'),
  state: z.string().optional()
});

export function validateCallbackQuery(params: unknown) {
  const result = callbackQuerySchema.safeParse(params);
  if (!result.success) {
    throw new ValidationError('Parâmetros inválidos no callback.', result.error.flatten());
  }
  return result.data;
}
