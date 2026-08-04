import { inject, injectable } from 'tsyringe';
import { ProdutoService } from '@/modules/produto/services/produtoService';
import { ClientesService } from '@/modules/clientes/services/clientesService';
import { FormaPagamentoService } from '@/modules/formaPagamento/services/formaPagamentoService';
import { TransportadoraService } from '@/modules/transportadora/services/transportadoraService';
import { ProdutosCigamService } from '@/modules/produtosCigam/services/produtosCigamService';
import { ClientesCigamService } from '@/modules/clientesCigam/services/clientesCigamService';
import { FormasPagamentoCigamService } from '@/modules/formasPagamentoCigam/services/formasPagamentoCigamService';
import { TransportadorasCigamService } from '@/modules/transportadorasCigam/services/transportadorasCigamService';
import { DeParaProdutosRepository } from '../repositories/deparaProdutosRepository';
import { DeParaClientesRepository } from '../repositories/deparaClientesRepository';
import { DeParaFormasPagamentoRepository } from '../repositories/deparaFormasPagamentoRepository';
import { DeParaTransportadorasRepository } from '../repositories/deparaTransportadorasRepository';
import { DeParaResultDTO, DeParaStatusDTO } from '../dto';
import { DeParaManualInput } from '../depara.validator';
import { logger } from '@/shared/utils/logger';
import ExcelJS from 'exceljs';
import { DeParaExportFilter, DeParaExportSource } from '../depara.validator';

function normalize(str: string): string {
  return str.toLowerCase().trim().replace(/\s+/g, ' ');
}

function normalizeDoc(doc: string | null): string {
  if (!doc) return '';
  return doc.replace(/\D/g, '');
}

@injectable()
export class DeParaService {
  constructor(
    @inject(ProdutoService) private readonly produtoService: ProdutoService,
    @inject(ClientesService) private readonly clientesService: ClientesService,
    @inject(FormaPagamentoService) private readonly formaPagamentoService: FormaPagamentoService,
    @inject(TransportadoraService) private readonly transportadoraService: TransportadoraService,
    @inject(ProdutosCigamService) private readonly produtosCigamService: ProdutosCigamService,
    @inject(ClientesCigamService) private readonly clientesCigamService: ClientesCigamService,
    @inject(FormasPagamentoCigamService) private readonly formasPagamentoCigamService: FormasPagamentoCigamService,
    @inject(TransportadorasCigamService) private readonly transportadorasCigamService: TransportadorasCigamService,
    @inject(DeParaProdutosRepository) private readonly deParaProdutosRepo: DeParaProdutosRepository,
    @inject(DeParaClientesRepository) private readonly deParaClientesRepo: DeParaClientesRepository,
    @inject(DeParaFormasPagamentoRepository) private readonly deParaFormasPagamentoRepo: DeParaFormasPagamentoRepository,
    @inject(DeParaTransportadorasRepository) private readonly deParaTransportadorasRepo: DeParaTransportadorasRepository,
  ) {}

  async syncProdutos(): Promise<DeParaResultDTO> {
    logger.info('Iniciando de-para de produtos...');
    const result: DeParaResultDTO = { entity: 'produtos', mapped: 0, unmapped: 0, errors: [], unmappedItems: [] };

    try {
      const blingItems = await this.produtoService.findAll();
      const cigamItems = await this.produtosCigamService.findAll();

      const cigamMap = new Map<string, string>();
      for (const c of cigamItems) {
        if (c.id_cigam) {
          cigamMap.set(normalize(c.id_cigam), c.id_cigam);
        }
      }

      for (const bling of blingItems) {
        if (!bling.id_bling) continue;

        const existing = await this.deParaProdutosRepo.findByIdBling(bling.id_bling);
        if (existing) {
          result.mapped++;
          continue;
        }

        const normalizedCodigo = bling.codigo ? normalize(bling.codigo) : '';
        const matchCigamId = normalizedCodigo ? cigamMap.get(normalizedCodigo) : undefined;

        if (matchCigamId) {
          try {
            await this.deParaProdutosRepo.create({
              id_bling: bling.id_bling,
              id_cigam: matchCigamId,
              nome: bling.nome,
            });
            result.mapped++;
          } catch (err: any) {
            result.errors.push(`Erro ao criar de-para produto ${bling.nome}: ${err.message}`);
          }
        } else {
          result.unmapped++;
          result.unmappedItems.push({ id_bling: bling.id_bling, nome: bling.nome });
        }
      }

      logger.success(`De-para produtos: ${result.mapped} mapeados, ${result.unmapped} não mapeados`);
    } catch (error: any) {
      result.errors.push(error.message);
      logger.error('Erro no de-para de produtos', { error: error.message });
    }

    return result;
  }

  async syncClientes(): Promise<DeParaResultDTO> {
    logger.info('Iniciando de-para de clientes...');
    const result: DeParaResultDTO = { entity: 'clientes', mapped: 0, unmapped: 0, errors: [], unmappedItems: [] };

    try {
      const blingItems = await this.clientesService.findAll();
      const cigamItems = await this.clientesCigamService.findAll();

      const cigamMap = new Map<string, string>();
      for (const c of cigamItems) {
        const doc = normalizeDoc(c.documento);
        if (doc) cigamMap.set(doc, c.id_cigam);
      }

      for (const bling of blingItems) {
        if (!bling.id_bling) continue;

        const existing = await this.deParaClientesRepo.findByIdBling(bling.id_bling);
        if (existing) {
          result.mapped++;
          continue;
        }

        const blingDoc = normalizeDoc(bling.documento);
        const matchCigamId = blingDoc ? cigamMap.get(blingDoc) : undefined;

        if (matchCigamId) {
          try {
            await this.deParaClientesRepo.create({
              id_bling: bling.id_bling,
              id_cigam: matchCigamId,
              nome: bling.nome,
            });
            result.mapped++;
          } catch (err: any) {
            result.errors.push(`Erro ao criar de-para cliente ${bling.nome}: ${err.message}`);
          }
        } else {
          result.unmapped++;
          result.unmappedItems.push({ id_bling: bling.id_bling, nome: bling.nome });
        }
      }

      logger.success(`De-para clientes: ${result.mapped} mapeados, ${result.unmapped} não mapeados`);
    } catch (error: any) {
      result.errors.push(error.message);
      logger.error('Erro no de-para de clientes', { error: error.message });
    }

    return result;
  }

  async syncFormasPagamento(): Promise<DeParaResultDTO> {
    logger.info('Iniciando de-para de formas de pagamento...');
    const result: DeParaResultDTO = { entity: 'formas_pagamento', mapped: 0, unmapped: 0, errors: [], unmappedItems: [] };

    try {
      const blingItems = await this.formaPagamentoService.findAll();
      const cigamItems = await this.formasPagamentoCigamService.findAll();

      const cigamMap = new Map<string, string>();
      for (const c of cigamItems) {
        cigamMap.set(normalize(c.descricao), c.id_cigam);
      }

      for (const bling of blingItems) {
        if (!bling.id_bling) continue;

        const existing = await this.deParaFormasPagamentoRepo.findByIdBling(bling.id_bling);
        if (existing) {
          result.mapped++;
          continue;
        }

        const normalizedName = normalize(bling.descricao);
        const matchCigamId = cigamMap.get(normalizedName);

        if (matchCigamId) {
          try {
            await this.deParaFormasPagamentoRepo.create({
              id_bling: bling.id_bling,
              id_cigam: matchCigamId,
              nome: bling.descricao,
            });
            result.mapped++;
          } catch (err: any) {
            result.errors.push(`Erro ao criar de-para forma pagamento ${bling.descricao}: ${err.message}`);
          }
        } else {
          result.unmapped++;
          result.unmappedItems.push({ id_bling: bling.id_bling, nome: bling.descricao });
        }
      }

      logger.success(`De-para formas pagamento: ${result.mapped} mapeados, ${result.unmapped} não mapeados`);
    } catch (error: any) {
      result.errors.push(error.message);
      logger.error('Erro no de-para de formas de pagamento', { error: error.message });
    }

    return result;
  }

  async syncTransportadoras(): Promise<DeParaResultDTO> {
    logger.info('Iniciando de-para de transportadoras...');
    const result: DeParaResultDTO = { entity: 'transportadoras', mapped: 0, unmapped: 0, errors: [], unmappedItems: [] };

    try {
      const blingItems = await this.transportadoraService.findAll();
      const cigamItems = await this.transportadorasCigamService.findAll();

      const cigamMap = new Map<string, string>();
      for (const c of cigamItems) {
        const doc = normalizeDoc(c.documento);
        if (doc) cigamMap.set(doc, c.id_cigam);
      }

      for (const bling of blingItems) {
        if (!bling.id_bling) continue;

        const existing = await this.deParaTransportadorasRepo.findByIdBling(bling.id_bling);
        if (existing) {
          result.mapped++;
          continue;
        }

        const blingDoc = normalizeDoc(bling.documento);
        const matchCigamId = blingDoc ? cigamMap.get(blingDoc) : undefined;

        if (matchCigamId) {
          try {
            await this.deParaTransportadorasRepo.create({
              id_bling: bling.id_bling,
              id_cigam: matchCigamId,
              nome: bling.nome,
            });
            result.mapped++;
          } catch (err: any) {
            result.errors.push(`Erro ao criar de-para transportadora ${bling.nome}: ${err.message}`);
          }
        } else {
          result.unmapped++;
          result.unmappedItems.push({ id_bling: bling.id_bling, nome: bling.nome });
        }
      }

      logger.success(`De-para transportadoras: ${result.mapped} mapeados, ${result.unmapped} não mapeados`);
    } catch (error: any) {
      result.errors.push(error.message);
      logger.error('Erro no de-para de transportadoras', { error: error.message });
    }

    return result;
  }

  async syncAll(): Promise<DeParaResultDTO[]> {
    logger.info('Iniciando de-para completo...');
    const results = await Promise.all([
      this.syncProdutos(),
      this.syncClientes(),
      this.syncFormasPagamento(),
      this.syncTransportadoras(),
    ]);

    const totalMapped = results.reduce((acc, r) => acc + r.mapped, 0);
    const totalUnmapped = results.reduce((acc, r) => acc + r.unmapped, 0);
    logger.success(`De-para completo: ${totalMapped} mapeados, ${totalUnmapped} não mapeados`);

    return results;
  }

  async manualMap(data: DeParaManualInput): Promise<void> {
    const repos: Record<string, any> = {
      produtos: this.deParaProdutosRepo,
      clientes: this.deParaClientesRepo,
      formas_pagamento: this.deParaFormasPagamentoRepo,
      transportadoras: this.deParaTransportadorasRepo,
    };

    const repo = repos[data.entity];
    if (!repo) {
      throw new Error(`Entidade inválida: ${data.entity}`);
    }

    const existing = await repo.findByIdBling(data.id_bling);
    if (existing) {
      await existing.update({ id_cigam: data.id_cigam });
    } else {
      await repo.create({
        id_bling: data.id_bling,
        id_cigam: data.id_cigam,
        nome: data.nome,
      });
    }

    logger.success(`Mapeamento manual ${data.entity}: id_bling=${data.id_bling} → id_cigam=${data.id_cigam}`);
  }

  async getStatus(): Promise<DeParaStatusDTO[]> {
    const [blingProdutos, cigamProdutos, dpProdutos] = await Promise.all([
      this.produtoService.findAll(),
      this.produtosCigamService.findAll(),
      this.deParaProdutosRepo.findAll(),
    ]);
    const [blingClientes, cigamClientes, dpClientes] = await Promise.all([
      this.clientesService.findAll(),
      this.clientesCigamService.findAll(),
      this.deParaClientesRepo.findAll(),
    ]);
    const [blingFpgto, cigamFpgto, dpFpgto] = await Promise.all([
      this.formaPagamentoService.findAll(),
      this.formasPagamentoCigamService.findAll(),
      this.deParaFormasPagamentoRepo.findAll(),
    ]);
    const [blingTransp, cigamTransp, dpTransp] = await Promise.all([
      this.transportadoraService.findAll(),
      this.transportadorasCigamService.findAll(),
      this.deParaTransportadorasRepo.findAll(),
    ]);

    return [
      {
        entity: 'produtos',
        total_bling: blingProdutos.length,
        total_cigam: cigamProdutos.length,
        total_mapped: dpProdutos.length,
        total_unmapped: blingProdutos.length - dpProdutos.length,
      },
      {
        entity: 'clientes',
        total_bling: blingClientes.length,
        total_cigam: cigamClientes.length,
        total_mapped: dpClientes.length,
        total_unmapped: blingClientes.length - dpClientes.length,
      },
      {
        entity: 'formas_pagamento',
        total_bling: blingFpgto.length,
        total_cigam: cigamFpgto.length,
        total_mapped: dpFpgto.length,
        total_unmapped: blingFpgto.length - dpFpgto.length,
      },
      {
        entity: 'transportadoras',
        total_bling: blingTransp.length,
        total_cigam: cigamTransp.length,
        total_mapped: dpTransp.length,
        total_unmapped: blingTransp.length - dpTransp.length,
      },
    ];
  }

  async getAssociations(entity: string): Promise<any[]> {
    const repos: Record<string, any> = {
      produtos: this.deParaProdutosRepo,
      clientes: this.deParaClientesRepo,
      formas_pagamento: this.deParaFormasPagamentoRepo,
      transportadoras: this.deParaTransportadorasRepo,
    };

    const repo = repos[entity];
    if (!repo) {
      throw new Error(`Entidade inválida para listagem de associações: ${entity}`);
    }

    return repo.findAll();
  }

  async generateFormasPagamentoExcel(
    filter: DeParaExportFilter,
    source: DeParaExportSource = 'all',
  ): Promise<Buffer> {
    const [blingItems, cigamItems, mappings] = await Promise.all([
      this.formaPagamentoService.findAll(),
      this.formasPagamentoCigamService.findAll(),
      this.deParaFormasPagamentoRepo.findAll(),
    ]);

    const mappingByBling = new Map(mappings.map((mapping) => [mapping.id_bling, mapping]));
    const mappingsByCigam = new Map<string, typeof mappings>();
    for (const mapping of mappings) {
      const current = mappingsByCigam.get(mapping.id_cigam) || [];
      current.push(mapping);
      mappingsByCigam.set(mapping.id_cigam, current);
    }

    const matchesFilter = (mapped: boolean) =>
      filter === 'all' || (filter === 'mapped' ? mapped : !mapped);

    const cigamById = new Map(cigamItems.map((item) => [item.id_cigam, item]));
    const blingById = new Map(blingItems.map((item) => [item.id_bling, item]));
    const filteredBling = blingItems.filter((item) => matchesFilter(mappingByBling.has(item.id_bling)));
    const filteredCigam = cigamItems.filter((item) => matchesFilter(mappingsByCigam.has(item.id_cigam)));

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Chocmaster';
    workbook.created = new Date();
    workbook.subject = `Formas de pagamento - origem ${source} - filtro ${filter}`;

    const worksheets: ExcelJS.Worksheet[] = [];

    if (source === 'all' || source === 'bling') {
      const blingSheet = workbook.addWorksheet('Bling', { views: [{ state: 'frozen', ySplit: 1 }] });
      worksheets.push(blingSheet);
      blingSheet.columns = [
        { header: 'ID Bling', key: 'id', width: 18 },
        { header: 'Descrição', key: 'description', width: 38 },
        { header: 'Tipo', key: 'type', width: 18 },
        { header: 'Ativo', key: 'active', width: 12 },
        { header: 'Associado', key: 'mapped', width: 14 },
        { header: 'ID CIGAM associado', key: 'cigamId', width: 22 },
        { header: 'Descrição CIGAM', key: 'cigamDescription', width: 38 },
      ];
      for (const item of filteredBling) {
        const mapping = mappingByBling.get(item.id_bling);
        const cigamItem = mapping ? cigamById.get(mapping.id_cigam) : undefined;
        blingSheet.addRow({
          id: item.id_bling,
          description: item.descricao,
          type: item.tipo || '',
          active: item.active ? 'Sim' : 'Não',
          mapped: mapping ? 'Sim' : 'Não',
          cigamId: mapping?.id_cigam || '',
          cigamDescription: cigamItem?.descricao || '',
        });
      }
    }

    if (source === 'all' || source === 'cigam') {
      const cigamSheet = workbook.addWorksheet('CIGAM', { views: [{ state: 'frozen', ySplit: 1 }] });
      worksheets.push(cigamSheet);
      cigamSheet.columns = [
        { header: 'ID CIGAM', key: 'id', width: 18 },
        { header: 'Descrição', key: 'description', width: 38 },
        { header: 'Tipo', key: 'type', width: 18 },
        { header: 'Ativo', key: 'active', width: 12 },
        { header: 'Associado', key: 'mapped', width: 14 },
        { header: 'IDs Bling associados', key: 'blingIds', width: 28 },
        { header: 'Descrições Bling', key: 'blingDescriptions', width: 45 },
      ];
      for (const item of filteredCigam) {
        const itemMappings = mappingsByCigam.get(item.id_cigam) || [];
        cigamSheet.addRow({
          id: item.id_cigam,
          description: item.descricao,
          type: item.tipo || '',
          active: item.ativo ? 'Sim' : 'Não',
          mapped: itemMappings.length > 0 ? 'Sim' : 'Não',
          blingIds: itemMappings.map((mapping) => mapping.id_bling).join(', '),
          blingDescriptions: itemMappings
            .map((mapping) => blingById.get(mapping.id_bling)?.descricao || mapping.nome)
            .join(', '),
        });
      }
    }

    for (const worksheet of worksheets) {
      worksheet.autoFilter = { from: 'A1', to: `G${Math.max(worksheet.rowCount, 1)}` };
      worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4F46E5' },
      };
      worksheet.getRow(1).alignment = { vertical: 'middle' };
    }

    logger.success(
      `Excel de formas de pagamento gerado: ${filteredBling.length} Bling, ${filteredCigam.length} CIGAM`,
    );
    return Buffer.from(await workbook.xlsx.writeBuffer());
  }

  async deleteAssociation(entity: string, idBling: string): Promise<void> {
    const repos: Record<string, any> = {
      produtos: this.deParaProdutosRepo,
      clientes: this.deParaClientesRepo,
      formas_pagamento: this.deParaFormasPagamentoRepo,
      transportadoras: this.deParaTransportadorasRepo,
    };

    const repo = repos[entity];
    if (!repo) {
      throw new Error(`Entidade inválida para exclusão de associação: ${entity}`);
    }

    await repo.deleteByIdBling(idBling);
    logger.success(`Associação deletada para ${entity}: id_bling=${idBling}`);
  }
}
