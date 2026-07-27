"""Debug route resolution with full inspection."""
import sys
sys.stderr = sys.stdout
from app.main import app

# Check all route paths
print("=== FULL ROUTE LIST ===")
for r in app.routes:
    tp = type(r).__name__
    if tp in ('Route', 'APIRoute'):
        print(f"{tp}: {r.path} [{getattr(r, 'methods', set())}]")
    elif tp == '_IncludedRouter':
        ctx = r.include_context
        prefix = ctx.prefix
        orig = ctx.included_router
        print(f"IncludedRouter: prefix={prefix}")
        for sr in orig.routes:
            st = type(sr).__name__
            if st in ('Route', 'APIRoute'):
                print(f"  {st}: {sr.path} [{getattr(sr, 'methods', set())}]")
