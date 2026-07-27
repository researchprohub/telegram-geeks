# Docker Hosting Plan — TelegramGeeks

## Overview
Host the complete TelegramGeeks SaaS platform locally using Docker Compose for development and testing.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Docker Compose Stack                     │
├─────────────┬──────────────┬──────────────┬────────────────┤
│  Nginx      │  Backend     │  Frontend    │  Admin         │
│  (Port 80)  │  (Port 8000) │  (Port 3000) │  (Port 8080)   │
│  Reverse    │  FastAPI     │  Next.js     │  Admin Panel   │
│  Proxy      │  + Celery    │  SSR         │  (same as FE)  │
├─────────────┼──────────────┼──────────────┼────────────────┤
│  PostgreSQL │  Redis       │  Ollama      │  MinIO         │
│  (Port 5432)│  (Port 6379) │  (Port 11434)│  (Port 9000)   │
│  15GB vol   │  2GB vol     │  GPU optional│  S3 compat     │
└─────────────┴──────────────┴──────────────┴────────────────┘
```

## Services Breakdown

### 1. PostgreSQL (Primary Database)
- **Image:** `postgres:16-alpine`
- **Ports:** 5432
- **Volumes:** `pg-data:/var/lib/postgresql/data`
- **Config:**
  ```yaml
  POSTGRES_DB: telegramgeeks
  POSTGRES_USER: tg_admin
  POSTGRES_PASSWORD: ${DB_PASSWORD}
  POSTGRES_INITDB_ARGS: --auth-host=scram-sha-256
  ```
- **Storage:** 15GB minimum (accounts, campaigns, analytics)

### 2. Redis (Cache + Message Queue)
- **Image:** `redis:7-alpine`
- **Ports:** 6379
- **Volumes:** `redis-data:/data`
- **Config:**
  ```yaml
  redis-server --maxmemory 2gb --maxmemory-policy allkeys-lru
  ```
- **Usage:** Session cache, rate limiting, Celery broker, Pub/Sub

### 3. Backend (FastAPI + Celery Workers)
- **Build:** `./backend` (multi-stage Dockerfile)
- **Ports:** 8000 (API), 9090 (Prometheus metrics)
- **Services:**
  - `fastapi-main`: Main API server (uvicorn)
  - `celery-worker`: Background task processor
  - `celery-beat`: Scheduled task runner
- **Volumes:** `./backend:/app` (development mount)
- **Env:** `.env` file with API keys

### 4. Frontend (Next.js)
- **Build:** `./frontend` (multi-stage Dockerfile)
- **Ports:** 3000
- **Commands:** `npm run build && npm start`
- **Volumes:** `./frontend:/app` (development mount)

### 5. Nginx (Reverse Proxy)
- **Image:** `nginx:alpine`
- **Ports:** 80 (HTTP), 443 (HTTPS)
- **Config:** Routes to backend/frontend based on path
  - `/api/*` → backend:8000
  - `/admin/*` → backend:8000/admin
  - `/*` → frontend:3000

### 6. Ollama (Local AI Inference)
- **Image:** `ollama/ollama:latest`
- **Ports:** 11434
- **Volumes:** `ollama-data:/root/.ollama`
- **GPU:** Optional NVIDIA runtime for local models
- **Models:** Pre-loaded llama3.1:8b, mistral:7b, qwen2.5:7b

### 7. MinIO (Object Storage)
- **Image:** `minio/minio:latest`
- **Ports:** 9000 (API), 9001 (Console)
- **Volumes:** `minio-data:/data`
- **Purpose:** Store session files, TData exports, user uploads

## Docker Compose File

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: telegramgeeks
      POSTGRES_USER: tg_admin
      POSTGRES_PASSWORD: ${DB_PASSWORD:-changeme}
    volumes:
      - pg-data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U tg_admin"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    command: redis-server --maxmemory 2gb --maxmemory-policy allkeys-lru
    volumes:
      - redis-data:/data
    ports:
      - "6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    build: ./backend
    environment:
      DATABASE_URL: postgresql+asyncpg://tg_admin:${DB_PASSWORD:-changeme}@postgres:5432/telegramgeeks
      REDIS_URL: redis://redis:6379/0
      TELEGRAM_API_ID: ${TELEGRAM_API_ID}
      TELEGRAM_API_HASH: ${TELEGRAM_API_HASH}
      JWT_SECRET: ${JWT_SECRET:-dev-secret-change-me}
      OPENAI_API_KEY: ${OPENAI_API_KEY:-}
      GROQ_API_KEY: ${GROQ_API_KEY:-}
      OLLAMA_BASE_URL: http://ollama:11434
      MINIO_ENDPOINT: minio:9000
      MINIO_ACCESS_KEY: ${MINIO_ACCESS_KEY:-minioadmin}
      MINIO_SECRET_KEY: ${MINIO_SECRET_KEY:-minioadmin}
    volumes:
      - ./backend:/app
    ports:
      - "8000:8000"
      - "9090:9090"
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    restart: unless-stopped

  celery-worker:
    build: ./backend
    command: celery -A app.celery worker --loglevel=info
    environment:
      DATABASE_URL: postgresql+asyncpg://tg_admin:${DB_PASSWORD:-changeme}@postgres:5432/telegramgeeks
      REDIS_URL: redis://redis:6379/0
    volumes:
      - ./backend:/app
    depends_on:
      - backend
    restart: unless-stopped

  frontend:
    build: ./frontend
    environment:
      NEXT_PUBLIC_API_URL: http://localhost:8000/api/v1
    volumes:
      - ./frontend:/app
      - /app/node_modules
    ports:
      - "3000:3000"
    depends_on:
      - backend
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
    ports:
      - "80:80"
      - "443:443"
    depends_on:
      - backend
      - frontend
    restart: unless-stopped

  ollama:
    image: ollama/ollama:latest
    volumes:
      - ollama-data:/root/.ollama
    ports:
      - "11434:11434"
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]
    restart: unless-stopped

  minio:
    image: minio/minio:latest
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: ${MINIO_ACCESS_KEY:-minioadmin}
      MINIO_ROOT_PASSWORD: ${MINIO_SECRET_KEY:-minioadmin}
    volumes:
      - minio-data:/data
    ports:
      - "9000:9000"
      - "9001:9001"
    restart: unless-stopped

volumes:
  pg-data:
  redis-data:
  ollama-data:
  minio-data:
```

## Environment Variables (.env)

```bash
# Database
DB_PASSWORD=your-secure-password-here

# Telegram API
TELEGRAM_API_ID=your_api_id
TELEGRAM_API_HASH=your_api_hash

# JWT
JWT_SECRET=your-jwt-secret-at-least-32-chars

# AI Providers (optional for local testing)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GROQ_API_KEY=gsk-...
GOOGLE_API_KEY=AIza-...

# MinIO
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin

# Ollama (for local AI)
OLLAMA_HOST=0.0.0.0
OLLAMA_KEEP_ALIVE=-1
```

## Quick Start

```bash
# 1. Clone and setup
cd telegram-geeks
cp .env.example .env
# Edit .env with your values

# 2. Pull and run Ollama models (optional, for local AI)
docker exec -it telegramgeeks-ollama-1 ollama pull llama3.1:8b
docker exec -it telegramgeeks-ollama-1 ollama pull mistral:7b

# 3. Start all services
docker compose up -d

# 4. Run database migrations
docker compose exec backend alembic upgrade head

# 5. Seed demo data
docker compose exec backend python scripts/seed_data.py

# 6. Access the platform
# Frontend: http://localhost:3000
# Admin: http://localhost:3000/admin
# API: http://localhost:8000/docs
# MinIO Console: http://localhost:9001
```

## Production Considerations

### SSL/TLS
- Use Let's Encrypt with certbot
- Configure nginx reverse proxy with SSL termination
- Enable HSTS headers

### Backups
```bash
# PostgreSQL daily backup
docker exec telegramgeeks-postgres-1 pg_dump -U tg_admin telegramgeeks > backup_$(date +%Y%m%d).sql

# Redis RDB persistence
# Already enabled in docker-compose config
```

### Monitoring
- Prometheus + Grafana stack (optional)
- Health check endpoints on all services
- Log aggregation with ELK stack

### Scaling
- Backend: Horizontal pod autoscaling (Kubernetes)
- Redis: Sentinel for high availability
- PostgreSQL: Read replicas for analytics
- Ollama: GPU cluster for local inference

## Resource Requirements

| Component | CPU | RAM | Disk |
|-----------|-----|-----|------|
| PostgreSQL | 1 core | 2 GB | 15 GB |
| Redis | 0.5 core | 2 GB | 1 GB |
| Backend | 1 core | 1 GB | 2 GB |
| Frontend | 0.5 core | 512 MB | 1 GB |
| Ollama | 2 cores | 8 GB | 20 GB |
| MinIO | 0.5 core | 512 MB | 10 GB |
| **Total** | **5 cores** | **14.5 GB** | **49 GB** |

Minimum viable setup (without Ollama): 2 cores, 4 GB RAM, 20 GB disk.
