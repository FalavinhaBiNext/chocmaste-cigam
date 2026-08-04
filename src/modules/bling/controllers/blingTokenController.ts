import { inject, injectable } from 'tsyringe';
import { Request, Response } from "express";
import { BlingTokenScheduler } from '../services/blingTokenScheduler';
import { logger } from '@/shared/utils/logger';

@injectable()
export class BlingTokenController {
  constructor(
    private readonly blingTokenScheduler: BlingTokenScheduler
  ) {}

  schedule = async (_req: Request, res: Response) => {
    logger.auth('Renovação preventiva acionada via schedule.');

    const result = await this.blingTokenScheduler.checkAndRefresh();

    res.status(200).json({
      success: true,
      message: result.message,
      data: result,
    });
  }
}
