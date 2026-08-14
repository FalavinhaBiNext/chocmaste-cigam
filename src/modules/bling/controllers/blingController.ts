import { inject, injectable } from 'tsyringe';
import { Request, Response } from "express";
import { BlingService } from '../services/blingService';
import { BlingRepository } from '../repositories/blingRepository';
import { validateSaveToken } from '../bling.validator';
import { logger } from '@/shared/utils/logger';

@injectable()
export class BlingController {
  constructor(
    private readonly blingService: BlingService,
    private readonly blingRepository: BlingRepository
  ) {}

  auth = (req: Request, res: Response) => {
    const clientId = req.query.client_id as string | undefined;
    const clientSecret = req.query.client_secret as string | undefined;
    const { url } = this.blingService.generateAuthURL(undefined, clientId, clientSecret);
    logger.auth('Redirecionando para autorização Bling');
    return res.redirect(url);
  };

  callback = async (req: Request, res: Response) => {
    const code = String(req.query.code ?? '');
    const stateParam = req.query.state as string | undefined;

    let clientId: string | undefined;
    let clientSecret: string | undefined;

    // Extrair client_id e client_secret do state
    if (stateParam) {
      try {
        const stateData = JSON.parse(Buffer.from(stateParam, 'base64').toString());
        clientId = stateData.client_id;
        clientSecret = stateData.client_secret;
      } catch {
        // Se não conseguir decodificar, usa os valores do body ou query
        clientId = req.query.client_id as string | undefined;
        clientSecret = req.query.client_secret as string | undefined;
      }
    }

    await this.blingService.handleCallback(code, clientId, clientSecret);
    return res.json({
      success: true,
      message: 'Autenticação Bling realizada com sucesso.'
    });
  };

  refresh = async (_req: Request, res: Response) => {
    await this.blingService.refreshToken();
    return res.json({
      success: true,
      message: 'Token Bling renovado com sucesso.'
    });
  };

  status = async (_req: Request, res: Response) => {
    const result = await this.blingService.getTokenStatus();
    return res.json({
      success: true,
      data: result
    });
  };

  saveToken = async (req: Request, res: Response) => {
    const input = validateSaveToken(req.body);
    await this.blingService.manualSaveToken(input);
    logger.success('Token Bling salvo manualmente');
    return res.status(201).json({
      success: true,
      message: 'Token Bling salvo com sucesso.'
    });
  };

  listTokens = async (_req: Request, res: Response) => {
    const tokens = await this.blingRepository.findAll();
    // Retornar tokens com informações necessárias
    const safeTokens = tokens.map(t => ({
      id: t.id,
      active: t.active,
      nome_unidade: t.nome_unidade,
      company_id_bling: t.company_id_bling,
      client_id: t.client_id,
      client_secret: t.client_secret ? '••••••••' : null, // Mascarar por segurança
      expires_at: t.expires_at,
      created_at: t.created_at,
    }));
    return res.json({
      success: true,
      data: safeTokens
    });
  };

  activateToken = async (req: Request, res: Response) => {
    const id = String(req.params.id);
    const token = await this.blingRepository.findById(id);
    if (!token) {
      return res.status(404).json({
        success: false,
        message: 'Token não encontrado.'
      });
    }
    await this.blingRepository.update(id, { active: true });
    logger.success(`Token ${id} ativado com sucesso`);
    return res.json({
      success: true,
      message: 'Token ativado com sucesso.'
    });
  };

  updateToken = async (req: Request, res: Response) => {
    const id = String(req.params.id);
    const { nome_unidade, company_id_bling, client_id, client_secret } = req.body;
    const token = await this.blingRepository.findById(id);
    if (!token) {
      return res.status(404).json({
        success: false,
        message: 'Token não encontrado.'
      });
    }
    await this.blingRepository.update(id, { nome_unidade, company_id_bling, client_id, client_secret });
    logger.success(`Token ${id} atualizado com sucesso`);
    return res.json({
      success: true,
      message: 'Token atualizado com sucesso.'
    });
  };

  deleteToken = async (req: Request, res: Response) => {
    const id = String(req.params.id);
    const token = await this.blingRepository.findById(id);
    if (!token) {
      return res.status(404).json({
        success: false,
        message: 'Token não encontrado.'
      });
    }
    await this.blingRepository.update(id, { active: false });
    logger.success(`Token ${id} desativado com sucesso`);
    return res.json({
      success: true,
      message: 'Token desativado com sucesso.'
    });
  };
}
