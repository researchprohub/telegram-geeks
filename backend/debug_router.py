"""Debug router."""
import sys
sys.stderr = sys.stdout
from app.api.v1.router import api_router
print("ALL_ROUTES:")
for r in api_router.routes:
    attrs = dir(r)
    print(f"  type={type(r).__name__} attrs={[a for a in attrs if not a.startswith('_')]}")
    if hasattr(r, 'routes'):
        for sr in r.routes:
            print(f"    sub: {sr.path} {sr.methods}")
