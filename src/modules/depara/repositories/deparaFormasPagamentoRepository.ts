import { injectable } from 'tsyringe';
import { DeParaFormasPagamentoModel } from '../models/deparaFormasPagamentoModel';

@injectable()
export class DeParaFormasPagamentoRepository {
  async findAll(): Promise<DeParaFormasPagamentoModel[]> {
    return DeParaFormasPagamentoModel.findAll();
  }

  async findByIdBling(idBling: string): Promise<DeParaFormasPagamentoModel | null> {
    return DeParaFormasPagamentoModel.findOne({ where: { id_bling: idBling } });
  }

  async findByIdCigam(idCigam: string): Promise<DeParaFormasPagamentoModel | null> {
    return DeParaFormasPagamentoModel.findOne({ where: { id_cigam: idCigam } });
  }

  async create(data: { id_bling: string; id_cigam: string; nome: string }): Promise<DeParaFormasPagamentoModel> {
    return DeParaFormasPagamentoModel.create(data);
  }

  async deleteByIdBling(idBling: string): Promise<void> {
    await DeParaFormasPagamentoModel.destroy({ where: { id_bling: idBling } });
  }
}
