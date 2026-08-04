import { injectable } from 'tsyringe';
import { FormasPagamentoCigamModel } from "../models/formasPagamentoCigamModel";
import { IFormasPagamentoCigamRepository } from "../interfaces/IFormasPagamentoCigamRepository";
import { ResponseFormasPagamentoCigamDTO, UpdateFormasPagamentoCigamDTO } from "../dto";
import { CreateFormasPagamentoCigamInput } from "../formasPagamentoCigam.validator";
import { FormasPagamentoCigamMapper } from "../mappers/FormasPagamentoCigamMapper";

@injectable()
export class FormasPagamentoCigamRepository implements IFormasPagamentoCigamRepository {
  async create(data: CreateFormasPagamentoCigamInput): Promise<ResponseFormasPagamentoCigamDTO> {
    const formaPagamento = await FormasPagamentoCigamModel.create({
      id_cigam: data.id_cigam,
      descricao: data.descricao,
      tipo: data.tipo,
      ativo: data.ativo ?? true,
    });

    return FormasPagamentoCigamMapper.formasPagamentoCigamToDTO(formaPagamento);
  }

  async findAll(): Promise<ResponseFormasPagamentoCigamDTO[]> {
    const formasPagamento = await FormasPagamentoCigamModel.findAll();

    if (formasPagamento.length === 0) {
      return [];
    }

    return formasPagamento.map(FormasPagamentoCigamMapper.formasPagamentoCigamToDTO);
  }

  async findById(id: string): Promise<ResponseFormasPagamentoCigamDTO | null> {
    const formaPagamento = await FormasPagamentoCigamModel.findByPk(id);

    if (!formaPagamento) {
      return null;
    }

    return FormasPagamentoCigamMapper.formasPagamentoCigamToDTO(formaPagamento);
  }

  async findByIdCigam(idCigam: string): Promise<ResponseFormasPagamentoCigamDTO | null> {
    const formaPagamento = await FormasPagamentoCigamModel.findOne({
      where: { id_cigam: idCigam }
    });

    if (!formaPagamento) {
      return null;
    }

    return FormasPagamentoCigamMapper.formasPagamentoCigamToDTO(formaPagamento);
  }

  async update(id: string, data: UpdateFormasPagamentoCigamDTO): Promise<ResponseFormasPagamentoCigamDTO | null> {
    const formaPagamento = await FormasPagamentoCigamModel.findByPk(id);

    if (!formaPagamento) {
      return null;
    }

    await formaPagamento.update(data);

    return FormasPagamentoCigamMapper.formasPagamentoCigamToDTO(formaPagamento);
  }

  async delete(id: string): Promise<void> {
    await FormasPagamentoCigamModel.destroy({
      where: { id }
    });
  }
}
