import { inject, injectable } from 'tsyringe';
import { Request, Response } from 'express';
import { DeParaService } from '../services/deparaService';
import {
  validateDeParaSync,
  validateDeParaManual,
  validateDeParaExportFilter,
  validateDeParaExportSource,
} from '../depara.validator';

@injectable()
export class DeParaController {
  constructor(
    @inject(DeParaService) private readonly deParaService: DeParaService
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
}
