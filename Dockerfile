FROM node:22-slim AS builder

WORKDIR /app

ENV NODE_ENV=development
# Build só compila TS, não precisa de um Chromium funcional — evita baixar o binário aqui.
ENV PUPPETEER_SKIP_DOWNLOAD=true

COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src/ src/
RUN npm run build && cp -r src/database/config dist/database/config

FROM node:22-slim AS production

WORKDIR /app

# "chromium" via apt resolve sozinho as libs de sistema necessárias (libnss3, libgbm1
# etc.) — mais confiável em Debian do que listar manualmente as deps do Chromium que
# o Puppeteer baixaria por conta própria. Usado pra renderizar a etiqueta da Tray (HTML)
# em PDF antes de juntar com a etiqueta do marketplace/ERP.
RUN apt-get update && apt-get install -y --no-install-recommends curl chromium && rm -rf /var/lib/apt/lists/*

ENV PUPPETEER_SKIP_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm install --save-prod sequelize-cli tsconfig-paths && npm install chalk@4 && npm cache clean --force

COPY --from=builder /app/dist/ dist/
COPY .sequelizerc ./
COPY src/database/ src/database/
COPY docker-entrypoint.sh /usr/local/bin/

RUN chmod +x /usr/local/bin/docker-entrypoint.sh && chown -R node:node /app && \
    echo '{"compilerOptions":{"baseUrl":"./dist","paths":{"@/*":["*"]}}}' > tsconfig.json

USER node

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD curl -f http://localhost:${PORT:-3000}/api/v1/events/health || exit 1

EXPOSE 3000

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["node", "-r", "tsconfig-paths/register", "dist/server.js"]
