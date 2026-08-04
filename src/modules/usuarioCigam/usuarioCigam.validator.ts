import { z } from "zod";
import { ValidationError } from "@/shared/errors/AppError";

export const createUsuarioCigamSchema = z.object({
    ambiente: z.string().min(1, 'Ambiente Obrigatório para cadastro do usuário Cigam'),
    login: z.string().min(1, 'Login para acesso ao CIGAM é Obrigatório'),
    senha: z.string().min(1, 'Senha para acesso ao CIGAM é Obrigatório'),
    url_ambiente: z.string().min(1, 'Url do ambiente é Obrigatório para cadastro')
})

export type CreateUsuarioCigamInput = z.infer<typeof createUsuarioCigamSchema>;

export function validateCreateUsuarioCigam(input: unknown) {
    const result = createUsuarioCigamSchema.safeParse(input);

    if( !result.success ){
        throw new ValidationError('Dados inválidos.', result.error.flatten());
    }

    return result.data
}