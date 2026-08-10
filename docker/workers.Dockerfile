FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile --prod
FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY . .
CMD ["node", "--disable-warning=MODULE_TYPELESS_PACKAGE_JSON", "--experimental-strip-types", "lib/workers/outbox-dispatcher-worker.ts"]
