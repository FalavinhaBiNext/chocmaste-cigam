import { z } from 'zod';
import { ValidationError } from '@/shared/errors/AppError';

export const authenticateSchema = z.object({
  ambiente: z.string().min(1, 'ambiente é obrigatório.'),
});

export type AuthenticateInput = z.infer<typeof authenticateSchema>;

export function validateAuthenticate(input: unknown) {
  const result = authenticateSchema.safeParse(input);

  if (!result.success) {
    throw new ValidationError('Dados inválidos.', result.error.flatten());
  }

  return result.data;
}

export const saveTokenSchema = z.object({
  hash: z.string().min(1, 'hash é obrigatório.'),
  ambiente: z.string().min(1, 'ambiente é obrigatório.'),
  expires_at: z.string().datetime().optional(),
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

export const syncSchema = z.object({
  ambiente: z.string().optional(),
});

export type SyncInput = z.infer<typeof syncSchema>;

export function validateSync(input: unknown) {
  const result = syncSchema.safeParse(input);

  if (!result.success) {
    throw new ValidationError('Dados inválidos.', result.error.flatten());
  }

  return result.data;
}