import paramiko
from scp import SCPClient
import sys

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect("213.111.150.162", username="root", password="Tgwu7jGcPanE", timeout=15)

with SCPClient(ssh.get_transport()) as scp:
    scp.put("backend/app/main.py", remote_path="/opt/telegramgeeks/backend/app/main.py")
print("Uploaded updated main.py")

cmd = """
cd /opt/telegramgeeks
docker compose -f docker-compose.prod.yml restart telegramgeeks-backend
sleep 5
docker ps
echo ""
echo "=== BACKEND API DIRECT TEST (Port 8002) ==="
curl -s -i http://127.0.0.1:8002/api/v1/health
echo ""
echo "=== NGINX API PROXY TEST (HTTPS telegramgeekspro.com/api/v1/health) ==="
curl -s -i -k https://127.0.0.1/api/v1/health -H "Host: telegramgeekspro.com"
echo ""
echo "=== NGINX FRONTEND PROXY TEST (HTTPS telegramgeekspro.com/) ==="
curl -s -I -k https://127.0.0.1/ -H "Host: telegramgeekspro.com" | head -n 5
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
