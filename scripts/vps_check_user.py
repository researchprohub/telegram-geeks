import paramiko
import sys

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('213.111.150.162', username='root', password='Tgwu7jGcPanE', timeout=15)

script = """
import asyncio
from app.db.session import async_session_factory
from app.models import Partner
from app.data.default_partners import DEFAULT_PARTNERS
from sqlalchemy import select

async def main():
    async with async_session_factory() as session:
        r = await session.execute(select(Partner))
        existing = r.scalars().all()
        print("Initial count in DB:", len(existing))
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
            print("Successfully seeded all", len(DEFAULT_PARTNERS), "default partners!")
        else:
            print("Already seeded!")

asyncio.run(main())
"""

sftp = ssh.open_sftp()
with sftp.file('/opt/telegramgeeks/backend/seed_partners_now.py', 'w') as f:
    f.write(script)
sftp.close()

run_cmd = """
cd /opt/telegramgeeks
docker compose -f docker-compose.prod.yml exec -T telegramgeeks-backend python seed_partners_now.py
curl -s http://127.0.0.1:8002/api/v1/partners | python3 -c "import json, sys; data=json.load(sys.stdin); print('Public API partner count:', len(data))"
"""

stdin, stdout, stderr = ssh.exec_command(run_cmd)
print("=== VERIFY OUTPUT ===")
print(stdout.read().decode('utf-8'))
print(stderr.read().decode('utf-8'))
ssh.close()


