import { injectable, inject } from 'tsyringe';
import { CreateFormasPagamentoCigamInput } from "../formasPagamentoCigam.validator";
import { ResponseFormasPagamentoCigamDTO, UpdateFormasPagamentoCigamDTO } from "../dto";
import { FormasPagamentoCigamRepository } from "../repositories/formasPagamentoCigamRepository";
import { logger } from "@/shared/utils/logger";
import { NotFoundError } from "@/shared/errors/AppError";

@injectable()
export class FormasPagamentoCigamService {
  constructor(
    @inject(FormasPagamentoCigamRepository) private readonly formasPagamentoCigamRepository: FormasPagamentoCigamRepository
  ) {}

  async create(data: CreateFormasPagamentoCigamInput): Promise<ResponseFormasPagamentoCigamDTO> {
    logger.info('Starting forma pagamento cigam creation');
    logger.event('Performing data processing');
    const formaPagamento = await this.formasPagamentoCigamRepository.create(data);
    logger.success('Forma pagamento cigam created successfully');
    return formaPagamento;
  }

  async findAll(): Promise<ResponseFormasPagamentoCigamDTO[]> {
    logger.info('Searching all formas pagamento cigam');
    const formasPagamento = await this.formasPagamentoCigamRepository.findAll();
    logger.success(`${formasPagamento.length} formas pagamento cigam retrieved`);
    return formasPagamento;
  }

  async findById(id: string): Promise<ResponseFormasPagamentoCigamDTO> {
    logger.info(`Searching forma pagamento cigam with ID: ${id}`);
    const formaPagamento = await this.formasPagamentoCigamRepository.findById(id);
    if (!formaPagamento) {
      logger.error(`Forma pagamento cigam with ID: ${id} not found`);
      throw new NotFoundError(`Forma pagamento cigam com ID: ${id} não encontrada`);
    }
    logger.finish('Forma pagamento cigam found');
    return formaPagamento;
  }

  async findByIdCigam(idCigam: string): Promise<ResponseFormasPagamentoCigamDTO> {
    logger.info(`Searching forma pagamento cigam with Cigam ID: ${idCigam}`);
    const formaPagamento = await this.formasPagamentoCigamRepository.findByIdCigam(idCigam);
    if (!formaPagamento) {
      logger.error(`Forma pagamento cigam with Cigam ID: ${idCigam} not found`);
      throw new NotFoundError(`Forma pagamento cigam com ID Cigam: ${idCigam} não encontrada`);
    }
    logger.finish('Forma pagamento cigam found');
    return formaPagamento;
  }

  async update(id: string, data: UpdateFormasPagamentoCigamDTO): Promise<ResponseFormasPagamentoCigamDTO> {
    logger.info(`Starting update forma pagamento cigam with ID: ${id}`);
    const formaPagamentoExistence = await this.formasPagamentoCigamRepository.findById(id);
    if (!formaPagamentoExistence) {
      logger.error('Forma pagamento cigam not found');
      throw new NotFoundError(`Forma pagamento cigam com ID: ${id} não encontrada`);
    }
    const formaPagamento = await this.formasPagamentoCigamRepository.update(id, data);
    logger.finish('Forma pagamento cigam updated');
    return formaPagamento!;
  }

  async delete(id: string): Promise<void> {
    logger.info(`Deleting forma pagamento cigam with ID: ${id}`);
    const formaPagamentoExistence = await this.formasPagamentoCigamRepository.findById(id);
    if (!formaPagamentoExistence) {
      logger.error('Forma pagamento cigam not found');
      throw new NotFoundError(`Forma pagamento cigam com ID: ${id} não encontrada`);
    }
    await this.formasPagamentoCigamRepository.delete(id);
    logger.finish('Forma pagamento cigam deleted successfully');
  }
}
