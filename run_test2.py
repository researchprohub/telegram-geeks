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
        
        dialogs = await client.get_dialogs(limit=5)
        for d in dialogs:
            photo_obj = getattr(d.entity, "photo", None)
            has_photo = bool(photo_obj and not isinstance(photo_obj, (types.ChatPhotoEmpty, types.UserProfilePhotoEmpty)))
            print(f"Dialog: {d.id} | has_photo: {has_photo} | photo_obj: {type(photo_obj)}")
                
        await client.disconnect()

asyncio.run(main())
"""

sftp = ssh.open_sftp()
with sftp.file('/tmp/test_has_photo.py', 'w') as f:
    f.write(test_script)
sftp.close()

stdin, stdout, stderr = ssh.exec_command('docker cp /tmp/test_has_photo.py telegramgeeks-backend:/app/test_has_photo.py && docker exec telegramgeeks-backend python /app/test_has_photo.py')
out = stdout.read().decode('utf-8', errors='ignore')
print("STDOUT:")
print(out.encode('ascii', 'ignore').decode('ascii'))
