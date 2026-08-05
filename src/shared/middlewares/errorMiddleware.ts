import { Request, Response, NextFunction } from 'express';
import { AppError, RefreshTokenExpiredError } from '@/shared/errors/AppError';
import { logger } from '@/shared/utils/logger';

export function errorMiddleware(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction,
): Response {
  if (error instanceof RefreshTokenExpiredError) {
    return res.status(error.statusCode).json({
      error: {
        type: 'auth_required',
        message: error.message,
        authUrl: error.authUrl,
      },
    });
  }

  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      error: {
        message: error.message,
        details: error.details,
      },
    });
  }

  logger.error(error.message || 'Erro interno do servidor.');

  return res.status(500).json({
    error: {
      message: 'Erro interno do servidor.',
    },
  });
}