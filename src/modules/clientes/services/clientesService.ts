import { injectable, inject } from 'tsyringe';
import { CreateClientesInput } from "../clientes.validator";
import { ResponseClientesDTO, UpdateClientesDTO } from "../dto";
import { ClientesRepository } from "../repositories/clientesRepository";
import { DeParaClientesRepository } from "@/modules/depara/repositories/deparaClientesRepository";
import { logger } from "@/shared/utils/logger";
import { NotFoundError } from "@/shared/errors/AppError";

@injectable()
export class ClientesService {
  constructor(
    @inject(ClientesRepository) private readonly clientesRepository: ClientesRepository,
    @inject(DeParaClientesRepository) private readonly deParaClientesRepo: DeParaClientesRepository
  ) {}

  async create(data: CreateClientesInput): Promise<ResponseClientesDTO> {
    logger.info('Starting clientes creation');
    logger.event('Performing data processing');
    const clientes = await this.clientesRepository.create(data);
    logger.success('Clientes created successfully');
    return clientes;
  }

  async findAll(filters?: { unassociated?: boolean }): Promise<ResponseClientesDTO[]> {
    logger.info('Searching all clientes');
    let clientes = await this.clientesRepository.findAll();

    if (filters?.unassociated) {
      const mapped = await this.deParaClientesRepo.findAll();
      const mappedBlingIds = new Set(mapped.map(m => m.id_bling));
      clientes = clientes.filter(c => !c.id_bling || !mappedBlingIds.has(c.id_bling));
    }

    logger.success(`${clientes.length} clientes retrieved`);
    return clientes;
  }

  async findById(id: string): Promise<ResponseClientesDTO> {
    logger.info(`Searching clientes with ID: ${id}`);
    const clientes = await this.clientesRepository.findById(id);
    if (!clientes) {
      logger.error(`Clientes with ID: ${id} not found`);
      throw new NotFoundError(`Cliente com ID: ${id} não encontrado`);
    }
    logger.finish('Clientes found');
    return clientes;
  }

  async findByIdBling(idBling: string): Promise<ResponseClientesDTO> {
    logger.info(`Searching clientes with Bling ID: ${idBling}`);
    const clientes = await this.clientesRepository.findByIdBling(idBling);
    if (!clientes) {
      logger.error(`Clientes with Bling ID: ${idBling} not found`);
      throw new NotFoundError(`Cliente com ID Bling: ${idBling} não encontrado`);
    }
    logger.finish('Clientes found');
    return clientes;
  }

  async update(id: string, data: UpdateClientesDTO): Promise<ResponseClientesDTO> {
    logger.info(`Starting update clientes with ID: ${id}`);
    const clientesExistence = await this.clientesRepository.findById(id);
    if (!clientesExistence) {
      logger.error('Clientes not found');
      throw new NotFoundError(`Cliente com ID: ${id} não encontrado`);
    }
    const clientes = await this.clientesRepository.update(id, data);
    logger.finish('Clientes updated');
    return clientes!;
  }

  async delete(id: string): Promise<void> {
    logger.info(`Deleting clientes with ID: ${id}`);
    const clientesExistence = await this.clientesRepository.findById(id);
    if (!clientesExistence) {
      logger.error('Clientes not found');
      throw new NotFoundError(`Cliente com ID: ${id} não encontrado`);
    }
    await this.clientesRepository.delete(id);
    logger.finish('Clientes deleted successfully');
  }
}
