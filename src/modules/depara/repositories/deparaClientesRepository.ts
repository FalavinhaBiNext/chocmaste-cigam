import { injectable } from 'tsyringe';
import { DeParaClientesModel } from '../models/deparaClientesModel';

@injectable()
export class DeParaClientesRepository {
  async findAll(): Promise<DeParaClientesModel[]> {
    return DeParaClientesModel.findAll();
  }

  async findByIdBling(idBling: string): Promise<DeParaClientesModel | null> {
    return DeParaClientesModel.findOne({ where: { id_bling: idBling } });
  }

  async findByIdCigam(idCigam: string): Promise<DeParaClientesModel | null> {
    return DeParaClientesModel.findOne({ where: { id_cigam: idCigam } });
  }

  async create(data: { id_bling: string; id_cigam: string; nome: string }): Promise<DeParaClientesModel> {
    return DeParaClientesModel.create(data);
  }

  async deleteByIdBling(idBling: string): Promise<void> {
    await DeParaClientesModel.destroy({ where: { id_bling: idBling } });
  }
}
