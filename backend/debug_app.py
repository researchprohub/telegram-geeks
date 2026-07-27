"""Debug app routes."""
import sys
sys.stderr = sys.stdout
from app.main import app
print("APP_ROUTES:")
for r in app.routes:
    print(f"  {type(r).__name__}: {getattr(r, 'path', 'N/A')} [{getattr(r, 'methods', set())}]")
