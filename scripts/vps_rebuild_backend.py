import paramiko
from scp import SCPClient

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect("213.111.150.162", username="root", password="Tgwu7jGcPanE", timeout=15)

# Upload updated pyproject.toml
with SCPClient(ssh.get_transport()) as scp:
    scp.put("backend/pyproject.toml", remote_path="/opt/telegramgeeks/backend/pyproject.toml")
print("Uploaded backend/pyproject.toml")

cmd = """
cd /opt/telegramgeeks
docker compose -f docker-compose.prod.yml build telegramgeeks-backend
docker compose -f docker-compose.prod.yml up -d --no-deps telegramgeeks-backend
sleep 5
docker logs telegramgeeks-backend --tail 30
echo ""
echo "=== HEALTH CHECK ==="
curl -s -i http://127.0.0.1:8002/api/v1/health || curl -s -i http://127.0.0.1:8002/health || true
"""

stdin, stdout, stderr = ssh.exec_command(cmd, timeout=300)
while True:
    line = stdout.readline()
    if not line:
        break
    print(line, end="")

err = stderr.read().decode()
if err.strip():
    print("[STDERR]", err)

ssh.close()
