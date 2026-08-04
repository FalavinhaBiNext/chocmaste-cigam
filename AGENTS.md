# AGENTS.md

## Quick commands

```bash
npm run dev          # Start dev server (ts-node-dev, port 3333)
npm run build        # Compile TypeScript to dist/
npm start            # Run compiled output
npm test             # Run vitest (in-memory SQLite)
npm run db:migrate   # Run Sequelize migrations
npm run db:seed      # Seed all tables
```

Run a single test file:
```bash
npx vitest run src/modules/bling/tests/blingService.test.ts
```

## Architecture

- **Entry**: `src/server.ts` → `src/app.ts` → `src/routes.ts`
- **All routes** are prefixed `/api/v1` (set in `app.ts`)
- **DI**: `tsyringe` — every service, repository, controller is `@injectable()` and registered as singleton in `src/shared/container/index.ts`
- **ORM**: Sequelize. Dev/test use SQLite; production uses PostgreSQL (see `src/database/config/database.js`)
- **Validation**: Zod validators live alongside modules as `<name>.validator.ts`
- **Path alias**: `@/*` → `src/*` (works in dev via `tsconfig-paths`, in Docker via runtime `tsconfig.json` rewrite)

## Module structure

Every domain module in `src/modules/<name>/` follows this layout:
```
controllers/   — Express request handlers
services/      — Business logic (@injectable)
repositories/  — Sequelize data access (@injectable)
dto/           — Data transfer objects
tests/         — Vitest unit/integration tests
routes/        — Express Router factories
<name>.validator.ts — Zod schemas
```

Two integration modules exist:
- `bling/` — Bling API v3 OAuth2 (products, contacts, orders, webhooks, sync)
- `cigam/` — CIGAM ERP integration (materials, clients, suppliers)

## Database

- **Migrations/seeds**: `src/database/migrations/` and `src/database/seeders/`
- **Config**: `.sequelizerc` points Sequelize CLI at `src/database/config/database.js`
- **Dev/test**: SQLite file (`dev.sqlite`) or in-memory (tests)
- **Production**: PostgreSQL — never hardcode connection strings

## Testing

- Framework: Vitest (config in `vitest.config.ts`)
- Test files: `src/**/*.test.ts`
- Setup: `src/tests/setup.ts` — loads `.env`, sets `NODE_ENV=test`, uses in-memory SQLite
- Tests use `supertest` for HTTP and mock repositories/services via `tsyringe`
- Timeout: 15s per test

## Docker

- Multi-stage build: `node:22-slim` builder → production
- Entry: `docker-entrypoint.sh` runs migrations then starts the server
- Healthcheck: `GET /api/v1/events/health`
- Production image installs `sequelize-cli` and `chalk@4` separately (ESM compatibility)

## Conventions

- Controllers: thin — extract input, call service, return JSON. Never put business logic in controllers.
- Services: use `@injectable()` + `@inject(RepositoryClass)` for dependencies
- Repositories: centralize all Sequelize queries. Controllers/services never call Sequelize directly.
- Errors: use `AppError` (domain) or `IntegrationError` (external APIs) from `src/shared/errors/AppError.ts`
- Logs: use `logger` from `@/shared/utils/logger` — never log tokens or secrets
- Zod validation: validators export functions like `validateSaveToken(body)` that throw on invalid input
