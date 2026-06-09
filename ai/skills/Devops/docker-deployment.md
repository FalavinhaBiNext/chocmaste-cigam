# Docker deployment reference

## Repository inspection signals
- Node.js: `package.json`, `package-lock.json`, `pnpm-lock.yaml`, `yarn.lock`, `next.config.*`, `vite.config.*`, `nest-cli.json`.
- Python: `pyproject.toml`, `requirements.txt`, `uv.lock`, `poetry.lock`, `manage.py`, `alembic.ini`.
- PHP/Laravel: `composer.json`, `artisan`, `public/`, `storage/`.
- Go: `go.mod`, `cmd/`, `main.go`.
- Java: `pom.xml`, `build.gradle`, `gradlew`.

## Dockerfile standards
- Prefer multi-stage builds for compiled or bundled apps.
- Copy dependency manifests before source to maximize cache reuse.
- Use lockfile-native commands: `npm ci`, `pnpm install --frozen-lockfile`, `yarn install --frozen-lockfile`, `poetry install --only main`, `pip install -r requirements.txt`.
- Run as non-root when feasible. Create an app user and set ownership only on required paths.
- Keep runtime image focused on runtime artifacts, not build tools.
- Add a health endpoint check only when the app exposes one. Otherwise prefer Compose healthcheck using TCP or avoid fake health checks.
- Use `ARG` for build-time values and `ENV` only for safe runtime defaults. Never bake secrets into an image.

## Docker Compose standards
- Use compose specification without obsolete `version` unless a user or platform requires it.
- Define one app service and add infrastructure services only when needed.
- Use named volumes for persistent state.
- Add `restart: unless-stopped` for long-running production-like services.
- Use `env_file: .env` and provide `.env.example` with placeholders.
- Avoid exposing databases publicly unless needed for local development; prefer internal service networking.
- Include health checks for databases and app services when reliable.

## .dockerignore baseline
Include at least: `.git`, `node_modules`, `dist`, `build`, `.next/cache`, `.env*`, logs, coverage, local uploads if not needed, IDE folders, OS files, and test artifacts that are not needed to build.

## Common app patterns
### Next.js standalone
Use `output: 'standalone'` when possible. Copy `.next/standalone`, `.next/static`, and `public` into a slim Node runtime. Default port: `3000`.

### Vite/static frontend
Build with Node, serve static output through nginx or a simple static server. For Coolify, static site build may be easier than a container unless SSR/API is required.

### Node API
Install production dependencies only in runtime stage or prune dev dependencies after build. Default entrypoint from `package.json` scripts.

### Python API
Use slim Python base images, install system packages only when required, avoid writing `.pyc`, and use `gunicorn`/`uvicorn` for production instead of dev servers.

### Laravel
Separate PHP-FPM/app, queue worker, scheduler, and web server only when necessary. Persist `storage/` and configure `APP_KEY`, database, cache, and queue env vars.
