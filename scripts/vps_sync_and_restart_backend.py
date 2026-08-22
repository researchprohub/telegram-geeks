import paramiko
from scp import SCPClient
import sys

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect("213.111.150.162", username="root", password="Tgwu7jGcPanE", timeout=15)

with SCPClient(ssh.get_transport()) as scp:
    scp.put("backend/app/services/license_service.py", remote_path="/opt/telegramgeeks/backend/app/services/license_service.py")
    scp.put("backend/app/api/v1/endpoints/licenses.py", remote_path="/opt/telegramgeeks/backend/app/api/v1/endpoints/licenses.py")
print("Uploaded updated license files to VPS")

cmd = """
cd /opt/telegramgeeks
docker compose -f docker-compose.prod.yml restart telegramgeeks-backend
sleep 4
docker ps
echo ""
echo "=== BACKEND DOCKER LOGS ==="
docker logs telegramgeeks-backend --tail 40
echo ""
echo "=== HEALTH CHECK (Port 8002) ==="
curl -s -i http://127.0.0.1:8002/api/v1/health || true
echo ""
echo "=== HOST NGINX API PROXY TEST ==="
curl -s -i -k https://127.0.0.1/api/v1/health -H "Host: telegramgeekspro.com" || true
"""

stdin, stdout, stderr = ssh.exec_command(cmd, timeout=60)
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
