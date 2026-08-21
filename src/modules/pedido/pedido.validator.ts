import { z } from 'zod';
import { ValidationError } from '@/shared/errors/AppError';

export const createPedidoSchema = z.object({
  id_bling: z.string().min(1, 'id_bling é obrigatório.'),
  codigo_curto: z.string().min(1, 'codigo_curto é obrigatório.'),
  numero_loja: z.string().min(1, 'numero_loja é obrigatório.'),
  data_pedido: z.string().min(1, 'data_pedido é obrigatório.'),
  total_produtos: z.number({ message: 'total_produtos deve ser um número.' }),
  total_venda: z.number({ message: 'total_venda deve ser um número.' }),
  id_cliente_bling: z.string().min(1, 'id_cliente_bling é obrigatório.'),
  nome_cliente: z.string().min(1, 'nome_cliente é obrigatório.'),
  documento_cliente: z.string().min(1, 'documento_cliente é obrigatório.'),
  tipo_pessoa: z.string().min(1, 'tipo_pessoa é obrigatório.'),
  id_loja: z.string().min(1, 'id_loja é obrigatório.'),
  desconto: z.number({ message: 'desconto deve ser um número.' }),
  quantidade_itens: z.number({ message: 'quantidade_itens deve ser um número.' }),
  status_venda: z.string().min(1, 'status_venda é obrigatório.'),
  codigo_transportadora: z.string().min(1, 'codigo_transportadora é obrigatório.'),
  valor_frete: z.number({ message: 'valor_frete deve ser um número.' }),
  nome_transportadora: z.string().min(1, 'nome_transportadora é obrigatório.'),
  codigo_rastreio: z.string().min(1, 'codigo_rastreio é obrigatório.'),
  unidade_negocio: z.string().optional(),
  data_prevista: z.string().optional(),
  numero_pedido_cigam: z.string().optional(),
  marketplace: z.string().optional(),
  status_nfe: z.string().optional(),
  shipping_id: z.string().optional(),
});

export type CreatePedidoInput = z.infer<typeof createPedidoSchema>;

export function validateCreatePedido(input: unknown) {
  const result = createPedidoSchema.safeParse(input);

  if (!result.success) {
    throw new ValidationError('Dados inválidos.', result.error.flatten());
  }

  return result.data;
}
