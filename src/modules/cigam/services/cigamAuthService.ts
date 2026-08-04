import { inject, injectable } from 'tsyringe';
import axios from 'axios';
import https from 'https';
import { UsuarioCigamService } from '@/modules/usuarioCigam/services/usuarioCigamService';
import { CigamRepository } from '../repositories/cigamRepository';
import { CigamAuthResponseDTO } from '../dto';
import { logger } from '@/shared/utils/logger';
import { NotFoundError, IntegrationError } from '@/shared/errors/AppError';

@injectable()
export class CigamAuthService {
  constructor(
    @inject(UsuarioCigamService)
    private readonly usuarioCigamService: UsuarioCigamService,
    @inject(CigamRepository)
    private readonly cigamRepository: CigamRepository
  ) {}

  async authenticate(ambiente: string): Promise<CigamAuthResponseDTO> {
    logger.info(`Buscando configurações do Cigam para ambiente: ${ambiente}`);

    const usuarioCigam = await this.usuarioCigamService.findByEnv(ambiente);

    if (!usuarioCigam) {
      logger.error(`Configuração Cigam não encontrada para ambiente: ${ambiente}`);
      throw new NotFoundError(`Configuração Cigam não encontrada para ambiente: ${ambiente}`);
    }

    const { login, senha, url_ambiente } = usuarioCigam;

    const httpsAgent =
      process.env.NODE_ENV !== "production"
        ? new https.Agent({ rejectUnauthorized: false })
        : undefined;

    const payload = {
      NomeUsuario: login,
      Senha: senha
    };

    logger.auth(`Autenticando no Cigam em: ${url_ambiente}`);

    try {
      const response = await axios.post(
        `${url_ambiente}/API/api/genericos/ge/Login/Autenticar`,
        payload,
        {
          httpsAgent,
          headers: {
            "Content-Type": "application/json"
          },
          timeout: 15000
        }
      );

      const hash = response.data?.hash;

      if (!hash) {
        throw new IntegrationError('Resposta de autenticação Cigam não contém hash.');
      }

      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 2);

      const existing = await this.cigamRepository.findByAmbiente(ambiente);
      if (existing) {
        await this.cigamRepository.update(existing.id, {
          hash,
          expires_at: expiresAt
        });
      } else {
        await this.cigamRepository.save({
          hash,
          ambiente,
          expires_at: expiresAt
        });
      }

      logger.success('Autenticação Cigam realizada com sucesso');

      return {
        hash,
        expiresAt: expiresAt.toISOString()
      };
    } catch (error: any) {
      logger.error('Falha na autenticação Cigam', {
        status: error.response?.status,
        message: error.response?.data || error.message
      });

      throw new IntegrationError(
        `Falha na autenticação Cigam: ${error.response?.data?.message || error.message}`
      );
    }
  }
}