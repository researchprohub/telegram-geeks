"""Check modules router redirect_slashes."""
import sys
sys.stderr = sys.stdout
from app.api.v1.endpoints.modules import router
print("redirect_slashes:", router.redirect_slashes)
