FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src/ src/
RUN npm run build

FROM node:22-alpine AS production

WORKDIR /app

RUN apk add --no-cache curl

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm install --save-prod sequelize-cli && npm cache clean --force

COPY --from=builder /app/dist/ dist/
COPY docker-entrypoint.sh /usr/local/bin/

RUN chmod +x /usr/local/bin/docker-entrypoint.sh && chown -R node:node /app

USER node

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD curl -f http://localhost:${PORT:-3333}/api/v1/events/health || exit 1

EXPOSE 3333

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["node", "dist/server.js"]
