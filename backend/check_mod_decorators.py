"""Check modules.py decorators."""
import sys
sys.stderr = sys.stdout
lines = open('/app/app/api/v1/endpoints/modules.py').readlines()
for i, l in enumerate(lines):
    if 'router.get' in l or 'router.post' in l:
        print(f"{i+1}: {l.rstrip()}")
