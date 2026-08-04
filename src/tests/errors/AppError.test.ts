import { describe, it, expect } from 'vitest';
import {
  AppError,
  ValidationError,
  NotFoundError,
  ConflictError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  UnprocessableEntityError,
  TooManyRequestsError,
  InternalServerError,
  BadGatewayError,
  ServiceUnavailableError,
  GatewayTimeoutError,
  IntegrationError,
  UnauthorizedIntegrationError,
  RateLimitIntegrationError,
  ValidationIntegrationError,
} from '@/shared/errors/AppError';

describe('AppError', () => {
  it('should create with defaults', () => {
    const error = new AppError('test error');
    expect(error.message).toBe('test error');
    expect(error.statusCode).toBe(500);
    expect(error.isOperational).toBe(true);
    expect(error.details).toBeUndefined();
  });

  it('should create with custom status and details', () => {
    const error = new AppError('custom', 418, { foo: 'bar' });
    expect(error.statusCode).toBe(418);
    expect(error.details).toEqual({ foo: 'bar' });
  });
});

describe('ValidationError', () => {
  it('should have 400 status', () => {
    const error = new ValidationError();
    expect(error.statusCode).toBe(400);
    expect(error.message).toBe('Dados inválidos.');
  });
});

describe('NotFoundError', () => {
  it('should have 404 status', () => {
    const error = new NotFoundError();
    expect(error.statusCode).toBe(404);
    expect(error.message).toBe('Recurso não encontrado.');
  });
});

describe('ConflictError', () => {
  it('should have 409 status', () => {
    const error = new ConflictError();
    expect(error.statusCode).toBe(409);
  });
});

describe('BadRequestError', () => {
  it('should have 400 status', () => {
    const error = new BadRequestError();
    expect(error.statusCode).toBe(400);
  });
});

describe('UnauthorizedError', () => {
  it('should have 401 status', () => {
    const error = new UnauthorizedError();
    expect(error.statusCode).toBe(401);
  });
});

describe('ForbiddenError', () => {
  it('should have 403 status', () => {
    const error = new ForbiddenError();
    expect(error.statusCode).toBe(403);
  });
});

describe('UnprocessableEntityError', () => {
  it('should have 422 status', () => {
    const error = new UnprocessableEntityError();
    expect(error.statusCode).toBe(422);
  });
});

describe('TooManyRequestsError', () => {
  it('should have 429 status', () => {
    const error = new TooManyRequestsError();
    expect(error.statusCode).toBe(429);
  });
});

describe('InternalServerError', () => {
  it('should have 500 status', () => {
    const error = new InternalServerError();
    expect(error.statusCode).toBe(500);
  });
});

describe('BadGatewayError', () => {
  it('should have 502 status', () => {
    const error = new BadGatewayError();
    expect(error.statusCode).toBe(502);
  });
});

describe('ServiceUnavailableError', () => {
  it('should have 503 status', () => {
    const error = new ServiceUnavailableError();
    expect(error.statusCode).toBe(503);
  });
});

describe('GatewayTimeoutError', () => {
  it('should have 504 status', () => {
    const error = new GatewayTimeoutError();
    expect(error.statusCode).toBe(504);
  });
});

describe('IntegrationError', () => {
  it('should have 502 status', () => {
    const error = new IntegrationError();
    expect(error.statusCode).toBe(502);
    expect(error.message).toBe('Erro na integração externa.');
  });
});

describe('UnauthorizedIntegrationError', () => {
  it('should have 401 status', () => {
    const error = new UnauthorizedIntegrationError();
    expect(error.statusCode).toBe(401);
  });
});

describe('RateLimitIntegrationError', () => {
  it('should have 429 status', () => {
    const error = new RateLimitIntegrationError();
    expect(error.statusCode).toBe(429);
  });
});

describe('ValidationIntegrationError', () => {
  it('should have 422 status', () => {
    const error = new ValidationIntegrationError();
    expect(error.statusCode).toBe(422);
  });
});
