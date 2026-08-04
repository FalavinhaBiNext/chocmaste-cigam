import { inject, injectable } from 'tsyringe';
import { CigamAuthService } from './cigamAuthService';
import { CigamRepository } from '../repositories/cigamRepository';
import { CigamAuthResponseDTO, CigamStatusResponse } from '../dto';
import { SaveTokenInput } from '../cigam.validator';
import { logger } from '@/shared/utils/logger';

@injectable()
export class CigamService {
  constructor(
    @inject(CigamAuthService) private readonly cigamAuthService: CigamAuthService,
    @inject(CigamRepository) private readonly cigamRepository: CigamRepository
  ) {}

  async authenticate(ambiente: string): Promise<CigamAuthResponseDTO> {
    logger.info(`Iniciando autenticação Cigam para ambiente: ${ambiente}`);
    return this.cigamAuthService.authenticate(ambiente);
  }

  async manualSaveToken(data: SaveTokenInput): Promise<void> {
    const existing = await this.cigamRepository.findByAmbiente(data.ambiente);

    if (existing) {
      await this.cigamRepository.update(existing.id, {
        hash: data.hash,
        expires_at: data.expires_at ? new Date(data.expires_at) : undefined,
        active: data.active,
      });
    } else {
      await this.cigamRepository.save({
        hash: data.hash,
        ambiente: data.ambiente,
        expires_at: data.expires_at ? new Date(data.expires_at) : undefined,
        active: data.active,
      });
    }

    logger.success('Hash Cigam salvo manualmente');
  }

  async getStatus(): Promise<CigamStatusResponse> {
    const ambientes = ['producao', 'homologacao'];
    let lastToken = null;
    let lastAmbiente = null;

    for (const ambiente of ambientes) {
      const token = await this.cigamRepository.findByAmbiente(ambiente);
      if (token) {
        lastToken = token;
        lastAmbiente = ambiente;
        break;
      }
    }

    if (!lastToken) {
      return {
        authenticated: false,
        ambiente: null,
        hash_expira_em: null,
        message: 'Nenhum token Cigam encontrado. Faça a autenticação primeiro.',
      };
    }

    return {
      authenticated: true,
      ambiente: lastAmbiente,
      hash_expira_em: lastToken.expires_at,
      message: 'Cigam autenticado.',
    };
  }
}