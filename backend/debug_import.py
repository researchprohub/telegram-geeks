"""Debug import."""
import sys
sys.stderr = sys.stdout
try:
    from app.api.v1.endpoints import modules
    print("MODULES_IMPORT_OK")
    print("ROUTES:", [r.path for r in modules.router.routes])
except Exception as e:
    print(f"IMPORT_ERROR: {e}")
    import traceback
    traceback.print_exc()
