import { injectable, inject } from 'tsyringe';
import { CreateTransportadoraInput } from "../transportadora.validator";
import { ResponseTransportadoraDTO, UpdateTransportadoraDTO } from "../dto";
import { TransportadoraRepository } from "../repositories/transportadoraRepository";
import { DeParaTransportadorasRepository } from "@/modules/depara/repositories/deparaTransportadorasRepository";
import { logger } from "@/shared/utils/logger";
import { NotFoundError } from "@/shared/errors/AppError";

@injectable()
export class TransportadoraService {
  constructor(
    @inject(TransportadoraRepository) private readonly transportadoraRepository: TransportadoraRepository,
    @inject(DeParaTransportadorasRepository) private readonly deParaTransportadorasRepo: DeParaTransportadorasRepository
  ) {}

  async create(data: CreateTransportadoraInput): Promise<ResponseTransportadoraDTO> {
    logger.info('Starting transportadora creation');
    logger.event('Performing data processing');
    const transportadora = await this.transportadoraRepository.create(data);
    logger.success('Transportadora created successfully');
    return transportadora;
  }

  async findAll(filters?: { unassociated?: boolean }): Promise<ResponseTransportadoraDTO[]> {
    logger.info('Searching all transportadoras');
    let transportadoras = await this.transportadoraRepository.findAll();

    if (filters?.unassociated) {
      const mapped = await this.deParaTransportadorasRepo.findAll();
      const mappedBlingIds = new Set(mapped.map(m => m.id_bling));
      transportadoras = transportadoras.filter(t => !t.id_bling || !mappedBlingIds.has(t.id_bling));
    }

    logger.success(`${transportadoras.length} transportadoras retrieved`);
    return transportadoras;
  }

  async findById(id: string): Promise<ResponseTransportadoraDTO> {
    logger.info(`Searching transportadora with ID: ${id}`);
    const transportadora = await this.transportadoraRepository.findById(id);
    if (!transportadora) {
      logger.error(`Transportadora with ID: ${id} not found`);
      throw new NotFoundError(`Transportadora com ID: ${id} não encontrada`);
    }
    logger.finish('Transportadora found');
    return transportadora;
  }

  async findByIdBling(idBling: string): Promise<ResponseTransportadoraDTO> {
    logger.info(`Searching transportadora with Bling ID: ${idBling}`);
    const transportadora = await this.transportadoraRepository.findByIdBling(idBling);
    if (!transportadora) {
      logger.error(`Transportadora with Bling ID: ${idBling} not found`);
      throw new NotFoundError(`Transportadora com ID Bling: ${idBling} não encontrada`);
    }
    logger.finish('Transportadora found');
    return transportadora;
  }

  async update(id: string, data: UpdateTransportadoraDTO): Promise<ResponseTransportadoraDTO> {
    logger.info(`Starting update transportadora with ID: ${id}`);
    const transportadoraExistence = await this.transportadoraRepository.findById(id);
    if (!transportadoraExistence) {
      logger.error('Transportadora not found');
      throw new NotFoundError(`Transportadora com ID: ${id} não encontrada`);
    }
    const transportadora = await this.transportadoraRepository.update(id, data);
    logger.finish('Transportadora updated');
    return transportadora!;
  }

  async delete(id: string): Promise<void> {
    logger.info(`Deleting transportadora with ID: ${id}`);
    const transportadoraExistence = await this.transportadoraRepository.findById(id);
    if (!transportadoraExistence) {
      logger.error('Transportadora not found');
      throw new NotFoundError(`Transportadora com ID: ${id} não encontrada`);
    }
    await this.transportadoraRepository.delete(id);
    logger.finish('Transportadora deleted successfully');
  }
}
