"""Debug full app route resolution."""
import sys
sys.stderr = sys.stdout
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app, raise_server_exceptions=False)

# Test specific paths
paths = [
    "/api/v1/orchestrate/accounts",
    "/api/v1/orchestrate/router/stats",
    "/api/v1/modules",
    "/api/v1/modules/plans",
    "/api/v1/auth/login",
    "/api/v1/accounts",
]

for path in paths:
    resp = client.get(path)
    print(f"{path}: {resp.status_code} {resp.text[:80]}")
