import paramiko
import base64
import sys

sys.stdout.reconfigure(encoding='utf-8', errors='replace')
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('213.111.150.162', username='root', password='Tgwu7jGcPanE', timeout=20)

python_code = '''
import asyncio
from app.models import Account
from app.db.session import async_session_factory
from app.services.telegram_web_service import TelegramWebService

async def run():
    async with async_session_factory() as db:
        acc = await db.get(Account, 1)
        if not acc:
            print("No account #1 found in database")
            return
        print(f"Testing account: {acc.id} - {acc.phone_number}")
        res = await TelegramWebService.get_dialogs(acc, limit=20)
        print("Stats:", res.get("stats"))
        dialogs = res.get("dialogs", [])
        print(f"Total dialogs retrieved: {len(dialogs)}")
        for d in dialogs[:5]:
            print(f" - [{d['type']}] {d['title']} (Unread: {d['unread_count']})")

asyncio.run(run())
'''

b64 = base64.b64encode(python_code.encode()).decode()
cmd = f"docker exec telegramgeeks-backend python -c \"import base64; exec(base64.b64decode('{b64}'))\""
stdin, stdout, stderr = ssh.exec_command(cmd)
print("STDOUT:", stdout.read().decode('utf-8', errors='replace'))
print("STDERR:", stderr.read().decode('utf-8', errors='replace'))
