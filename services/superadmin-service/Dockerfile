# superadmin-service — built from the monorepo root context.
FROM node:20-alpine AS base
WORKDIR /app
COPY package.json package-lock.json* tsconfig.base.json ./
COPY packages/types ./packages/types
COPY packages/service-kit ./packages/service-kit
COPY services/superadmin-service ./services/superadmin-service
RUN npm install --workspaces --include-workspace-root=false || npm install
RUN npm run build -w @ucc/types && npm run build -w @ucc/service-kit \
 && npm run build -w @ucc/superadmin-service
EXPOSE 4007
CMD ["node", "services/superadmin-service/dist/server.js"]
