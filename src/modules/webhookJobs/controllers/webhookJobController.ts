import { inject, injectable } from 'tsyringe';
import { Request, Response } from 'express';
import { WebhookJobService } from '../services/webhookJobService';
import { validateListWebhookJobsQuery } from '../webhookJobs.validator';

@injectable()
export class WebhookJobController {
    constructor(
        @inject(WebhookJobService) private readonly webhookJobService: WebhookJobService,
    ) {}

    findAll = async (req: Request, res: Response) => {
        const { status } = validateListWebhookJobsQuery(req.query);
        const jobs = await this.webhookJobService.listar(status);

        res.status(200).json({
            success: true,
            message: 'Jobs de webhook recuperados com sucesso.',
            data: jobs,
        });
    }

    reprocessar = async (req: Request, res: Response) => {
        await this.webhookJobService.reprocessar(String(req.params.id));

        res.status(200).json({
            success: true,
            message: 'Job recolocado na fila para processamento.',
        });
    }
}
