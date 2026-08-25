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

async def test():
    async with async_session_factory() as db:
        acc = await db.get(Account, 1)
        client = TelegramWebService.get_client(acc)
        await client.connect()
        dialogs = await client.get_dialogs(limit=30)
        for d in dialogs:
            if "cityboy" in (d.name or "").lower():
                print(f"CITYBOY entity photo: {getattr(d.entity, 'photo', None)}")
                print(f"CITYBOY photo type: {type(getattr(d.entity, 'photo', None)).__name__}")
                full = await client(functions.channels.GetFullChannelRequest(d.entity))
                print(f"CITYBOY full photo: {getattr(full.full_chat, 'chat_photo', None)}")
                break
        await client.disconnect()

asyncio.run(test())
'''

b64 = base64.b64encode(python_code.encode()).decode()
cmd = f"docker exec telegramgeeks-backend python -c \"import base64; exec(base64.b64decode('{b64}'))\""
stdin, stdout, stderr = ssh.exec_command(cmd)
print("STDOUT:", stdout.read().decode('utf-8', errors='replace'))
print("STDERR:", stderr.read().decode('utf-8', errors='replace'))
