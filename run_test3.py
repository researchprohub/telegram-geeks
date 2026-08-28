import paramiko
import sys
import time

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('213.111.150.162', username='root', password='Tgwu7jGcPanE')

test_script = """
import asyncio
from app.db.session import async_session_factory
from app.models import Account
from app.services.telegram_web_service import TelegramWebService
from telethon.tl import types

async def main():
    async with async_session_factory() as db:
        from sqlalchemy import select
        res = await db.execute(select(Account).limit(1))
        account = res.scalar_one_or_none()
        
        client = TelegramWebService.get_client(account)
        await client.connect()
        
        # DO NOT GET DIALOGS FIRST!
        # Just try to get input entity for -1003732622853
        try:
            entity = await client.get_input_entity(-1003732622853)
            print(f"SUCCESS: {entity}")
        except Exception as e:
            print(f"FAILED: {e}")
                
        await client.disconnect()

asyncio.run(main())
"""

sftp = ssh.open_sftp()
with sftp.file('/tmp/test_fresh.py', 'w') as f:
    f.write(test_script)
sftp.close()

stdin, stdout, stderr = ssh.exec_command('docker cp /tmp/test_fresh.py telegramgeeks-backend:/app/test_fresh.py && docker exec telegramgeeks-backend python /app/test_fresh.py')
out = stdout.read().decode('utf-8', errors='ignore')
print("STDOUT:")
print(out)
