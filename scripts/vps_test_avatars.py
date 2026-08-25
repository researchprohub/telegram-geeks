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
        dialogs = await client.get_dialogs(limit=15)
        for d in dialogs:
            print(f"Dialog: {d.name}, id={d.id}, type={type(d.entity).__name__}, photo={getattr(d.entity, 'photo', None) is not None}")
            # Try download profile photo
            import io
            buf = io.BytesIO()
            try:
                res = await client.download_profile_photo(d.entity, file=buf, download_big=False)
                val = buf.getvalue()
                print(f"  -> download_profile_photo result: {res is not None}, bytes: {len(val)}")
            except Exception as e:
                print(f"  -> download_profile_photo ERROR: {e}")
        await client.disconnect()

asyncio.run(test())
'''

b64 = base64.b64encode(python_code.encode()).decode()
cmd = f"docker exec telegramgeeks-backend python -c \"import base64; exec(base64.b64decode('{b64}'))\""
stdin, stdout, stderr = ssh.exec_command(cmd)
print("STDOUT:", stdout.read().decode('utf-8', errors='replace'))
print("STDERR:", stderr.read().decode('utf-8', errors='replace'))
