import { injectable, inject } from 'tsyringe';
import { ConfiguracoesRepository } from '../repositories/configuracoesRepository';

@injectable()
export class ConfiguracoesService {
  constructor(
    @inject(ConfiguracoesRepository) private readonly configuracoesRepo: ConfiguracoesRepository
  ) {}

  async getEnvioAutomaticoCigam(): Promise<boolean> {
    const config = await this.configuracoesRepo.findByChave('envio_automatico_cigam');
    return config?.valor === 'true';
  }

  async setEnvioAutomaticoCigam(ativo: boolean): Promise<void> {
    await this.configuracoesRepo.upsert(
      'envio_automatico_cigam',
      ativo ? 'true' : 'false',
      'Ativar ou desativar o envio automático de pedidos para o CIGAM'
    );
  }

  async findAll() {
    return this.configuracoesRepo.findAll();
  }
}
