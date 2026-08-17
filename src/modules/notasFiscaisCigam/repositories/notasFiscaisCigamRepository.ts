import { injectable } from 'tsyringe';
import { NotasFiscaisCigamModel } from '../models/notasFiscaisCigamModel';
import { CreateNotaFiscalCigamDTO, ResponseNotaFiscalCigamDTO } from '../dto';

@injectable()
export class NotasFiscaisCigamRepository {
  async create(data: CreateNotaFiscalCigamDTO): Promise<ResponseNotaFiscalCigamDTO> {
    const nota = await NotasFiscaisCigamModel.create({
      numero_pedido_cigam: data.numero_pedido_cigam,
      numero_pedido_marketplace: data.numero_pedido_marketplace,
      unidade_negocio: data.unidade_negocio,
      data_faturamento: data.data_faturamento,
      numero_nf: data.numero_nf,
      serie_nf: data.serie_nf,
      chave_acesso: data.chave_acesso,
      enviado_marketplace: data.enviado_marketplace ?? false,
      xml_content: data.xml_content,
    });

    return this.toDTO(nota);
  }

  async findAll(): Promise<ResponseNotaFiscalCigamDTO[]> {
    const notas = await NotasFiscaisCigamModel.findAll({
      order: [['created_at', 'DESC']],
    });
    return notas.map(n => this.toDTO(n));
  }

  async findById(id: string): Promise<ResponseNotaFiscalCigamDTO | null> {
    const nota = await NotasFiscaisCigamModel.findByPk(id);
    if (!nota) return null;
    return this.toDTO(nota);
  }

  async findByNumeroPedidoCigam(numeroPedidoCigam: string): Promise<ResponseNotaFiscalCigamDTO[]> {
    const notas = await NotasFiscaisCigamModel.findAll({
      where: { numero_pedido_cigam: numeroPedidoCigam },
      order: [['created_at', 'DESC']],
    });
    return notas.map(n => this.toDTO(n));
  }

  async findByChaveAcesso(chaveAcesso: string): Promise<ResponseNotaFiscalCigamDTO | null> {
    const nota = await NotasFiscaisCigamModel.findOne({
      where: { chave_acesso: chaveAcesso },
    });
    if (!nota) return null;
    return this.toDTO(nota);
  }

  async findNotEnviadas(): Promise<ResponseNotaFiscalCigamDTO[]> {
    const notas = await NotasFiscaisCigamModel.findAll({
      where: { enviado_marketplace: false },
      order: [['created_at', 'DESC']],
    });
    return notas.map(n => this.toDTO(n));
  }

  async updateEnviadoMarketplace(id: string, enviado: boolean): Promise<void> {
    await NotasFiscaisCigamModel.update(
      { enviado_marketplace: enviado },
      { where: { id } }
    );
  }

  private toDTO(model: NotasFiscaisCigamModel): ResponseNotaFiscalCigamDTO {
    const data = model.get({ plain: true });
    return {
      id: data.id,
      numero_pedido_cigam: data.numero_pedido_cigam,
      numero_pedido_marketplace: data.numero_pedido_marketplace,
      unidade_negocio: data.unidade_negocio,
      data_faturamento: data.data_faturamento,
      numero_nf: data.numero_nf,
      serie_nf: data.serie_nf,
      chave_acesso: data.chave_acesso,
      enviado_marketplace: data.enviado_marketplace,
      xml_content: data.xml_content,
      created_at: data.created_at,
      updated_at: data.updated_at,
    };
  }
}
