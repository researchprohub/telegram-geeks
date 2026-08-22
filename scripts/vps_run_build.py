import paramiko
import sys

sys.stdout.reconfigure(encoding='utf-8')

HOST = "213.111.150.162"
USER = "root"
PASSWORD = "Tgwu7jGcPanE"
REMOTE_DIR = "/opt/telegramgeeks"

def main():
    print(f"Connecting to {HOST} as {USER}...")
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(HOST, username=USER, password=PASSWORD, timeout=20)
    print("SSH Connection established!\n")

    commands = [
        ("Configure host Nginx", f"""
        cp {REMOTE_DIR}/nginx/telegramgeekspro.conf /etc/nginx/sites-available/telegramgeekspro
        ln -sf /etc/nginx/sites-available/telegramgeekspro /etc/nginx/sites-enabled/telegramgeekspro
        nginx -t && systemctl reload nginx
        """),
        ("Build & Launch Docker Compose", f"""
        cd {REMOTE_DIR}
        docker compose -f docker-compose.prod.yml build
        docker compose -f docker-compose.prod.yml up -d
        """),
        ("Wait & Inspect Running Containers", f"""
        sleep 5
        cd {REMOTE_DIR}
        docker compose -f docker-compose.prod.yml ps
        docker ps
        """),
        ("Verify Backend & Frontend Health", f"""
        sleep 3
        echo "=== CHECKING BACKEND API (Port 8002) ==="
        curl -s -i http://127.0.0.1:8002/api/v1/health || true
        echo ""
        echo "=== CHECKING FRONTEND HTTP (Port 3001) ==="
        curl -s -I http://127.0.0.1:3001/ || true
        echo ""
        echo "=== CHECKING HOST NGINX ROUTE ==="
        curl -s -I -k https://127.0.0.1 -H "Host: telegramgeekspro.com" || true
        echo ""
        echo "=== CHECKING DOWNLOAD LINK AVAILABILITY ==="
        curl -s -I -k https://127.0.0.1/downloads/TelegramGeeks-Pro-v2.4.0-Windows-x64.zip -H "Host: telegramgeekspro.com" || true
        """)
    ]

    for title, cmd in commands:
        print(f"\n==================== {title} ====================")
        stdin, stdout, stderr = ssh.exec_command(cmd, timeout=600)
        
        while True:
            line = stdout.readline()
            if not line:
                break
            print(line, end="")
            
        err = stderr.read().decode('utf-8', errors='replace')
        if err.strip():
            print(f"[STDERR]\n{err}")

    ssh.close()

if __name__ == '__main__':
    main()
