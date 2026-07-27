"""Debug orchestration routes."""
import sys
sys.stderr = sys.stdout
from app.api.v1.endpoints.orchestration import router
print("PREFIX:", router.prefix)
for r in router.routes:
    print(f"  {r.path} [{r.methods}]")
