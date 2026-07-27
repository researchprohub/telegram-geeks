"""Debug router module location."""
import sys
sys.stderr = sys.stdout
from app.api.v1 import router as r
print("ROUTER FILE:", r.__file__)
for inc in r.api_router.routes:
    ctx = inc.include_context
    print(f"  prefix={ctx.prefix}")
