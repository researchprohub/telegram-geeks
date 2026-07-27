"""Force fresh import and check prefixes."""
import sys
sys.stderr = sys.stdout
for k in list(sys.modules.keys()):
    if 'app' in k:
        del sys.modules[k]
from app.api.v1.router import api_router
for inc in api_router.routes:
    ctx = inc.include_context
    print(f"prefix={ctx.prefix}")
