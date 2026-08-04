import { z } from 'zod';
import { ValidationError } from '@/shared/errors/AppError';

export const cadastrarMaterialSchema = z.object({
  codigoGrupo: z.string().min(1, 'codigoGrupo é obrigatório.'),
  codigoSubGrupo: z.string().min(1, 'codigoSubGrupo é obrigatório.'),
  codigoMaterial: z.string().min(1, 'codigoMaterial é obrigatório.'),
  descricao: z.string().min(1, 'descricao é obrigatória.'),
  tipo: z.string().min(1, 'tipo é obrigatório.'),
  codigoUnidadeMedida: z.string().min(1, 'codigoUnidadeMedida é obrigatório.'),
  utilizaGrade: z.string().min(1, 'utilizaGrade é obrigatório.'),
  grade: z.string().optional(),
});

export type CadastrarMaterialInput = z.infer<typeof cadastrarMaterialSchema>;

export function validateCadastrarMaterial(input: unknown) {
  const result = cadastrarMaterialSchema.safeParse(input);

  if (!result.success) {
    throw new ValidationError('Dados inválidos.', result.error.flatten());
  }

  return result.data;
}

export const cadastrarEmapearSchema = z.object({
  codigoGrupo: z.string().min(1, 'codigoGrupo é obrigatório.'),
  codigoSubGrupo: z.string().min(1, 'codigoSubGrupo é obrigatório.'),
  codigoMaterial: z.string().min(1, 'codigoMaterial é obrigatório.'),
  descricao: z.string().min(1, 'descricao é obrigatória.'),
  tipo: z.string().min(1, 'tipo é obrigatório.'),
  codigoUnidadeMedida: z.string().min(1, 'codigoUnidadeMedida é obrigatório.'),
  utilizaGrade: z.string().min(1, 'utilizaGrade é obrigatório.'),
  grade: z.string().optional(),
  idProdutoLocal: z.string().optional(),
  nomeProduto: z.string().min(1, 'nomeProduto é obrigatório.'),
  preco: z.number().optional(),
});

export type CadastrarEmapearInput = z.infer<typeof cadastrarEmapearSchema>;

export function validateCadastrarEmapear(input: unknown) {
  const result = cadastrarEmapearSchema.safeParse(input);

  if (!result.success) {
    throw new ValidationError('Dados inválidos.', result.error.flatten());
  }

  return result.data;
}
