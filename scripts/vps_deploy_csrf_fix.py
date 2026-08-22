import paramiko
from scp import SCPClient
import os
import tarfile
import sys

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

HOST = "213.111.150.162"
USER = "root"
PASSWORD = "Tgwu7jGcPanE"

print("Packaging CSRF fix for VPS deployment...")
tar_path = "dist_csrf_fix.tar.gz"

with tarfile.open(tar_path, "w:gz") as tar:
    tar.add("backend/app/middleware/csrf.py", arcname="backend/app/middleware/csrf.py")
    tar.add("frontend/src/lib/api.ts", arcname="frontend/src/lib/api.ts")

print("Uploading to VPS...")
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(HOST, username=USER, password=PASSWORD, timeout=20)

with SCPClient(ssh.get_transport()) as scp:
    scp.put(tar_path, remote_path=f"/tmp/{tar_path}")

print("Extracting and building on VPS...")
cmd = f"""
cd /opt/telegramgeeks
tar -xzf /tmp/{tar_path} -C /opt/telegramgeeks/
rm -f /tmp/{tar_path}

# Rebuild containers
docker compose -f docker-compose.prod.yml build telegramgeeks-frontend telegramgeeks-backend
docker compose -f docker-compose.prod.yml up -d --no-deps telegramgeeks-frontend telegramgeeks-backend
sleep 6

docker ps
"""

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
if os.path.exists(tar_path):
    os.remove(tar_path)
