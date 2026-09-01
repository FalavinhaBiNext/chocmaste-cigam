import { z } from 'zod';
import { ValidationError } from '@/shared/errors/AppError';

export const registerSchema = z.object({
    nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres.'),
    email: z.string().email('Email inválido.'),
    senha: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres.'),
    role: z.enum(['admin', 'usuario']).optional(),
});

export const loginSchema = z.object({
    email: z.string().email('Email inválido.'),
    senha: z.string().min(1, 'Senha é obrigatória.'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

export function validateRegister(input: unknown) {
    const result = registerSchema.safeParse(input);
    if (!result.success) {
        throw new ValidationError('Dados inválidos.', result.error.flatten());
    }
    return result.data;
}

export function validateLogin(input: unknown) {
    const result = loginSchema.safeParse(input);
    if (!result.success) {
        throw new ValidationError('Dados inválidos.', result.error.flatten());
    }
    return result.data;
}
