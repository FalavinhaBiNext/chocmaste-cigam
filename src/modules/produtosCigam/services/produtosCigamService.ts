import { injectable, inject } from 'tsyringe';
import { CreateProdutosCigamInput } from "../produtosCigam.validator";
import { ResponseProdutosCigamDTO, UpdateProdutosCigamDTO } from "../dto";
import { ProdutosCigamRepository } from "../repositories/produtosCigamRepository";
import { logger } from "@/shared/utils/logger";
import { NotFoundError } from "@/shared/errors/AppError";

@injectable()
export class ProdutosCigamService {
  constructor(
    @inject(ProdutosCigamRepository) private readonly produtosCigamRepository: ProdutosCigamRepository
  ) {}

  async create(data: CreateProdutosCigamInput): Promise<ResponseProdutosCigamDTO> {
    logger.info('Starting produtos cigam creation');
    logger.event('Performing data processing');
    const produto = await this.produtosCigamRepository.create(data);
    logger.success('Produto cigam created successfully');
    return produto;
  }

  async findAll(): Promise<ResponseProdutosCigamDTO[]> {
    logger.info('Searching all produtos cigam');
    const produtos = await this.produtosCigamRepository.findAll();
    logger.success(`${produtos.length} produtos cigam retrieved`);
    return produtos;
  }

  async findById(id: string): Promise<ResponseProdutosCigamDTO> {
    logger.info(`Searching produto cigam with ID: ${id}`);
    const produto = await this.produtosCigamRepository.findById(id);
    if (!produto) {
      logger.error(`Produto cigam with ID: ${id} not found`);
      throw new NotFoundError(`Produto cigam com ID: ${id} não encontrado`);
    }
    logger.finish('Produto cigam found');
    return produto;
  }

  async findByIdCigam(idCigam: string): Promise<ResponseProdutosCigamDTO> {
    logger.info(`Searching produto cigam with Cigam ID: ${idCigam}`);
    const produto = await this.produtosCigamRepository.findByIdCigam(idCigam);
    if (!produto) {
      logger.error(`Produto cigam with Cigam ID: ${idCigam} not found`);
      throw new NotFoundError(`Produto cigam com ID Cigam: ${idCigam} não encontrado`);
    }
    logger.finish('Produto cigam found');
    return produto;
  }

  async update(id: string, data: UpdateProdutosCigamDTO): Promise<ResponseProdutosCigamDTO> {
    logger.info(`Starting update produto cigam with ID: ${id}`);
    const produtoExistence = await this.produtosCigamRepository.findById(id);
    if (!produtoExistence) {
      logger.error('Produto cigam not found');
      throw new NotFoundError(`Produto cigam com ID: ${id} não encontrado`);
    }
    const produto = await this.produtosCigamRepository.update(id, data);
    logger.finish('Produto cigam updated');
    return produto!;
  }

  async delete(id: string): Promise<void> {
    logger.info(`Deleting produto cigam with ID: ${id}`);
    const produtoExistence = await this.produtosCigamRepository.findById(id);
    if (!produtoExistence) {
      logger.error('Produto cigam not found');
      throw new NotFoundError(`Produto cigam com ID: ${id} não encontrado`);
    }
    await this.produtosCigamRepository.delete(id);
    logger.finish('Produto cigam deleted successfully');
  }
}
