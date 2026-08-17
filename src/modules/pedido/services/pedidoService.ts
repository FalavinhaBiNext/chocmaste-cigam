import { injectable, inject } from 'tsyringe';
import { CreatePedidoInput } from "../pedido.validator";
import { ResponsePedidoDTO, UpdatePedidoDTO } from "../dto";
import { PedidoRepository } from "../repositories/pedidoRepository";
import { logger } from "@/shared/utils/logger";
import { NotFoundError } from "@/shared/errors/AppError";

@injectable()
export class PedidoService {
  constructor(
    @inject(PedidoRepository) private readonly pedidoRepository: PedidoRepository
  ) {}

  async create(data: CreatePedidoInput): Promise<ResponsePedidoDTO> {
    logger.info('Starting pedido creation');
    logger.event('Performing data processing');
    const pedido = await this.pedidoRepository.create(data);
    logger.success('Pedido created successfully');
    return pedido;
  }

  async findAll(): Promise<ResponsePedidoDTO[]> {
    logger.info('Searching all pedidos');
    const pedidos = await this.pedidoRepository.findAll();
    logger.success(`${pedidos.length} pedidos retrieved`);
    return pedidos;
  }

  async findById(id: string): Promise<ResponsePedidoDTO> {
    logger.info(`Searching pedido with ID: ${id}`);
    const pedido = await this.pedidoRepository.findById(id);
    if (!pedido) {
      logger.error(`Pedido with ID: ${id} not found`);
      throw new NotFoundError(`Pedido com ID: ${id} não encontrado`);
    }
    logger.finish('Pedido found');
    return pedido;
  }

  async findByIdBling(idBling: string): Promise<ResponsePedidoDTO> {
    logger.info(`Searching pedido with Bling ID: ${idBling}`);
    const pedido = await this.pedidoRepository.findByIdBling(idBling);
    if (!pedido) {
      logger.error(`Pedido with Bling ID: ${idBling} not found`);
      throw new NotFoundError(`Pedido com ID Bling: ${idBling} não encontrado`);
    }
    logger.finish('Pedido found');
    return pedido;
  }

  async findByNumeroLoja(numeroLoja: string): Promise<ResponsePedidoDTO> {
    logger.info(`Searching pedido with numeroLoja: ${numeroLoja}`);
    const pedido = await this.pedidoRepository.findByNumeroLoja(numeroLoja);
    if (!pedido) {
      logger.error(`Pedido with numeroLoja: ${numeroLoja} not found`);
      throw new NotFoundError(`Pedido com numeroLoja: ${numeroLoja} não encontrado`);
    }
    logger.finish('Pedido found');
    return pedido;
  }

  async findByNumeroPedidoCigam(numeroPedidoCigam: string): Promise<ResponsePedidoDTO | null> {
    logger.info(`Searching pedido with numeroPedidoCigam: ${numeroPedidoCigam}`);
    const pedido = await this.pedidoRepository.findByNumeroPedidoCigam(numeroPedidoCigam);
    if (!pedido) {
      logger.info(`Pedido with numeroPedidoCigam: ${numeroPedidoCigam} not found`);
      return null;
    }
    logger.finish('Pedido found');
    return pedido;
  }

  async update(id: string, data: UpdatePedidoDTO): Promise<ResponsePedidoDTO> {
    logger.info(`Starting update pedido with ID: ${id}`);
    const pedidoExistence = await this.pedidoRepository.findById(id);
    if (!pedidoExistence) {
      logger.error('Pedido not found');
      throw new NotFoundError(`Pedido com ID: ${id} não encontrado`);
    }
    const pedido = await this.pedidoRepository.update(id, data);
    logger.finish('Pedido updated');
    return pedido!;
  }

  async delete(id: string): Promise<void> {
    logger.info(`Deleting pedido with ID: ${id}`);
    const pedidoExistence = await this.pedidoRepository.findById(id);
    if (!pedidoExistence) {
      logger.error('Pedido not found');
      throw new NotFoundError(`Pedido com ID: ${id} não encontrado`);
    }
    await this.pedidoRepository.delete(id);
    logger.finish('Pedido deleted successfully');
  }
}
