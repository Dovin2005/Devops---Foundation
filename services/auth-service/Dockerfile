FROM node:20-alpine AS base

WORKDIR /app

RUN apk add --no-cache openssl ca-certificates \
    && update-ca-certificates

COPY package.json package-lock.json* tsconfig.base.json ./
COPY packages/types ./packages/types
COPY packages/service-kit ./packages/service-kit
COPY services/auth-service ./services/auth-service

RUN npm install --workspaces --include-workspace-root=false || npm install

RUN npm run build -w @ucc/types \
 && npm run build -w @ucc/service-kit \
 && npm run build -w @ucc/auth-service

EXPOSE 4001

CMD ["node", "services/auth-service/dist/server.js"]
