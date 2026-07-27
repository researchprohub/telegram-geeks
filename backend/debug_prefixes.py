"""Force reimport and check prefixes."""
import sys
sys.stderr = sys.stdout
if 'app.api.v1.router' in sys.modules:
    del sys.modules['app.api.v1.router']
from app.api.v1.router import api_router
for inc in api_router.routes:
    ctx = inc.include_context
    print(f"prefix={ctx.prefix}")
