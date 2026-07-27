# Deployment Guide

## Local Development

```bash
# 1. Clone and setup
cd telegram-engagement-platform
cp backend/.env.example backend/.env
cp ai_engine/.env.example ai_engine/.env
cp frontend/.env.example frontend/.env

# 2. Start infrastructure
docker compose up -d postgres redis ollama

# 3. Run migrations
cd backend && alembic upgrade head && cd ..

# 4. Start backend
cd backend && uvicorn app.main:app --reload

# 5. Start frontend (new terminal)
cd frontend && npm install && npm run dev
```

Visit http://localhost:3000

## Production Deployment

### Prerequisites
- Docker & Docker Compose
- SSL certificates (Let's Encrypt recommended)
- Domain name pointing to your server
- Minimum 4GB RAM, 2 vCPU

### Steps

1. **Configure environment**
```bash
cp backend/.env.example backend/.env
# Edit .env with production values:
# - Strong JWT_SECRET
# - Production DATABASE_URL
# - API keys for OpenAI/Anthropic/Groq
```

2. **Build and start**
```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

3. **Run migrations**
```bash
docker compose exec backend alembic upgrade head
```

4. **Setup SSL with nginx-proxy-acme**
```bash
# Add to docker-compose.yml:
#   image: jrcs/mariomax/nginx-proxy-acme
#   volumes:
#     - certs:/etc/nginx/certs
#   environment:
#     - DEFAULT_EMAIL=admin@example.com
```

5. **Backup strategy**
```bash
# Daily PostgreSQL backup
docker exec tep_postgres pg_dump -U postgres tep > backup_$(date +%Y%m%d).sql

# Redis persistence
# Enable RDB in docker-compose redis config
```

### Monitoring
- Prometheus + Grafana for metrics
- Log aggregation with Loki/ELK
- Uptime monitoring (UptimeRobot, Pingdom)

### Scaling
- Add more backend replicas behind nginx
- Use PostgreSQL read replicas for analytics
- Deploy Ollama on GPU-enabled instances for local AI
