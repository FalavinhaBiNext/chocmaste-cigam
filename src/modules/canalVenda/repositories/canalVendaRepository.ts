import { injectable } from 'tsyringe';
import { CanalVendaModel } from "../models/canalVendaModel";
import { ICanalVendaRepository } from "../interfaces/ICanalVendaRepository";
import { ResponseCanalVendaDTO, UpdateCanalVendaDTO, CreateCanalVendaDTO } from "../dto";
import { CanalVendaMapper } from "../mappers/CanalVendaMapper";

@injectable()
export class CanalVendaRepository implements ICanalVendaRepository {
  async create(data: CreateCanalVendaDTO): Promise<ResponseCanalVendaDTO> {
    const canalVenda = await CanalVendaModel.create({
      id_bling: data.id_bling,
      descricao: data.descricao,
      tipo: data.tipo,
      situacao: data.situacao,
      ativo: data.ativo ?? true,
      local_venda: data.local_venda,
      codigo_conta: data.codigo_conta,
    });

    return CanalVendaMapper.canalVendaToDTO(canalVenda);
  }

  async findAll(): Promise<ResponseCanalVendaDTO[]> {
    const canaisVenda = await CanalVendaModel.findAll();

    if (canaisVenda.length === 0) {
      return [];
    }

    return canaisVenda.map(CanalVendaMapper.canalVendaToDTO);
  }

  async findById(id: string): Promise<ResponseCanalVendaDTO | null> {
    const canalVenda = await CanalVendaModel.findByPk(id);

    if (!canalVenda) {
      return null;
    }

    return CanalVendaMapper.canalVendaToDTO(canalVenda);
  }

  async findByIdBling(idBling: string): Promise<ResponseCanalVendaDTO | null> {
    const canalVenda = await CanalVendaModel.findOne({
      where: { id_bling: idBling }
    });

    if (!canalVenda) {
      return null;
    }

    return CanalVendaMapper.canalVendaToDTO(canalVenda);
  }

  async findByLocalVenda(localVenda: string): Promise<ResponseCanalVendaDTO | null> {
    const canalVenda = await CanalVendaModel.findOne({
      where: { local_venda: localVenda }
    });

    if (!canalVenda) {
      return null;
    }

    return CanalVendaMapper.canalVendaToDTO(canalVenda);
  }

  async update(id: string, data: UpdateCanalVendaDTO): Promise<ResponseCanalVendaDTO | null> {
    const canalVenda = await CanalVendaModel.findByPk(id);

    if (!canalVenda) {
      return null;
    }

    await canalVenda.update(data);

    return CanalVendaMapper.canalVendaToDTO(canalVenda);
  }

  async delete(id: string): Promise<void> {
    await CanalVendaModel.destroy({
      where: { id }
    });
  }
}
