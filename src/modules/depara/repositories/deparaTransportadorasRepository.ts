import { injectable } from 'tsyringe';
import { DeParaTransportadorasModel } from '../models/deparaTransportadorasModel';

@injectable()
export class DeParaTransportadorasRepository {
  async findAll(): Promise<DeParaTransportadorasModel[]> {
    return DeParaTransportadorasModel.findAll();
  }

  async findByIdBling(idBling: string): Promise<DeParaTransportadorasModel | null> {
    return DeParaTransportadorasModel.findOne({ where: { id_bling: idBling } });
  }

  async findByIdCigam(idCigam: string): Promise<DeParaTransportadorasModel | null> {
    return DeParaTransportadorasModel.findOne({ where: { id_cigam: idCigam } });
  }

  async create(data: { id_bling: string; id_cigam: string; nome: string }): Promise<DeParaTransportadorasModel> {
    return DeParaTransportadorasModel.create(data);
  }

  async deleteByIdBling(idBling: string): Promise<void> {
    await DeParaTransportadorasModel.destroy({ where: { id_bling: idBling } });
  }
}
