import { z } from 'zod';
import { ValidationError } from '@/shared/errors/AppError';

export const createPedidoProdutoSchema = z.object({
  id_pedido: z.string().uuid('id_pedido deve ser um UUID válido.'),
  id_produto: z.string().uuid('id_produto deve ser um UUID válido.'),
  quantidade: z.number({ message: 'quantidade deve ser um número.' }).int().positive('quantidade deve ser positiva.'),
  preco: z.number({ message: 'preco deve ser um número.' }).positive('preco deve ser positivo.'),
  total: z.number({ message: 'total deve ser um número.' }).positive('total deve ser positivo.'),
});

export type CreatePedidoProdutoInput = z.infer<typeof createPedidoProdutoSchema>;

export function validateCreatePedidoProduto(input: unknown) {
  const result = createPedidoProdutoSchema.safeParse(input);

  if (!result.success) {
    throw new ValidationError('Dados inválidos.', result.error.flatten());
  }

  return result.data;
}
