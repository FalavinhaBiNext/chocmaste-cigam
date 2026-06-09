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

export function validateCreateEvent(input: unknown) {
  const result = createEventSchema.safeParse(input);

  if (!result.success) {
    throw new ValidationError('Dados inválidos.', result.error.flatten());
  }

  return result.data;
}
