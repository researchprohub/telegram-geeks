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
    docker compose -f docker-compose.prod.yml build telegramgeeks-frontend
    docker compose -f docker-compose.prod.yml up -d
    docker compose -f docker-compose.prod.yml restart telegramgeeks-backend
    sleep 6

    echo ""
    echo "=== SEEDING PARTNERS IN POSTGRESQL ==="
    docker compose -f docker-compose.prod.yml exec -T telegramgeeks-backend python -c "
import asyncio
from app.db.session import async_session_factory
from app.models import Partner
from app.data.default_partners import DEFAULT_PARTNERS
from sqlalchemy import select

async def main():
    async with async_session_factory() as session:
        r = await session.execute(select(Partner))
        existing = r.scalars().all()
        print(\"Current partners in DB:\", len(existing))
        if len(existing) < 100:
            for p in existing:
                await session.delete(p)
            await session.flush()
            for item in DEFAULT_PARTNERS:
                session.add(Partner(
                    name=item['name'],
                    img=item['img'],
                    href=item.get('href', ''),
                    category=item.get('category', 'proxies'),
                    sort_order=item.get('sort_order', 0),
                ))
            await session.commit()
            print(\"Successfully seeded default partners into production DB!\")
        else:
            print(\"Partners table is already fully seeded with 124 partners.\")

asyncio.run(main())
"

    echo ""
    echo "=== RUNNING CONTAINERS ==="
    docker compose -f docker-compose.prod.yml ps

    echo ""
    echo "=== NGINX CONFIG RELOAD ==="
    cp /opt/telegramgeeks/nginx/telegramgeekspro.conf /etc/nginx/sites-available/telegramgeekspro
    ln -sf /etc/nginx/sites-available/telegramgeekspro /etc/nginx/sites-enabled/telegramgeekspro
    nginx -t && systemctl reload nginx

    echo ""
    echo "=== BACKEND HEALTH & PARTNERS CHECK ==="
    curl -s http://127.0.0.1:8002/api/v1/partners | python3 -c "import json, sys; data=json.load(sys.stdin); print('Live partners API returns count:', len(data))"

    echo ""
    echo "=== FRONTEND HEALTH CHECK (Port 3001) ==="
    curl -s -I http://127.0.0.1:3001/partner | head -n 5 || true

    echo ""
    echo "=== HOST NGINX PUBLIC ENDPOINT CHECK ==="
    curl -s -I -k https://127.0.0.1/partner -H "Host: telegramgeekspro.com" | head -n 5 || true
    curl -s -I -k https://127.0.0.1/manuals/invayt-v2 -H "Host: telegramgeekspro.com" | head -n 5 || true
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
