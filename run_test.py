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
import logging

logging.basicConfig(level=logging.DEBUG)

async def main():
    async with async_session_factory() as db:
        from sqlalchemy import select
        res = await db.execute(select(Account).limit(1))
        account = res.scalar_one_or_none()
        if not account:
            print("No account")
            return
        
        print("Got account:", account.id)
        client = TelegramWebService.get_client(account)
        await client.connect()
        
        try:
            # We must fetch dialogs first to populate cache in THIS client instance
            dialogs = await client.get_dialogs(limit=5)
            for d in dialogs:
                print(f"Dialog: {d.id} {d.name}")
                try:
                    entity = await client.get_input_entity(d.id)
                    print(f"Input entity: {entity}")
                    import io
                    buf = io.BytesIO()
                    print("Downloading avatar...")
                    await asyncio.wait_for(client.download_profile_photo(entity, file=buf, download_big=False), timeout=10.0)
                    print(f"Avatar downloaded! Size: {len(buf.getvalue())}")
                    
                    # Test downloading media from a message
                    msgs = await client.get_messages(entity, limit=5)
                    for m in msgs:
                        if m.media:
                            print(f"Message {m.id} has media. Downloading...")
                            buf2 = io.BytesIO()
                            await asyncio.wait_for(client.download_media(m, file=buf2), timeout=10.0)
                            print(f"Media downloaded! Size: {len(buf2.getvalue())}")
                            break
                            
                    break
                except Exception as e:
                    print(f"Failed: {e}")
        except Exception as outer:
            print(f"Outer exception: {outer}")
        await client.disconnect()

asyncio.run(main())
"""

sftp = ssh.open_sftp()
with sftp.file('/tmp/test_mtproto.py', 'w') as f:
    f.write(test_script)
sftp.close()

stdin, stdout, stderr = ssh.exec_command('docker cp /tmp/test_mtproto.py telegramgeeks-backend:/app/test_mtproto.py && docker exec telegramgeeks-backend python /app/test_mtproto.py')
out = stdout.read().decode('utf-8', errors='ignore')
err = stderr.read().decode('utf-8', errors='ignore')

print("STDOUT:")
print(out)
print("STDERR:")
print(err)
