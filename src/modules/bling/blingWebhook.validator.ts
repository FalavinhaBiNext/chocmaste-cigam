import { z } from 'zod';
import { ValidationError } from '@/shared/errors/AppError';

export const pedidoWebhookSchema = z.object({
  eventId: z.string().uuid(),
  date: z.string(),
  version: z.string(),
  event: z.string(),
  companyId: z.string(),
  data: z.object({
    id: z.number(),
    data: z.string(),
    numero: z.number(),
    numeroLoja: z.string(),
    total: z.number(),
    contato: z.object({ id: z.number() }),
    vendedor: z.object({ id: z.number() }).optional(),
    loja: z.object({ id: z.number() }),
    situacao: z.object({ id: z.number(), valor: z.number() }).optional(),
  }),
  mockProductId: z.string().optional(),
});

export type PedidoWebhookInput = z.infer<typeof pedidoWebhookSchema>;

export function validatePedidoWebhook(input: unknown) {
  const result = pedidoWebhookSchema.safeParse(input);

  if (!result.success) {
    throw new ValidationError('Payload do webhook inválido.', result.error.flatten());
  }

  return result.data;
}
