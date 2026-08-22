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
    docker compose -f docker-compose.prod.yml build
    docker compose -f docker-compose.prod.yml up -d
    sleep 6

    echo ""
    echo "=== RUNNING CONTAINERS ==="
    docker compose -f docker-compose.prod.yml ps

    echo ""
    echo "=== NGINX CONFIG RELOAD ==="
    cp {REMOTE_DIR}/nginx/telegramgeekspro.conf /etc/nginx/sites-available/telegramgeekspro
    ln -sf /etc/nginx/sites-available/telegramgeekspro /etc/nginx/sites-enabled/telegramgeekspro
    nginx -t && systemctl reload nginx

    echo ""
    echo "=== BACKEND HEALTH CHECK (Port 8002) ==="
    curl -s -i http://127.0.0.1:8002/api/v1/health || true

    echo ""
    echo "=== FRONTEND HEALTH CHECK (Port 3001) ==="
    curl -s -I http://127.0.0.1:3001/ || true

    echo ""
    echo "=== HOST NGINX PUBLIC ENDPOINT CHECK ==="
    curl -s -I -k https://127.0.0.1/dashboard/proxies -H "Host: telegramgeekspro.com" || true
    curl -s -I -k https://127.0.0.1/dashboard/ai-models -H "Host: telegramgeekspro.com" || true
    """

    stdin, stdout, stderr = ssh.exec_command(cmd, timeout=600)

    while True:
        line = stdout.readline()
        if not line:
            break
        print(line, end="")

    err = stderr.read().decode('utf-8', errors='replace')
    if err.strip():
        print("\n[STDERR]\n", err)

    ssh.close()
    print("\nVPS Fast Deployment Finished Successfully!")

if __name__ == '__main__':
    main()
