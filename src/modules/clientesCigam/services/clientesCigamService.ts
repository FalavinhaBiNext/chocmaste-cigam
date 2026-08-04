import { injectable, inject } from 'tsyringe';
import { CreateClientesCigamInput } from "../clientesCigam.validator";
import { ResponseClientesCigamDTO, UpdateClientesCigamDTO } from "../dto";
import { ClientesCigamRepository } from "../repositories/clientesCigamRepository";
import { logger } from "@/shared/utils/logger";
import { NotFoundError } from "@/shared/errors/AppError";

@injectable()
export class ClientesCigamService {
  constructor(
    @inject(ClientesCigamRepository) private readonly clientesCigamRepository: ClientesCigamRepository
  ) {}

  async create(data: CreateClientesCigamInput): Promise<ResponseClientesCigamDTO> {
    logger.info('Starting clientes cigam creation');
    logger.event('Performing data processing');
    const cliente = await this.clientesCigamRepository.create(data);
    logger.success('Cliente cigam created successfully');
    return cliente;
  }

  async findAll(): Promise<ResponseClientesCigamDTO[]> {
    logger.info('Searching all clientes cigam');
    const clientes = await this.clientesCigamRepository.findAll();
    logger.success(`${clientes.length} clientes cigam retrieved`);
    return clientes;
  }

  async findById(id: string): Promise<ResponseClientesCigamDTO> {
    logger.info(`Searching cliente cigam with ID: ${id}`);
    const cliente = await this.clientesCigamRepository.findById(id);
    if (!cliente) {
      logger.error(`Cliente cigam with ID: ${id} not found`);
      throw new NotFoundError(`Cliente cigam com ID: ${id} não encontrado`);
    }
    logger.finish('Cliente cigam found');
    return cliente;
  }

  async findByIdCigam(idCigam: string): Promise<ResponseClientesCigamDTO> {
    logger.info(`Searching cliente cigam with Cigam ID: ${idCigam}`);
    const cliente = await this.clientesCigamRepository.findByIdCigam(idCigam);
    if (!cliente) {
      logger.error(`Cliente cigam with Cigam ID: ${idCigam} not found`);
      throw new NotFoundError(`Cliente cigam com ID Cigam: ${idCigam} não encontrado`);
    }
    logger.finish('Cliente cigam found');
    return cliente;
  }

  async update(id: string, data: UpdateClientesCigamDTO): Promise<ResponseClientesCigamDTO> {
    logger.info(`Starting update cliente cigam with ID: ${id}`);
    const clienteExistence = await this.clientesCigamRepository.findById(id);
    if (!clienteExistence) {
      logger.error('Cliente cigam not found');
      throw new NotFoundError(`Cliente cigam com ID: ${id} não encontrado`);
    }
    const cliente = await this.clientesCigamRepository.update(id, data);
    logger.finish('Cliente cigam updated');
    return cliente!;
  }

  async delete(id: string): Promise<void> {
    logger.info(`Deleting cliente cigam with ID: ${id}`);
    const clienteExistence = await this.clientesCigamRepository.findById(id);
    if (!clienteExistence) {
      logger.error('Cliente cigam not found');
      throw new NotFoundError(`Cliente cigam com ID: ${id} não encontrado`);
    }
    await this.clientesCigamRepository.delete(id);
    logger.finish('Cliente cigam deleted successfully');
  }
}
