import { injectable, inject } from 'tsyringe';
import { CreateTransportadorasCigamInput } from "../transportadorasCigam.validator";
import { ResponseTransportadorasCigamDTO, UpdateTransportadorasCigamDTO } from "../dto";
import { TransportadorasCigamRepository } from "../repositories/transportadorasCigamRepository";
import { logger } from "@/shared/utils/logger";
import { NotFoundError } from "@/shared/errors/AppError";

@injectable()
export class TransportadorasCigamService {
  constructor(
    @inject(TransportadorasCigamRepository) private readonly transportadorasCigamRepository: TransportadorasCigamRepository
  ) {}

  async create(data: CreateTransportadorasCigamInput): Promise<ResponseTransportadorasCigamDTO> {
    logger.info('Starting transportadora cigam creation');
    logger.event('Performing data processing');
    const transportadora = await this.transportadorasCigamRepository.create(data);
    logger.success('Transportadora cigam created successfully');
    return transportadora;
  }

  async findAll(): Promise<ResponseTransportadorasCigamDTO[]> {
    logger.info('Searching all transportadoras cigam');
    const transportadoras = await this.transportadorasCigamRepository.findAll();
    logger.success(`${transportadoras.length} transportadoras cigam retrieved`);
    return transportadoras;
  }

  async findById(id: string): Promise<ResponseTransportadorasCigamDTO> {
    logger.info(`Searching transportadora cigam with ID: ${id}`);
    const transportadora = await this.transportadorasCigamRepository.findById(id);
    if (!transportadora) {
      logger.error(`Transportadora cigam with ID: ${id} not found`);
      throw new NotFoundError(`Transportadora cigam com ID: ${id} não encontrada`);
    }
    logger.finish('Transportadora cigam found');
    return transportadora;
  }

  async findByIdCigam(idCigam: string): Promise<ResponseTransportadorasCigamDTO> {
    logger.info(`Searching transportadora cigam with Cigam ID: ${idCigam}`);
    const transportadora = await this.transportadorasCigamRepository.findByIdCigam(idCigam);
    if (!transportadora) {
      logger.error(`Transportadora cigam with Cigam ID: ${idCigam} not found`);
      throw new NotFoundError(`Transportadora cigam com ID Cigam: ${idCigam} não encontrada`);
    }
    logger.finish('Transportadora cigam found');
    return transportadora;
  }

  async update(id: string, data: UpdateTransportadorasCigamDTO): Promise<ResponseTransportadorasCigamDTO> {
    logger.info(`Starting update transportadora cigam with ID: ${id}`);
    const transportadoraExistence = await this.transportadorasCigamRepository.findById(id);
    if (!transportadoraExistence) {
      logger.error('Transportadora cigam not found');
      throw new NotFoundError(`Transportadora cigam com ID: ${id} não encontrada`);
    }
    const transportadora = await this.transportadorasCigamRepository.update(id, data);
    logger.finish('Transportadora cigam updated');
    return transportadora!;
  }

  async delete(id: string): Promise<void> {
    logger.info(`Deleting transportadora cigam with ID: ${id}`);
    const transportadoraExistence = await this.transportadorasCigamRepository.findById(id);
    if (!transportadoraExistence) {
      logger.error('Transportadora cigam not found');
      throw new NotFoundError(`Transportadora cigam com ID: ${id} não encontrada`);
    }
    await this.transportadorasCigamRepository.delete(id);
    logger.finish('Transportadora cigam deleted successfully');
  }
}
