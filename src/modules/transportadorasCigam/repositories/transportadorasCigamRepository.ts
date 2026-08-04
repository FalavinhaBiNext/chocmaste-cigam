import { injectable } from 'tsyringe';
import { TransportadorasCigamModel } from "../models/transportadorasCigamModel";
import { ITransportadorasCigamRepository } from "../interfaces/ITransportadorasCigamRepository";
import { ResponseTransportadorasCigamDTO, UpdateTransportadorasCigamDTO } from "../dto";
import { CreateTransportadorasCigamInput } from "../transportadorasCigam.validator";
import { TransportadorasCigamMapper } from "../mappers/TransportadorasCigamMapper";

@injectable()
export class TransportadorasCigamRepository implements ITransportadorasCigamRepository {
  async create(data: CreateTransportadorasCigamInput): Promise<ResponseTransportadorasCigamDTO> {
    const transportadora = await TransportadorasCigamModel.create({
      id_cigam: data.id_cigam,
      nome: data.nome,
      fantasia: data.fantasia ?? '',
      documento: data.documento ?? '',
      codigo_divisao: data.codigo_divisao ?? "70",
      ativo: data.ativo ?? true,
    });

    return TransportadorasCigamMapper.transportadorasCigamToDTO(transportadora);
  }

  async findAll(): Promise<ResponseTransportadorasCigamDTO[]> {
    const transportadoras = await TransportadorasCigamModel.findAll();

    if (transportadoras.length === 0) {
      return [];
    }

    return transportadoras.map(TransportadorasCigamMapper.transportadorasCigamToDTO);
  }

  async findById(id: string): Promise<ResponseTransportadorasCigamDTO | null> {
    const transportadora = await TransportadorasCigamModel.findByPk(id);

    if (!transportadora) {
      return null;
    }

    return TransportadorasCigamMapper.transportadorasCigamToDTO(transportadora);
  }

  async findByIdCigam(idCigam: string): Promise<ResponseTransportadorasCigamDTO | null> {
    const transportadora = await TransportadorasCigamModel.findOne({
      where: { id_cigam: idCigam }
    });

    if (!transportadora) {
      return null;
    }

    return TransportadorasCigamMapper.transportadorasCigamToDTO(transportadora);
  }

  async update(id: string, data: UpdateTransportadorasCigamDTO): Promise<ResponseTransportadorasCigamDTO | null> {
    const transportadora = await TransportadorasCigamModel.findByPk(id);

    if (!transportadora) {
      return null;
    }

    await transportadora.update(data);

    return TransportadorasCigamMapper.transportadorasCigamToDTO(transportadora);
  }

  async delete(id: string): Promise<void> {
    await TransportadorasCigamModel.destroy({
      where: { id }
    });
  }
}
