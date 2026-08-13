import { inject, injectable } from 'tsyringe';
import { Request, Response } from 'express';
import { DeParaService } from '../services/deparaService';
import { DeParaUnidadesNegocioRepository } from '../repositories/deparaUnidadesNegocioRepository';
import {
  validateDeParaSync,
  validateDeParaManual,
  validateDeParaExportFilter,
  validateDeParaExportSource,
} from '../depara.validator';

@injectable()
export class DeParaController {
  constructor(
    @inject(DeParaService) private readonly deParaService: DeParaService,
    @inject(DeParaUnidadesNegocioRepository) private readonly deParaUnidadesNegocioRepo: DeParaUnidadesNegocioRepository
  ) {}

  health = (_req: Request, res: Response) => {
    res.status(200).json({
      success: true,
      status: 'ok',
      service: 'de-para',
      message: 'De Para Service Running',
      timestamp: new Date().toISOString(),
    });
  };

  syncProdutos = async (_req: Request, res: Response) => {
    const result = await this.deParaService.syncProdutos();
    res.status(200).json({
      success: true,
      message: 'De-para de produtos finalizado.',
      data: result,
    });
  };

  syncClientes = async (_req: Request, res: Response) => {
    const result = await this.deParaService.syncClientes();
    res.status(200).json({
      success: true,
      message: 'De-para de clientes finalizado.',
      data: result,
    });
  };

  syncFormasPagamento = async (_req: Request, res: Response) => {
    const result = await this.deParaService.syncFormasPagamento();
    res.status(200).json({
      success: true,
      message: 'De-para de formas de pagamento finalizado.',
      data: result,
    });
  };

  syncTransportadoras = async (_req: Request, res: Response) => {
    const result = await this.deParaService.syncTransportadoras();
    res.status(200).json({
      success: true,
      message: 'De-para de transportadoras finalizado.',
      data: result,
    });
  };

  syncAll = async (_req: Request, res: Response) => {
    const results = await this.deParaService.syncAll();
    res.status(200).json({
      success: true,
      message: 'De-para completo finalizado.',
      data: results,
    });
  };

  manualMap = async (req: Request, res: Response) => {
    const input = validateDeParaManual(req.body);
    await this.deParaService.manualMap(input);
    res.status(200).json({
      success: true,
      message: 'Mapeamento manual realizado com sucesso.',
    });
  };

  getStatus = async (_req: Request, res: Response) => {
    const result = await this.deParaService.getStatus();
    res.status(200).json({
      success: true,
      data: result,
    });
  };

  getAssociations = async (req: Request, res: Response) => {
    const entity = String(req.params.entity);
    const result = await this.deParaService.getAssociations(entity);
    res.status(200).json({
      success: true,
      data: result,
    });
  };

  exportFormasPagamento = async (req: Request, res: Response) => {
    const filter = validateDeParaExportFilter(req.query.association);
    const source = validateDeParaExportSource(req.query.source);
    const buffer = await this.deParaService.generateFormasPagamentoExcel(filter, source);

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=formas_pagamento_${source}_${filter}.xlsx`,
    );
    res.status(200).send(buffer);
  };

  deleteAssociation = async (req: Request, res: Response) => {
    const entity = String(req.params.entity);
    const idBling = String(req.params.id_bling);
    await this.deParaService.deleteAssociation(entity, idBling);
    res.status(200).json({
      success: true,
      message: 'Associação excluída com sucesso.',
    });
  };

  // Unidades de Negócio
  listUnidadesNegocio = async (_req: Request, res: Response) => {
    const result = await this.deParaUnidadesNegocioRepo.findAll();
    res.status(200).json({
      success: true,
      data: result,
    });
  };

  createUnidadeNegocio = async (req: Request, res: Response) => {
    const { company_id_bling, unidade_negocio, nome } = req.body;
    if (!company_id_bling || !unidade_negocio || !nome) {
      res.status(400).json({
        success: false,
        message: 'company_id_bling, unidade_negocio e nome são obrigatórios.',
      });
      return;
    }
    const result = await this.deParaUnidadesNegocioRepo.create({
      company_id_bling,
      unidade_negocio,
      nome,
    });
    res.status(201).json({
      success: true,
      message: 'Mapeamento de unidade de negócio criado com sucesso.',
      data: result,
    });
  };

  deleteUnidadeNegocio = async (req: Request, res: Response) => {
    const id = String(req.params.id);
    await this.deParaUnidadesNegocioRepo.deleteById(id);
    res.status(200).json({
      success: true,
      message: 'Mapeamento de unidade de negócio excluído com sucesso.',
    });
  };
}
