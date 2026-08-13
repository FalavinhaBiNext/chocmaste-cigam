import { injectable } from 'tsyringe';
import { ConfiguracoesModel } from '../models/configuracoesModel';

@injectable()
export class ConfiguracoesRepository {
  async findByChave(chave: string): Promise<ConfiguracoesModel | null> {
    return ConfiguracoesModel.findOne({ where: { chave } });
  }

  async findAll(): Promise<ConfiguracoesModel[]> {
    return ConfiguracoesModel.findAll();
  }

  async upsert(chave: string, valor: string, descricao?: string): Promise<ConfiguracoesModel> {
    const existing = await this.findByChave(chave);
    if (existing) {
      await existing.update({ valor });
      return existing;
    }
    return ConfiguracoesModel.create({ chave, valor, descricao });
  }
}
