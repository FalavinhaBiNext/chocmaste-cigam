export class AppError extends Error {
  public readonly statusCode: number;
  public readonly details?: unknown;
  public readonly isOperational = true;

  constructor(message: string, statusCode = 500, details?: unknown) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.details = details;
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Dados inválidos.', details?: unknown) {
    super(message, 400, details);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Recurso não encontrado.') {
    super(message, 404);
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Conflito de dados.') {
    super(message, 409);
  }
}

export class BadRequestError extends AppError {
  constructor(message = 'Requisição inválida.') {
    super(message, 400);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Não autorizado.') {
    super(message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Acesso proibido.') {
    super(message, 403);
  }
}

export class UnprocessableEntityError extends AppError {
  constructor(message = 'Entidade não processável.', details?: unknown) {
    super(message, 422, details);
  }
}

export class TooManyRequestsError extends AppError {
  constructor(message = 'Muitas requisições.') {
    super(message, 429);
  }
}

export class InternalServerError extends AppError {
  constructor(message = 'Erro interno do servidor.', details?: unknown) {
    super(message, 500, details);
  }
}

export class BadGatewayError extends AppError {
  constructor(message = 'Erro no gateway.') {
    super(message, 502);
  }
}

export class ServiceUnavailableError extends AppError {
  constructor(message = 'Serviço indisponível.') {
    super(message, 503);
  }
}

export class GatewayTimeoutError extends AppError {
  constructor(message = 'Tempo limite do gateway excedido.') {
    super(message, 504);
  }
}

export class IntegrationError extends AppError {
  constructor(message = 'Erro na integração externa.', details?: unknown) {
    super(message, 502, details);
  }
}

export class UnauthorizedIntegrationError extends AppError {
  constructor(message = 'Token de integração inválido ou expirado.') {
    super(message, 401);
  }
}

export class RateLimitIntegrationError extends AppError {
  constructor(message = 'Limite de requisições da integração excedido.') {
    super(message, 429);
  }
}

export class ValidationIntegrationError extends AppError {
  constructor(message = 'Dados inválidos enviados para integração.', details?: unknown) {
    super(message, 422, details);
  }
}

export class RefreshTokenExpiredError extends AppError {
  public readonly authUrl: string | null;

  constructor(message = 'Refresh token expirado. É necessário autenticar novamente.', authUrl?: string) {
    super(message, 401);
    this.authUrl = authUrl || null;
  }
}
