# core-service — built from the monorepo root context.
FROM node:20-alpine AS base
WORKDIR /app
# Prisma engine detection needs the openssl CLI; without it Alpine defaults to
# the OpenSSL 1.1 engine, which cannot load against Alpine's OpenSSL 3.
RUN apk add --no-cache openssl
COPY package.json package-lock.json* tsconfig.base.json ./
COPY packages/types ./packages/types
COPY packages/service-kit ./packages/service-kit
COPY services/core-service ./services/core-service
RUN npm install --workspaces --include-workspace-root=false || npm install
RUN npm run build -w @ucc/types && npm run build -w @ucc/service-kit \
 && npm run build -w @ucc/core-service
EXPOSE 4002
CMD ["node", "services/core-service/dist/server.js"]
