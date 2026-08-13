import { injectable } from 'tsyringe';
import { DeParaUnidadesNegocioModel } from '../models/deparaUnidadesNegocioModel';

@injectable()
export class DeParaUnidadesNegocioRepository {
  async findAll(): Promise<DeParaUnidadesNegocioModel[]> {
    return DeParaUnidadesNegocioModel.findAll();
  }

  async findByCompanyIdBling(companyIdBling: string): Promise<DeParaUnidadesNegocioModel | null> {
    return DeParaUnidadesNegocioModel.findOne({ where: { company_id_bling: companyIdBling } });
  }

  async findByUnidadeNegocio(unidadeNegocio: string): Promise<DeParaUnidadesNegocioModel | null> {
    return DeParaUnidadesNegocioModel.findOne({ where: { unidade_negocio: unidadeNegocio } });
  }

  async create(data: { company_id_bling: string; unidade_negocio: string; nome: string }): Promise<DeParaUnidadesNegocioModel> {
    return DeParaUnidadesNegocioModel.create(data);
  }

  async update(id: string, data: { unidade_negocio?: string; nome?: string; ativo?: boolean }): Promise<void> {
    await DeParaUnidadesNegocioModel.update(data, { where: { id } });
  }

  async deleteById(id: string): Promise<void> {
    await DeParaUnidadesNegocioModel.destroy({ where: { id } });
  }
}
