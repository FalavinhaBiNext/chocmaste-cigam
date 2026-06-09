# Coolify deployment reference

## General guidance
- Coolify can deploy from Git repositories, Dockerfiles, Docker Compose files, or container images. Choose the path that matches the user's repository and operational preference.
- For simple single-service apps, provide a Dockerfile and let Coolify build from Git.
- For apps needing database/cache/worker services, provide Docker Compose and mark which environment variables must be set in Coolify.
- Avoid hardcoding domains, secrets, or production credentials in Compose files.

## Coolify-ready conventions
- App service should listen on `0.0.0.0`, not localhost.
- Expose the internal application port clearly, commonly `3000`, `8000`, `8080`, or framework-specific defaults.
- Use environment variables for `DATABASE_URL`, `REDIS_URL`, app secret keys, and public URLs.
- Persistent data should use named volumes and explicit mount paths.
- If behind Coolify proxy, app should trust proxy headers only when the framework requires it and the setting is safe.

## Compose for Coolify
- Keep service names stable and lowercase.
- Do not bind host ports for internal databases unless the user requests external access.
- For the main app, document the internal port Coolify should route to.
- Include `depends_on` with health conditions for databases when supported by the Compose target.

## Deployment notes to include
- Required env vars.
- Build command or Dockerfile path.
- Internal port.
- Persistent volumes.
- Post-deploy commands such as migrations, if the stack requires them.
- Rollback approach: redeploy previous commit or previous image tag.
