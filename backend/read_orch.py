"""Read orchestration engine."""
import sys
sys.stderr = sys.stdout
lines = open('/app/telegram_layer/src/orchestration/engine.py').readlines()
for l in lines[:80]:
    print(l, end='')
