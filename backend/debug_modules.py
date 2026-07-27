"""Debug modules import."""
import sys
sys.stderr = sys.stdout
try:
    from app.api.v1.endpoints.modules import router
    print("PREFIX:", router.prefix)
    print("ROUTES:")
    for r in router.routes:
        print(f"  {r.path} [{r.methods}]")
except Exception as e:
    print(f"ERROR: {e}")
    import traceback
    traceback.print_exc()
