# GitHub Actions reference

## Workflow standards
- Place workflows under `.github/workflows/`.
- Use least privilege `permissions:`.
- Use official actions pinned to stable major versions, for example `actions/checkout@v4`, `docker/setup-buildx-action@v3`, `docker/login-action@v3`, `docker/build-push-action@v6`.
- Cache package manager dependencies where reliable, but do not let cache complexity obscure correctness.
- Split test and publish jobs when useful. Publish images only on trusted branches/tags.
- Use GitHub secrets for credentials. Never echo secrets.

## Docker image publish pattern
Prefer GitHub Container Registry unless the user specifies another registry.
- Registry: `ghcr.io`
- Image: `ghcr.io/<owner>/<repo>`
- Tags: branch SHA, `latest` on main, semver tags on releases.
- Required permissions: `contents: read`, `packages: write`.

## Minimal CI gates
- Checkout.
- Install dependencies with lockfile command.
- Run lint/tests when scripts exist.
- Build Docker image.
- Push only for main/tags or when requested.

## Coolify deploy trigger
If deploying from GitHub to Coolify, prefer Coolify's Git integration or webhook trigger. When generating a workflow-based trigger, use a secret such as `COOLIFY_WEBHOOK_URL` and call it after a successful image push or after main branch tests pass.
