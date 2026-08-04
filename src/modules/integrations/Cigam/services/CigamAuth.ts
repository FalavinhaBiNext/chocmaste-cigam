import axios from 'axios';
import { UsuarioCigamService } from '@/modules/usuarioCigam/services/usuarioCigamService';
import { inject, injectable } from 'tsyringe';
import { logger } from '@/shared/utils/logger';
import { BadRequestError, NotFoundError } from '@/shared/errors/AppError';
import https from 'https'


@injectable()
export class CigamAuthService {
    constructor(
        @inject(UsuarioCigamService)
        private readonly usuarioCigamService: UsuarioCigamService
    ) { }

    async authenticate(id_empresa: string): Promise<string> {
        logger.info('Searching usuario cigam by env')
        const usuarioCigam = await this.usuarioCigamService.findById(id_empresa)

        if (!usuarioCigam) {
            logger.error('Usuario Cigam not found')
            throw new NotFoundError('Usuario Cigam not Found')
        }

        const login = usuarioCigam.login
        const senha = usuarioCigam.senha
        const url_ambiente = usuarioCigam.url_ambiente

        const httpsAgent =
            process.env.NODE_ENV !== "production"
                ? new https.Agent({ rejectUnauthorized: false })
                : undefined;

        const payload = {
            NomeUsuario: login,
            Senha: senha
        }

        try {
            const data = await axios.post(`${url_ambiente}/API/api/genericos/ge/Login/Autenticar`, payload, {
                httpsAgent,
                headers: {
                    "Content-Type": "application/json"
                }
            })
            logger.success('Login successfully')
            return data.data.hash
        }
        catch (error) {
            logger.error('Error Login CIGAM', error)
            throw new BadRequestError('Erro Login CIGAM')
        }
    }
}