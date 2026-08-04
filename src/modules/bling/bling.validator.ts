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

export const saveTokenSchema = z.object({
  access_token: z.string().min(1, 'access_token é obrigatório.'),
  refresh_token: z.string().min(1, 'refresh_token é obrigatório.'),
  access_token_url: z.string().optional(),
  client_id: z.string().optional(),
  client_secret: z.string().optional(),
  expires_at: z.string().datetime().optional(),
  scope: z.string().optional(),
  token_type: z.string().optional(),
  active: z.boolean().optional().default(true),
});

export type SaveTokenInput = z.infer<typeof saveTokenSchema>;

export function validateSaveToken(input: unknown) {
  const result = saveTokenSchema.safeParse(input);
  if (!result.success) {
    throw new ValidationError('Dados do token inválidos.', result.error.flatten());
  }
  return result.data;
}
