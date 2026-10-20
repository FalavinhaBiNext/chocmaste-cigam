import { injectable, inject } from 'tsyringe';
import { CreateTransportadoraInput } from "../transportadora.validator";
import { ResponseTransportadoraDTO, UpdateTransportadoraDTO } from "../dto";
import { TransportadoraRepository } from "../repositories/transportadoraRepository";
import { DeParaTransportadorasRepository } from "@/modules/depara/repositories/deparaTransportadorasRepository";
import { ContatosService } from "@/modules/bling/services/contatosService";
import { logger } from "@/shared/utils/logger";
import { NotFoundError, ValidationError } from "@/shared/errors/AppError";

export interface ImportacaoTransportadoraBlingResult {
  acao: 'criada' | 'atualizada';
  transportadora: ResponseTransportadoraDTO;
  /** Quantos contatos do Bling têm o mesmo documento (o primeiro ativo é usado). */
  contatosEncontrados: number;
}

@injectable()
export class TransportadoraService {
  constructor(
    @inject(TransportadoraRepository) private readonly transportadoraRepository: TransportadoraRepository,
    @inject(DeParaTransportadorasRepository) private readonly deParaTransportadorasRepo: DeParaTransportadorasRepository,
    @inject(ContatosService) private readonly contatosService?: ContatosService,
  ) {}

  /**
   * Busca no Bling o contato com o CPF/CNPJ informado (ex.: o documento de uma
   * transportadora do CIGAM) e grava/atualiza na tabela de transportadoras do
   * Bling. Havendo mais de um contato com o mesmo documento, usa o primeiro
   * ativo (ou o primeiro, se nenhum estiver ativo).
   */
  async importarDoBlingPorDocumento(documento: string): Promise<ImportacaoTransportadoraBlingResult> {
    const digitos = documento.replace(/\D/g, '');
    if (digitos.length !== 11 && digitos.length !== 14) {
      throw new ValidationError('Informe um CNPJ (14 dígitos) ou CPF (11 dígitos) válido.');
    }
    if (!this.contatosService) {
      throw new Error('Serviço de contatos do Bling indisponível.');
    }

    logger.info(`[TRANSPORTADORA] Buscando no Bling o contato com documento ${digitos}...`);
    const contatos = await this.contatosService.buscarPorDocumento(digitos);
    if (contatos.length === 0) {
      throw new NotFoundError(`Nenhum contato encontrado no Bling com o documento ${digitos}. Cadastre a transportadora no Bling e tente novamente.`);
    }

    const escolhido = contatos.find((c) => c.situacao === 'A') ?? contatos[0];
    if (contatos.length > 1) {
      logger.warn(
        `[TRANSPORTADORA] ${contatos.length} contatos no Bling com o documento ${digitos} (ids ${contatos.map((c) => c.id).join(', ')}). Usando o ${escolhido.id}.`,
      );
    }

    // A listagem do Bling traz menos campos; o detalhe garante nome/fantasia completos.
    let detalhe = escolhido;
    try {
      detalhe = await this.contatosService.getById(String(escolhido.id));
    } catch (error: any) {
      logger.warn(`[TRANSPORTADORA] Não foi possível obter o detalhe do contato ${escolhido.id} no Bling (usando os dados da busca): ${error.message}`);
    }

    const dados = {
      nome: detalhe.nome || escolhido.nome || `Transportadora ${escolhido.id}`,
      fantasia: detalhe.fantasia || escolhido.fantasia || undefined,
      documento: digitos,
      active: (detalhe.situacao || escolhido.situacao) !== 'I',
    };

    const existente = await this.transportadoraRepository.findByIdBling(String(escolhido.id));
    if (existente) {
      const atualizada = await this.transportadoraRepository.update(existente.id, dados);
      logger.success(`[TRANSPORTADORA] Transportadora Bling ${escolhido.id} (${dados.nome}) atualizada a partir do documento ${digitos}.`);
      return { acao: 'atualizada', transportadora: atualizada ?? existente, contatosEncontrados: contatos.length };
    }

    const criada = await this.transportadoraRepository.create({ id_bling: String(escolhido.id), ...dados });
    logger.success(`[TRANSPORTADORA] Transportadora Bling ${escolhido.id} (${dados.nome}) criada a partir do documento ${digitos}.`);
    return { acao: 'criada', transportadora: criada, contatosEncontrados: contatos.length };
  }

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
