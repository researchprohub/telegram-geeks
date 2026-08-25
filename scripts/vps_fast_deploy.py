import paramiko
import sys
import time

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

HOST = "213.111.150.162"
USER = "root"
PASSWORD = "Tgwu7jGcPanE"
REMOTE_DIR = "/opt/telegramgeeks"

def main():
    print(f"Connecting to VPS {HOST} as {USER}...")
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(HOST, username=USER, password=PASSWORD, timeout=20)
    print("SSH Connection established!\n")

    cmd = f"""
    cd {REMOTE_DIR}
    git remote remove origin || true
    git remote add origin https://github.com/researchprohub/telegram-geeks.git
    git fetch origin main
    git reset --hard origin/main
    echo "=== GIT SYNC COMPLETE ==="
    git log -n 1 --oneline

    echo ""
    echo "=== REBUILDING AND RESTARTING DOCKER CONTAINERS ==="
    docker compose -f docker-compose.prod.yml build telegramgeeks-backend telegramgeeks-frontend
    docker compose -f docker-compose.prod.yml up -d --force-recreate
    sleep 8

    echo ""
    echo "=== RUNNING CONTAINERS ==="
    docker compose -f docker-compose.prod.yml ps

    echo ""
    echo "=== NGINX CONFIG RELOAD ==="
    if [ -f /opt/telegramgeeks/nginx/telegramgeekspro.conf ]; then
        cp /opt/telegramgeeks/nginx/telegramgeekspro.conf /etc/nginx/sites-available/telegramgeekspro
        ln -sf /etc/nginx/sites-available/telegramgeekspro /etc/nginx/sites-enabled/telegramgeekspro
    fi
    nginx -t && systemctl reload nginx

    echo ""
    echo "=== BACKEND HEALTH & QR DEPENDENCIES CHECK ==="
    docker compose -f docker-compose.prod.yml exec -T telegramgeeks-backend python -c "
import qrcode
from telethon import TelegramClient
print('Telethon and QRCode libraries successfully loaded inside Docker backend!')
"

    echo ""
    echo "=== FRONTEND HEALTH CHECK (Port 3001) ==="
    curl -I -s http://127.0.0.1:3001/login | head -n 6

    echo ""
    echo "=== HOST NGINX PUBLIC ENDPOINT CHECK ==="
    curl -I -s https://telegramgeekspro.com/login | head -n 6
    curl -I -s https://telegramgeekspro.com/dashboard/accounts | head -n 6
    """

    stdin, stdout, stderr = ssh.exec_command(cmd, get_pty=True)

    for line in iter(stdout.readline, ""):
        print(line, end="")

    err = stderr.read().decode('utf-8', errors='replace')
    if err.strip():
        print("\n[STDERR]")
        print(err)

    ssh.close()
    print("\nVPS Fast Deployment Finished Successfully!")

if __name__ == "__main__":
    main()
