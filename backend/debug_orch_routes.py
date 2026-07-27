"""Debug orchestration routes in running container."""
import sys
sys.stderr = sys.stdout
from app.api.v1.endpoints.orchestration import router
print("Routes:")
for r in router.routes:
    print(f"  {r.path} [{r.methods}]")
