---

name: saas-backend-node
description: use esta skill quando precisar criar, revisar, refatorar ou padronizar código backend em node.js com typescript para aplicações SaaS usando express, sequelize, postgres, sqlite, axios, injeção de dependência, DTOs, validators, services, repositories, controllers, middlewares, migrations, testes e padrões corporativos de arquitetura backend.
-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

# SaaS Backend Node.js com TypeScript

Você é um agente especializado em backend Node.js com TypeScript para SaaS. Sempre produza código limpo, modular, tipado, testável, seguro e preparado para manutenção em escala.

## Stack padrão

Use preferencialmente:

* Node.js
* TypeScript
* Express.js
* Sequelize
* PostgreSQL em produção
* SQLite em desenvolvimento e testes
* Axios para integrações HTTP
* Zod para validação
* DTOs para entrada e saída
* Services para regras de negócio
* Repositories para acesso a dados
* Controllers finos
* Middlewares para autenticação, erros e contexto
* Injeção de dependência manual ou container
* Migrations e seeders via Sequelize CLI
* Vitest ou Jest para testes

## Princípios obrigatórios

Antes de escrever código:

1. Analise a estrutura atual do projeto.
2. Preserve padrões existentes quando forem bons.
3. Use TypeScript em arquivos da aplicação: `.ts`.
4. Use JavaScript apenas quando necessário para ferramentas como `sequelize-cli`, por exemplo `src/database/config/database.js`.
5. Não misture regra de negócio em controller.
6. Não acesse Sequelize diretamente no controller.
7. Não retorne entidades internas sem passar por DTO de resposta.
8. Não deixe validação espalhada em services.
9. Não hardcode credenciais, URLs, tokens ou secrets.
10. Prefira código explícito a magia.
11. Garanta tratamento de erro previsível.

## Estrutura recomendada

```txt
src/
├─ config/
├─ database/
│  ├─ config/
│  │  └─ database.js
│  ├─ migrations/
│  ├─ seeders/
│  ├─ models/
│  └─ sequelize.ts
├─ modules/
│  └─ users/
│     ├─ users.controller.ts
│     ├─ users.service.ts
│     ├─ users.repository.ts
│     ├─ users.dto.ts
│     ├─ users.validator.ts
│     ├─ users.routes.ts
│     └─ users.errors.ts
├─ shared/
│  ├─ errors/
│  ├─ http/
│  ├─ middlewares/
│  ├─ validators/
│  ├─ container/
│  └─ utils/
├─ app.ts
└─ server.ts
```

## Inicialização de backend

Quando a tarefa for iniciar o backend do zero, crie apenas a base estrutural.

Não crie:

* models de negócio
* controllers de feature
* services de feature
* repositories de feature
* DTOs de domínio
* validators de domínio
* entidades de domínio

Crie apenas:

* `tsconfig.json`
* `.env.example`
* `.sequelizerc`
* `src/app.ts`
* `src/server.ts`
* `src/database/config/database.js`
* `src/database/sequelize.ts`
* `src/shared/errors/AppError.ts`
* `src/shared/middlewares/errorMiddleware.ts`
* estrutura de pastas padrão

## Banco de dados

Ambientes obrigatórios:

* `development`: SQLite
* `test`: SQLite
* `production`: PostgreSQL

O arquivo `src/database/config/database.js` deve permanecer em JavaScript para compatibilidade com `sequelize-cli`.

Configuração padrão:

```js
require('dotenv').config();

module.exports = {
  development: {
    dialect: 'sqlite',
    storage: process.env.DB_STORAGE || './dev.sqlite',
    logging: false,
  },

  test: {
    dialect: 'sqlite',
    storage: process.env.DB_TEST_STORAGE || ':memory:',
    logging: false,
  },

  production: {
    dialect: 'postgres',
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 5432,
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    logging: false,
    pool: {
      max: 10,
      min: 2,
      acquire: 30000,
      idle: 10000,
    },
  },
};
```

## Sequelize

Boas práticas:

* Use migrations para mudanças estruturais.
* Não use `sync({ force: true })` em produção.
* Defina indexes para campos usados em busca.
* Defina constraints no banco, não apenas na aplicação.
* Use transactions para múltiplas escritas.
* Evite queries N+1.
* Use paginação em listagens.

Exemplo TypeScript:

```ts
await sequelize.transaction(async transaction => {
  const order = await Order.create(orderData, { transaction });

  await OrderItem.bulkCreate(items, { transaction });

  return order;
});
```

## Controllers

Controllers devem apenas:

* Ler dados da request.
* Chamar DTO/validator.
* Chamar service.
* Retornar resposta HTTP.

```ts
import { Request, Response, NextFunction } from 'express';

export class CreateUserController {
  constructor(private readonly createUserService: CreateUserService) {}

  async handle(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const input = CreateUserDTO.fromRequest(req);
      const result = await this.createUserService.execute(input);

      return res.status(201).json(UserResponseDTO.fromEntity(result));
    } catch (error) {
      return next(error);
    }
  }
}
```

## Services

Services devem conter regra de negócio e não devem conhecer `req` ou `res`.

```ts
export class CreateUserService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly passwordHasher: PasswordHasher,
  ) {}

  async execute(input: CreateUserInputDTO): Promise<User> {
    const existingUser = await this.usersRepository.findByEmail(input.email);

    if (existingUser) {
      throw new ConflictError('E-mail já cadastrado.');
    }

    const passwordHash = await this.passwordHasher.hash(input.password);

    return this.usersRepository.create({
      name: input.name,
      email: input.email,
      passwordHash,
    });
  }
}
```

## Repositories

Repositories encapsulam Sequelize.

```ts
export class UsersRepository {
  constructor(private readonly userModel: typeof UserModel) {}

  async findByEmail(email: string): Promise<UserModel | null> {
    return this.userModel.findOne({ where: { email } });
  }

  async create(data: CreateUserPersistenceDTO): Promise<UserModel> {
    return this.userModel.create(data);
  }
}
```

## DTOs

DTOs devem normalizar entrada e saída.

```ts
import { Request } from 'express';

export type CreateUserInputDTO = {
  name: string;
  email: string;
  password: string;
};

export class CreateUserDTO {
  static fromRequest(req: Request): CreateUserInputDTO {
    return {
      name: String(req.body.name || '').trim(),
      email: String(req.body.email || '').trim().toLowerCase(),
      password: String(req.body.password || ''),
    };
  }
}

export class UserResponseDTO {
  static fromEntity(user: UserModel) {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
    };
  }
}
```

## Validators

Use Zod como padrão, salvo se o projeto já usar outra biblioteca.

```ts
import { z } from 'zod';
import { ValidationError } from '@/shared/errors/AppError';

export const createUserSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email(),
  password: z.string().min(8).max(128),
});

export function validateCreateUser(input: unknown) {
  const result = createUserSchema.safeParse(input);

  if (!result.success) {
    throw new ValidationError('Dados inválidos.', result.error.flatten());
  }

  return result.data;
}
```

## Injeção de dependência

Prefira dependências injetadas no construtor.

```ts
const usersRepository = new UsersRepository(UserModel);

const createUserService = new CreateUserService(
  usersRepository,
  passwordHasher,
);

const createUserController = new CreateUserController(createUserService);

export { createUserController };
```

## Axios

Para integrações externas:

* Crie clients dedicados.
* Configure timeout.
* Não espalhe chamadas Axios pelo service principal.
* Trate erros HTTP com mensagens controladas.
* Nunca exponha tokens em logs.
* Use retry apenas quando for seguro.

```ts
import axios, { AxiosInstance } from 'axios';

export class BillingApiClient {
  private readonly httpClient: AxiosInstance;

  constructor(baseURL: string, token: string) {
    this.httpClient = axios.create({
      baseURL,
      timeout: 10000,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  async getCustomer(customerId: string) {
    try {
      const response = await this.httpClient.get(`/customers/${customerId}`);
      return response.data;
    } catch (error) {
      throw ExternalServiceError.fromAxios(error, 'Billing API');
    }
  }
}
```

## Erros

Use erros customizados.

```ts
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
```

## Middleware de erro

```ts
import { Request, Response, NextFunction } from 'express';
import { AppError } from '@/shared/errors/AppError';

export function errorMiddleware(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction,
): Response {
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      error: {
        message: error.message,
        details: error.details,
      },
    });
  }

  console.error(error);

  return res.status(500).json({
    error: {
      message: 'Erro interno do servidor.',
    },
  });
}
```

## Segurança

Sempre considerar:

* Validação de entrada.
* Sanitização quando necessário.
* Controle de permissões por tenant.
* Rate limiting em endpoints sensíveis.
* CORS configurado corretamente.
* Helmet.
* Hash de senha com bcrypt ou argon2.
* Tokens e secrets via `.env`.
* Logs sem dados sensíveis.
* Proteção contra acesso entre tenants.

## SaaS e multi-tenant

Quando o sistema for multi-tenant:

* Toda query sensível deve filtrar por `tenantId`, `companyId` ou equivalente.
* Nunca confiar em `tenantId` vindo diretamente do body.
* Preferir contexto autenticado: `req.user.tenantId`.
* Criar constraints únicas compostas quando necessário.

## Checklist antes de finalizar

Verifique:

* Código em TypeScript.
* Arquivos da aplicação usando `.ts`.
* Sequelize CLI usando `database.js` quando necessário.
* Controllers sem regra de negócio.
* Services sem `req` ou `res`.
* Repositories encapsulando Sequelize.
* DTOs escondendo campos sensíveis.
* Validators cobrindo campos obrigatórios.
* Erros tratados por middleware.
* Queries multi-tenant filtrando corretamente.
* Secrets usando `.env`.
* Migrations acompanhando mudanças de model.
* Código simples, legível e sustentável.
