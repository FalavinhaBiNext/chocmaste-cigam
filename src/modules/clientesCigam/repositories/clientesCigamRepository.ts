import { injectable } from 'tsyringe';
import { ClientesCigamModel } from "../models/clientesCigamModel";
import { IClientesCigamRepository } from "../interfaces/IClientesCigamRepository";
import { ResponseClientesCigamDTO, UpdateClientesCigamDTO } from "../dto";
import { CreateClientesCigamInput } from "../clientesCigam.validator";
import { ClientesCigamMapper } from "../mappers/ClientesCigamMapper";

@injectable()
export class ClientesCigamRepository implements IClientesCigamRepository {
  async create(data: CreateClientesCigamInput): Promise<ResponseClientesCigamDTO> {
    const cliente = await ClientesCigamModel.create({
      id_cigam: data.id_cigam,
      nome: data.nome,
      documento: data.documento,
      tipo_pessoa: data.tipo_pessoa,
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
      ativo: data.ativo ?? true,
    });

    return ClientesCigamMapper.clientesCigamToDTO(cliente);
  }

  async findAll(): Promise<ResponseClientesCigamDTO[]> {
    const clientes = await ClientesCigamModel.findAll();

    if (clientes.length === 0) {
      return [];
    }

    return clientes.map(ClientesCigamMapper.clientesCigamToDTO);
  }

  async findById(id: string): Promise<ResponseClientesCigamDTO | null> {
    const cliente = await ClientesCigamModel.findByPk(id);

    if (!cliente) {
      return null;
    }

    return ClientesCigamMapper.clientesCigamToDTO(cliente);
  }

  async findByIdCigam(idCigam: string): Promise<ResponseClientesCigamDTO | null> {
    const cliente = await ClientesCigamModel.findOne({
      where: { id_cigam: idCigam }
    });

    if (!cliente) {
      return null;
    }

    return ClientesCigamMapper.clientesCigamToDTO(cliente);
  }

  async update(id: string, data: UpdateClientesCigamDTO): Promise<ResponseClientesCigamDTO | null> {
    const cliente = await ClientesCigamModel.findByPk(id);

    if (!cliente) {
      return null;
    }

    await cliente.update(data);

    return ClientesCigamMapper.clientesCigamToDTO(cliente);
  }

  async delete(id: string): Promise<void> {
    await ClientesCigamModel.destroy({
      where: { id }
    });
  }
}
