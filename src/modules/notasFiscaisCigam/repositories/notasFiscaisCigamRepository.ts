import { injectable } from 'tsyringe';
import { Op } from 'sequelize';
import { NotasFiscaisCigamModel } from '../models/notasFiscaisCigamModel';
import { CreateNotaFiscalCigamDTO, ResponseNotaFiscalCigamDTO } from '../dto';
import { parseDateOnly } from '@/shared/utils/date';

@injectable()
export class NotasFiscaisCigamRepository {
  async create(data: CreateNotaFiscalCigamDTO): Promise<ResponseNotaFiscalCigamDTO> {
    const nota = await NotasFiscaisCigamModel.create({
      numero_pedido_cigam: data.numero_pedido_cigam,
      numero_pedido_marketplace: data.numero_pedido_marketplace,
      marketplace: data.marketplace,
      unidade_negocio: data.unidade_negocio,
      data_faturamento: parseDateOnly(data.data_faturamento),
      numero_nf: data.numero_nf,
      serie_nf: data.serie_nf,
      chave_acesso: data.chave_acesso,
      enviado_marketplace: data.enviado_marketplace ?? false,
      xml_content: data.xml_content,
      etiqueta_pdf: data.etiqueta_pdf,
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

  /**
   * NF-es da Shopee já enviadas desde a data informada — só os campos para
   * identificar o pedido (sem o XML), para a verificação da organização do envio.
   */
  async findShopeeEnviadasDesde(desde: Date): Promise<Array<{ id: string; numero_pedido_cigam: string; numero_pedido_marketplace: string }>> {
    const notas = await NotasFiscaisCigamModel.findAll({
      attributes: ['id', 'numero_pedido_cigam', 'numero_pedido_marketplace'],
      where: {
        marketplace: 'shopee',
        enviado_marketplace: true,
        numero_pedido_marketplace: { [Op.ne]: null },
        created_at: { [Op.gte]: desde },
      },
      order: [['created_at', 'DESC']],
    });
    return notas.map((n) => ({
      id: n.id,
      numero_pedido_cigam: n.numero_pedido_cigam,
      numero_pedido_marketplace: String(n.numero_pedido_marketplace),
    }));
  }

  async updateEnviadoMarketplace(id: string, enviado: boolean): Promise<void> {
    await NotasFiscaisCigamModel.update(
      { enviado_marketplace: enviado },
      { where: { id } }
    );
  }

  async updateMarketplace(id: string, marketplace: string): Promise<void> {
    await NotasFiscaisCigamModel.update(
      { marketplace },
      { where: { id } }
    );
  }

  async updateTrayInvoiceId(id: string, trayInvoiceId: string): Promise<void> {
    await NotasFiscaisCigamModel.update(
      { tray_invoice_id: trayInvoiceId },
      { where: { id } }
    );
  }

  async deleteById(id: string): Promise<void> {
    await NotasFiscaisCigamModel.destroy({ where: { id } });
  }

  /** Busca só o conteúdo base64 da etiqueta, sem montar o DTO completo (usado pra download). */
  async findEtiquetaPdf(id: string): Promise<string | null> {
    const nota = await NotasFiscaisCigamModel.findByPk(id, { attributes: ['etiqueta_pdf'] });
    return nota?.get('etiqueta_pdf') as string | null ?? null;
  }

  async countByEnviadoMarketplace(): Promise<{ enviado: number; pendente: number }> {
    const [enviado, pendente] = await Promise.all([
      NotasFiscaisCigamModel.count({ where: { enviado_marketplace: true } }),
      NotasFiscaisCigamModel.count({ where: { enviado_marketplace: false } }),
    ]);
    return { enviado, pendente };
  }

  private toDTO(model: NotasFiscaisCigamModel): ResponseNotaFiscalCigamDTO {
    const data = model.get({ plain: true });
    return {
      id: data.id,
      numero_pedido_cigam: data.numero_pedido_cigam,
      numero_pedido_marketplace: data.numero_pedido_marketplace,
      marketplace: data.marketplace,
      unidade_negocio: data.unidade_negocio,
      data_faturamento: data.data_faturamento,
      numero_nf: data.numero_nf,
      serie_nf: data.serie_nf,
      chave_acesso: data.chave_acesso,
      enviado_marketplace: data.enviado_marketplace,
      xml_content: data.xml_content,
      tray_invoice_id: data.tray_invoice_id,
      tem_etiqueta_pdf: Boolean(data.etiqueta_pdf),
      created_at: data.created_at,
      updated_at: data.updated_at,
    };
  }
}
