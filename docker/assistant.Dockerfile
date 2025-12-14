FROM node:20-alpine AS deps
WORKDIR /repo

COPY package.json package-lock.json ./
COPY apps/assistant/package.json ./apps/assistant/package.json

RUN npm ci

FROM node:20-alpine AS build
WORKDIR /repo

COPY --from=deps /repo/node_modules ./node_modules
COPY package.json package-lock.json ./
COPY apps/assistant ./apps/assistant

RUN npm run build -w apps/assistant

FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

COPY --from=build /repo/apps/assistant/dist ./dist
COPY --from=build /repo/apps/assistant/package.json ./package.json
COPY --from=build /repo/node_modules ./node_modules

EXPOSE 4100
CMD ["node", "dist/index.js"]
