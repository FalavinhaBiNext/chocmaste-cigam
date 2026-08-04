import { injectable, inject } from 'tsyringe';
import { CreateFormaPagamentoInput } from "../formaPagamento.validator";
import { ResponseFormaPagamentoDTO, UpdateFormaPagamentoDTO } from "../dto";
import { FormaPagamentoRepository } from "../repositories/formaPagamentoRepository";
import { DeParaFormasPagamentoRepository } from "@/modules/depara/repositories/deparaFormasPagamentoRepository";
import { logger } from "@/shared/utils/logger";
import { NotFoundError } from "@/shared/errors/AppError";

@injectable()
export class FormaPagamentoService {
  constructor(
    @inject(FormaPagamentoRepository) private readonly formaPagamentoRepository: FormaPagamentoRepository,
    @inject(DeParaFormasPagamentoRepository) private readonly deParaFormasPagamentoRepo: DeParaFormasPagamentoRepository
  ) {}

  async create(data: CreateFormaPagamentoInput): Promise<ResponseFormaPagamentoDTO> {
    logger.info('Starting forma pagamento creation');
    logger.event('Performing data processing');
    const formaPagamento = await this.formaPagamentoRepository.create(data);
    logger.success('Forma pagamento created successfully');
    return formaPagamento;
  }

  async findAll(filters?: { unassociated?: boolean }): Promise<ResponseFormaPagamentoDTO[]> {
    logger.info('Searching all formas pagamento');
    let formasPagamento = await this.formaPagamentoRepository.findAll();

    if (filters?.unassociated) {
      const mapped = await this.deParaFormasPagamentoRepo.findAll();
      const mappedBlingIds = new Set(mapped.map(m => m.id_bling));
      formasPagamento = formasPagamento.filter(f => !f.id_bling || !mappedBlingIds.has(f.id_bling));
    }

    logger.success(`${formasPagamento.length} formas pagamento retrieved`);
    return formasPagamento;
  }

  async findById(id: string): Promise<ResponseFormaPagamentoDTO> {
    logger.info(`Searching forma pagamento with ID: ${id}`);
    const formaPagamento = await this.formaPagamentoRepository.findById(id);
    if (!formaPagamento) {
      logger.error(`Forma pagamento with ID: ${id} not found`);
      throw new NotFoundError(`Forma pagamento com ID: ${id} não encontrada`);
    }
    logger.finish('Forma pagamento found');
    return formaPagamento;
  }

  async findByIdBling(idBling: string): Promise<ResponseFormaPagamentoDTO> {
    logger.info(`Searching forma pagamento with Bling ID: ${idBling}`);
    const formaPagamento = await this.formaPagamentoRepository.findByIdBling(idBling);
    if (!formaPagamento) {
      logger.error(`Forma pagamento with Bling ID: ${idBling} not found`);
      throw new NotFoundError(`Forma pagamento com ID Bling: ${idBling} não encontrada`);
    }
    logger.finish('Forma pagamento found');
    return formaPagamento;
  }

  async update(id: string, data: UpdateFormaPagamentoDTO): Promise<ResponseFormaPagamentoDTO> {
    logger.info(`Starting update forma pagamento with ID: ${id}`);
    const formaPagamentoExistence = await this.formaPagamentoRepository.findById(id);
    if (!formaPagamentoExistence) {
      logger.error('Forma pagamento not found');
      throw new NotFoundError(`Forma pagamento com ID: ${id} não encontrada`);
    }
    const formaPagamento = await this.formaPagamentoRepository.update(id, data);
    logger.finish('Forma pagamento updated');
    return formaPagamento!;
  }

  async delete(id: string): Promise<void> {
    logger.info(`Deleting forma pagamento with ID: ${id}`);
    const formaPagamentoExistence = await this.formaPagamentoRepository.findById(id);
    if (!formaPagamentoExistence) {
      logger.error('Forma pagamento not found');
      throw new NotFoundError(`Forma pagamento com ID: ${id} não encontrada`);
    }
    await this.formaPagamentoRepository.delete(id);
    logger.finish('Forma pagamento deleted successfully');
  }
}
