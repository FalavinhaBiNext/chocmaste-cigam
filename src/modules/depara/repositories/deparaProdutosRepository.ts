import { injectable } from 'tsyringe';
import { DeParaProdutosModel } from '../models/deparaProdutosModel';

@injectable()
export class DeParaProdutosRepository {
  async findAll(): Promise<DeParaProdutosModel[]> {
    return DeParaProdutosModel.findAll();
  }

  async findByIdBling(idBling: string): Promise<DeParaProdutosModel | null> {
    return DeParaProdutosModel.findOne({ where: { id_bling: idBling } });
  }

  async findByIdCigam(idCigam: string): Promise<DeParaProdutosModel | null> {
    return DeParaProdutosModel.findOne({ where: { id_cigam: idCigam } });
  }

  async create(data: { id_bling: string; id_cigam: string; nome: string }): Promise<DeParaProdutosModel> {
    return DeParaProdutosModel.create(data);
  }

  async delete(id: string): Promise<void> {
    await DeParaProdutosModel.destroy({ where: { id } });
  }

  async deleteByIdBling(idBling: string): Promise<void> {
    await DeParaProdutosModel.destroy({ where: { id_bling: idBling } });
  }

  async deleteAll(): Promise<number> {
    return DeParaProdutosModel.destroy({ where: {} });
  }
}
