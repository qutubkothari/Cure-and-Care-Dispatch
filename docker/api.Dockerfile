FROM node:20-alpine AS deps
WORKDIR /repo

COPY package.json package-lock.json ./
COPY apps/api/package.json ./apps/api/package.json
COPY apps/api/prisma ./apps/api/prisma
COPY packages/shared/package.json ./packages/shared/package.json

RUN npm ci

FROM node:20-alpine AS build
WORKDIR /repo

COPY --from=deps /repo/node_modules ./node_modules
COPY package.json package-lock.json ./
COPY apps/api ./apps/api
COPY packages/shared ./packages/shared

RUN npm run prisma:generate -w apps/api
RUN npm run build -w apps/api

FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

COPY --from=build /repo/apps/api/dist ./dist
COPY --from=build /repo/apps/api/package.json ./package.json
COPY --from=build /repo/node_modules ./node_modules
COPY --from=build /repo/apps/api/prisma ./prisma

EXPOSE 4000
CMD ["node", "dist/index.js"]
