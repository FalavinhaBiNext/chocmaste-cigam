import { injectable, inject } from 'tsyringe';
import { CreatePedidoProdutoInput } from "../pedidoProduto.validator";
import { ResponsePedidoProdutoDTO, UpdatePedidoProdutoDTO } from "../dto";
import { PedidoProdutoRepository } from "../repositories/pedidoProdutoRepository";
import { logger } from "@/shared/utils/logger";
import { NotFoundError } from "@/shared/errors/AppError";

@injectable()
export class PedidoProdutoService {
  constructor(
    @inject(PedidoProdutoRepository) private readonly pedidoProdutoRepository: PedidoProdutoRepository
  ) { }

  async create(data: CreatePedidoProdutoInput): Promise<ResponsePedidoProdutoDTO> {
    logger.info('Starting pedido produto creation');
    logger.event('Performing data processing');
    const payload = { ...data, total: data.preco * data.quantidade }
    const pedidoProduto = await this.pedidoProdutoRepository.create(payload);
    logger.success('Pedido produto created successfully');
    return pedidoProduto;
  }

  async findAll(): Promise<ResponsePedidoProdutoDTO[]> {
    logger.info('Searching all pedido produtos');
    const pedidoProdutos = await this.pedidoProdutoRepository.findAll();
    logger.success(`${pedidoProdutos.length} pedido produtos retrieved`);
    return pedidoProdutos;
  }

  async findById(id: string): Promise<ResponsePedidoProdutoDTO> {
    logger.info(`Searching pedido produto with ID: ${id}`);
    const pedidoProduto = await this.pedidoProdutoRepository.findById(id);
    if (!pedidoProduto) {
      logger.error(`Pedido produto with ID: ${id} not found`);
      throw new NotFoundError(`Pedido produto com ID: ${id} não encontrado`);
    }
    logger.finish('Pedido produto found');
    return pedidoProduto;
  }

  async findByIdPedido(idPedido: string): Promise<ResponsePedidoProdutoDTO[]> {
    logger.info(`Searching pedido produtos by pedido ID: ${idPedido}`);
    const pedidoProdutos = await this.pedidoProdutoRepository.findByIdPedido(idPedido);
    logger.success(`${pedidoProdutos.length} pedido produtos found for pedido ${idPedido}`);
    return pedidoProdutos;
  }

  async findByIdProduto(idProduto: string): Promise<ResponsePedidoProdutoDTO[]> {
    logger.info(`Searching pedido produtos by produto ID: ${idProduto}`);
    const pedidoProdutos = await this.pedidoProdutoRepository.findByIdProduto(idProduto);
    logger.success(`${pedidoProdutos.length} pedido produtos found for produto ${idProduto}`);
    return pedidoProdutos;
  }

  async update(id: string, data: UpdatePedidoProdutoDTO): Promise<ResponsePedidoProdutoDTO> {
    logger.info(`Starting update pedido produto with ID: ${id}`);
    const pedidoProdutoExistence = await this.pedidoProdutoRepository.findById(id);
    if (!pedidoProdutoExistence) {
      logger.error('Pedido produto not found');
      throw new NotFoundError(`Pedido produto com ID: ${id} não encontrado`);
    }
    const pedidoProduto = await this.pedidoProdutoRepository.update(id, data);
    logger.finish('Pedido produto updated');
    return pedidoProduto!;
  }

  async delete(id: string): Promise<void> {
    logger.info(`Deleting pedido produto with ID: ${id}`);
    const pedidoProdutoExistence = await this.pedidoProdutoRepository.findById(id);
    if (!pedidoProdutoExistence) {
      logger.error('Pedido produto not found');
      throw new NotFoundError(`Pedido produto com ID: ${id} não encontrado`);
    }
    await this.pedidoProdutoRepository.delete(id);
    logger.finish('Pedido produto deleted successfully');
  }

  async deleteByIdPedido(idPedido: string): Promise<void> {
    logger.info(`Deleting all pedido produtos for pedido ID: ${idPedido}`);
    await this.pedidoProdutoRepository.deleteByIdPedido(idPedido);
    logger.finish('Pedido produtos deleted successfully');
  }
}
