# UCC platform — orchestration shortcuts (run from apigateway-service/).
COMPOSE = docker compose -f docker-compose.yml

.PHONY: up down build logs ps restart migrate seed

up:            ## Build + start the whole stack (postgres, kong, services, web)
	$(COMPOSE) up --build -d

down:          ## Stop and remove containers
	$(COMPOSE) down

build:         ## Build all images
	$(COMPOSE) build

logs:          ## Tail logs
	$(COMPOSE) logs -f

ps:            ## Show running containers
	$(COMPOSE) ps

restart:       ## Restart the stack
	$(COMPOSE) down && $(COMPOSE) up --build -d

migrate:       ## Apply Prisma schema for every service
	$(COMPOSE) exec auth-service npm run db:push -w @ucc/auth-service

seed:          ## Seed demo data
	$(COMPOSE) exec auth-service npm run seed -w @ucc/auth-service
