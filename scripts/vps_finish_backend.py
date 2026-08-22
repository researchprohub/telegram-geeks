import paramiko
import sys

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect("213.111.150.162", username="root", password="Tgwu7jGcPanE", timeout=20)

cmd = """
cd /opt/telegramgeeks
docker compose -f docker-compose.prod.yml build telegramgeeks-backend
docker compose -f docker-compose.prod.yml up -d --force-recreate telegramgeeks-backend
sleep 6
docker ps
echo ""
echo "=== LOGS ==="
docker logs telegramgeeks-backend --tail 40
echo ""
echo "=== API HEALTH TEST ==="
curl -s -i http://127.0.0.1:8002/api/v1/health || true
"""

print("Executing backend build and launch on VPS...")
stdin, stdout, stderr = ssh.exec_command(cmd, timeout=300)

while True:
    line = stdout.readline()
    if not line:
        break
    try:
        sys.stdout.write(line)
        sys.stdout.flush()
    except Exception:
        pass

err = stderr.read().decode('utf-8', errors='replace')
if err.strip():
    print("\n[STDERR]\n", err)

ssh.close()
