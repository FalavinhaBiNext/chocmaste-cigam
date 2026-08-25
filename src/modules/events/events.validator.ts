import { z } from 'zod';
import { ValidationError } from '@/shared/errors/AppError';

export const createEventSchema = z.object({
  id: z.string().uuid(),
  event: z.string().min(1, 'Evento é obrigatório.'),
  company_id: z.string().min(1, 'company_id é obrigatório.'),
  pedido_id: z.number({ message: 'pedido_id deve ser um número.' }),
  data_pedido: z.string().date().optional(),
  numero_pedido: z.number({ message: 'numero_pedido deve ser um número.' }),
  numero_loja: z.string().min(1, 'numero_loja é obrigatório.'),
  total_pedido: z.number({ message: 'total_pedido deve ser um número.' }),
});

export type CreateEventInput = z.infer<typeof createEventSchema>;

export const webhookEventSchema = z.object({
  eventId: z.string().uuid().optional(),
  date: z.string().optional(),
  version: z.string().optional(),
  event: z.string().min(1, 'Evento é obrigatório.'),
  companyId: z.string().min(1, 'companyId é obrigatório.'),
  data: z.object({
    id: z.number({ message: 'pedido_id deve ser um número.' }),
    data: z.string().optional(),
    numero: z.number({ message: 'numero_pedido deve ser um número.' }),
    numeroLoja: z.string({ message: 'numero_loja deve ser uma string.' }),
    total: z.number({ message: 'total_pedido deve ser um número.' }),
    contato: z.object({ id: z.number() }).optional(),
    vendedor: z.object({ id: z.number() }).optional(),
    loja: z.object({ id: z.number() }).optional(),
    situacao: z.object({ id: z.number(), valor: z.number() }).optional(),
  }),
});

export type WebhookEventInput = z.infer<typeof webhookEventSchema>;

export const listEventsQuerySchema = z.object({
  sync_status: z.enum(['pendente', 'sincronizado', 'falha']).optional(),
});

export type ListEventsQuery = z.infer<typeof listEventsQuerySchema>;

export function validateCreateEvent(input: unknown) {
  const result = createEventSchema.safeParse(input);

  if (!result.success) {
    throw new ValidationError('Dados inválidos.', result.error.flatten());
  }

  return result.data;
}

export function validateWebhookEvent(input: unknown) {
  const result = webhookEventSchema.safeParse(input);

  if (!result.success) {
    throw new ValidationError('Dados inválidos.', result.error.flatten());
  }

  return result.data;
}

export function validateListEventsQuery(input: unknown) {
  const result = listEventsQuerySchema.safeParse(input);

  if (!result.success) {
    throw new ValidationError('Parâmetros de consulta inválidos.', result.error.flatten());
  }

  return result.data;
}
