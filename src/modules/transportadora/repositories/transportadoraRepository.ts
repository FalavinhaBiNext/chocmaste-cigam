import { injectable } from 'tsyringe';
import { TransportadoraModel } from "../models/transportadoraModel";
import { ITransportadoraRepository } from "../interfaces/ITransportadoraRepository";
import { ResponseTransportadoraDTO, UpdateTransportadoraDTO } from "../dto";
import { CreateTransportadoraInput } from "../transportadora.validator";
import { TransportadoraMapper } from "../mappers/TransportadoraMapper";

@injectable()
export class TransportadoraRepository implements ITransportadoraRepository {
  async create(data: CreateTransportadoraInput): Promise<ResponseTransportadoraDTO> {
    const transportadora = await TransportadoraModel.create({
      id_bling: data.id_bling,
      nome: data.nome,
      fantasia: data.fantasia ?? '',
      documento: data.documento ?? '',
      active: data.active ?? true,
    });

    return TransportadoraMapper.transportadoraToDTO(transportadora);
  }

  async findAll(): Promise<ResponseTransportadoraDTO[]> {
    const transportadoras = await TransportadoraModel.findAll();

    if (transportadoras.length === 0) {
      return [];
    }

    return transportadoras.map(TransportadoraMapper.transportadoraToDTO);
  }

  async findById(id: string): Promise<ResponseTransportadoraDTO | null> {
    const transportadora = await TransportadoraModel.findByPk(id);

    if (!transportadora) {
      return null;
    }

    return TransportadoraMapper.transportadoraToDTO(transportadora);
  }

  async findByIdBling(idBling: string): Promise<ResponseTransportadoraDTO | null> {
    const transportadora = await TransportadoraModel.findOne({
      where: { id_bling: idBling }
    });

    if (!transportadora) {
      return null;
    }

    return TransportadoraMapper.transportadoraToDTO(transportadora);
  }

  async update(id: string, data: UpdateTransportadoraDTO): Promise<ResponseTransportadoraDTO | null> {
    const transportadora = await TransportadoraModel.findByPk(id);

    if (!transportadora) {
      return null;
    }

    await transportadora.update(data);

    return TransportadoraMapper.transportadoraToDTO(transportadora);
  }

  async delete(id: string): Promise<void> {
    await TransportadoraModel.destroy({
      where: { id }
    });
  }
}
