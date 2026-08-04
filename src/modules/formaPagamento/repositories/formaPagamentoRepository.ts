import { injectable } from 'tsyringe';
import { FormaPagamentoModel } from "../models/formaPagamentoModel";
import { IFormaPagamentoRepository } from "../interfaces/IFormaPagamentoRepository";
import { ResponseFormaPagamentoDTO, UpdateFormaPagamentoDTO } from "../dto";
import { CreateFormaPagamentoInput } from "../formaPagamento.validator";
import { FormaPagamentoMapper } from "../mappers/FormaPagamentoMapper";

@injectable()
export class FormaPagamentoRepository implements IFormaPagamentoRepository {
  async create(data: CreateFormaPagamentoInput): Promise<ResponseFormaPagamentoDTO> {
    const formaPagamento = await FormaPagamentoModel.create({
      id_bling: data.id_bling,
      descricao: data.descricao,
      tipo: data.tipo,
      id_cigam: data.id_cigam,
      active: data.active ?? true,
    });

    return FormaPagamentoMapper.formaPagamentoToDTO(formaPagamento);
  }

  async findAll(): Promise<ResponseFormaPagamentoDTO[]> {
    const formasPagamento = await FormaPagamentoModel.findAll();

    if (formasPagamento.length === 0) {
      return [];
    }

    return formasPagamento.map(FormaPagamentoMapper.formaPagamentoToDTO);
  }

  async findById(id: string): Promise<ResponseFormaPagamentoDTO | null> {
    const formaPagamento = await FormaPagamentoModel.findByPk(id);

    if (!formaPagamento) {
      return null;
    }

    return FormaPagamentoMapper.formaPagamentoToDTO(formaPagamento);
  }

  async findByIdBling(idBling: string): Promise<ResponseFormaPagamentoDTO | null> {
    const formaPagamento = await FormaPagamentoModel.findOne({
      where: { id_bling: idBling }
    });

    if (!formaPagamento) {
      return null;
    }

    return FormaPagamentoMapper.formaPagamentoToDTO(formaPagamento);
  }

  async update(id: string, data: UpdateFormaPagamentoDTO): Promise<ResponseFormaPagamentoDTO | null> {
    const formaPagamento = await FormaPagamentoModel.findByPk(id);

    if (!formaPagamento) {
      return null;
    }

    await formaPagamento.update(data);

    return FormaPagamentoMapper.formaPagamentoToDTO(formaPagamento);
  }

  async delete(id: string): Promise<void> {
    await FormaPagamentoModel.destroy({
      where: { id }
    });
  }
}
