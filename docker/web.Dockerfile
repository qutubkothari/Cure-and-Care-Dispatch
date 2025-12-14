FROM node:20-alpine AS deps
WORKDIR /repo

COPY package.json package-lock.json ./
COPY apps/web/package.json ./apps/web/package.json

RUN npm ci

FROM node:20-alpine AS build
WORKDIR /repo

COPY --from=deps /repo/node_modules ./node_modules
COPY package.json package-lock.json ./
COPY apps/web ./apps/web

RUN npm run build -w apps/web

FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

# Next.js standalone output
COPY --from=build /repo/apps/web/.next/standalone ./
COPY --from=build /repo/apps/web/.next/static ./.next/static
COPY --from=build /repo/apps/web/public ./public

EXPOSE 3000
ENV PORT=3000
CMD ["node", "server.js"]
