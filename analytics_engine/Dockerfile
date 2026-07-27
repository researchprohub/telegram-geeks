# Deployment Dockerfile for Analytics Engine.
FROM python:3.12-slim

WORKDIR /app

COPY pyproject.toml .
RUN pip install --no-cache-dir -e .

COPY src/ ./src/

RUN groupadd -r appuser && useradd -r -g appuser appuser && chown -R appuser:appuser /app
USER appuser

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD python -c "import os; exit(0 if os.path.exists('/proc/self/status') else 1)"

CMD ["python", "-m", "analytics_engine.src.metrics"]
