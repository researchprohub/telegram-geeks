"""Debug modules route registration."""
import sys
sys.stderr = sys.stdout
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

# Try GET /api/v1/modules
resp = client.get("/api/v1/modules")
print(f"GET /api/v1/modules: {resp.status_code} {resp.text[:200]}")

# Try GET /api/v1/modules/plans
resp2 = client.get("/api/v1/modules/plans")
print(f"GET /api/v1/modules/plans: {resp2.status_code} {resp2.text[:200]}")

# List all registered paths
print("\nALL PATHS:")
for route in app.routes:
    if hasattr(route, 'path'):
        print(f"  {route.path} [{route.methods}]")
    elif hasattr(route, 'include_context'):
        ctx = route.include_context
        print(f"  INCLUDED: prefix={ctx.prefix}")
        # Get routes from included router
        orig = ctx.included_router
        for r in orig.routes:
            if hasattr(r, 'path'):
                full_path = ctx.prefix + r.path
                print(f"    {full_path} [{r.methods}]")
