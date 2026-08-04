import { z } from 'zod';
import { ValidationError } from '@/shared/errors/AppError';

export const createProdutoSchema = z.object({
  id_bling: z.string().optional(),
  id_produto: z.string().optional(),
  nome: z.string().min(1, 'nome é obrigatório.'),
  codigo: z.string().optional(),
  preco: z.number({ message: 'preco deve ser um número.' }),
  tipo: z.string().optional(),
  situacao: z.string().optional(),
  formato: z.string().optional(),
  descricaoCurta: z.string().optional(),
  unidade: z.string().optional(),
  tipoProduto: z.string().optional(),
  condicao: z.number().optional(),
  marca: z.string().optional(),
  categoria_id: z.number().optional(),
  fornecedor_id: z.number().optional(),
  fornecedor_nome: z.string().optional(),
  fornecedor_codigo: z.string().optional(),
  fornecedor_precoCusto: z.number().optional(),
  ncm: z.string().optional(),
  temVariacoes: z.boolean().optional().default(false),
  quantidade_estoque: z.number({ message: 'quantidade_estoque deve ser um número.' }).optional().default(0),
  ativo: z.boolean().optional().default(true),
});

export type CreateProdutoInput = z.infer<typeof createProdutoSchema>;

export function validateCreateProduto(input: unknown) {
  const result = createProdutoSchema.safeParse(input);

  if (!result.success) {
    throw new ValidationError('Dados inválidos.', result.error.flatten());
  }

  return result.data;
}
