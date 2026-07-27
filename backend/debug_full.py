"""Debug full app routes."""
import sys
sys.stderr = sys.stdout
from app.main import app
for r in app.routes:
    tp = type(r).__name__
    if tp in ('Route', 'APIRoute'):
        print(f"{tp}: {r.path} [{getattr(r, 'methods', set())}]")
    elif tp == '_IncludedRouter':
        print(f"  {tp}: {r}")
        # Try to find routes via url_path_for
        try:
            # FastAPI stores routes internally
            for attr in dir(r):
                if 'route' in attr.lower() and not attr.startswith('_'):
                    val = getattr(r, attr)
                    if hasattr(val, '__iter__') and not isinstance(val, str):
                        try:
                            items = list(val)
                            if items:
                                print(f"    {attr}: {items[:3]}")
                        except:
                            pass
        except Exception as e:
            print(f"    error: {e}")
