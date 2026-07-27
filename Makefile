.PHONY: build up down logs test lint migrate seed

# Project variables
PROJECT := telegram-engagement-platform
COMPOSE := docker compose -f docker-compose.yml

# Build all services
build:
	$(COMPOSE) build

# Start all services
up:
	$(COMPOSE) up -d

# Stop all services
down:
	$(COMPOSE) down

# View logs
logs:
	$(COMPOSE) logs -f

# Run database migrations
migrate:
	docker compose exec backend alembic upgrade head

# Seed demo data
seed:
	docker compose exec backend python scripts/seed_data.py

# Run tests
test:
	docker compose exec backend pytest -v

# Lint backend
lint:
	docker compose exec backend ruff check app/
	docker compose exec backend mypy app/

# Format code
format:
	docker compose exec backend ruff check --fix app/
	docker compose exec backend black app/

# Frontend dev
frontend-dev:
	cd frontend && npm run dev

# Backend dev
backend-dev:
	cd backend && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Rebuild and restart
restart: down up migrate

# Clean everything
clean:
	$(COMPOSE) down -v --remove-orphans
	rm -rf frontend/.next frontend/node_modules backend/__pycache__
