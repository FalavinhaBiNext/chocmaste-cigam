FROM node:22-slim AS builder

WORKDIR /app

ENV NODE_ENV=development

COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src/ src/
RUN npm run build && cp -r src/database/config dist/database/config

FROM node:22-slim AS production

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm install --save-prod sequelize-cli tsconfig-paths && npm cache clean --force

COPY --from=builder /app/dist/ dist/
COPY .sequelizerc ./
COPY src/database/ src/database/
COPY docker-entrypoint.sh /usr/local/bin/

RUN chmod +x /usr/local/bin/docker-entrypoint.sh && chown -R node:node /app && \
    echo '{"compilerOptions":{"baseUrl":"./dist","paths":{"@/*":["*"]}}}' > tsconfig.json

USER node

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD curl -f http://localhost:${PORT:-3333}/api/v1/events/health || exit 1

EXPOSE 3333

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["node", "-r", "tsconfig-paths/register", "dist/server.js"]
