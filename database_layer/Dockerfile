# Deployment Dockerfile for Database Layer.
FROM python:3.12-slim

WORKDIR /app

COPY pyproject.toml .
RUN pip install --no-cache-dir -e .

COPY src/ ./src/

CMD ["python", "-c", "import time; print('Database layer ready'); while True: time.sleep(3600)"]
