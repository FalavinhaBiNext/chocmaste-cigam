import { injectable } from 'tsyringe';
import { ClientesModel } from "../models/clientesModel";
import { IClientesRepository } from "../interfaces/IClientesRepository";
import { ResponseClientesDTO, UpdateClientesDTO } from "../dto";
import { CreateClientesInput } from "../clientes.validator";
import { ClientesMapper } from "../mappers/ClientesMapper";

@injectable()
export class ClientesRepository implements IClientesRepository {
  async create(data: CreateClientesInput): Promise<ResponseClientesDTO> {
    const clientes = await ClientesModel.create({
      id_bling: data.id_bling,
      id_cigam: data.id_cigam,
      nome: data.nome,
      documento: data.documento,
      telefone: data.telefone,
      celular: data.celular,
      email: data.email,
      endereco: data.endereco,
      numero: data.numero,
      complemento: data.complemento,
      bairro: data.bairro,
      cidade: data.cidade,
      uf: data.uf,
      cep: data.cep,
      active: data.active ?? true,
    });

    return ClientesMapper.clientesToDTO(clientes);
  }

  async findAll(): Promise<ResponseClientesDTO[]> {
    const clientes = await ClientesModel.findAll();

    if (clientes.length === 0) {
      return [];
    }

    return clientes.map(ClientesMapper.clientesToDTO);
  }

  async findById(id: string): Promise<ResponseClientesDTO | null> {
    const clientes = await ClientesModel.findByPk(id);

    if (!clientes) {
      return null;
    }

    return ClientesMapper.clientesToDTO(clientes);
  }

  async findByIdBling(idBling: string): Promise<ResponseClientesDTO | null> {
    const clientes = await ClientesModel.findOne({
      where: { id_bling: idBling }
    });

    if (!clientes) {
      return null;
    }

    return ClientesMapper.clientesToDTO(clientes);
  }

  async update(id: string, data: UpdateClientesDTO): Promise<ResponseClientesDTO | null> {
    const clientes = await ClientesModel.findByPk(id);

    if (!clientes) {
      return null;
    }

    await clientes.update(data);

    return ClientesMapper.clientesToDTO(clientes);
  }

  async delete(id: string): Promise<void> {
    await ClientesModel.destroy({
      where: { id }
    });
  }
}
