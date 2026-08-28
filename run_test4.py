import paramiko
import sys

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('213.111.150.162', username='root', password='Tgwu7jGcPanE')

test_script = """
import asyncio
from app.db.session import async_session_factory
from app.models import Account
from app.services.telegram_web_service import TelegramWebService

async def main():
    async with async_session_factory() as db:
        from sqlalchemy import select
        res = await db.execute(select(Account).limit(1))
        account = res.scalar_one_or_none()
        
        client = TelegramWebService.get_client(account)
        await client.connect()
        
        try:
            target_entity = -1003732622853
            try:
                entity = await client.get_entity(target_entity)
                print(f"get_entity SUCCEEDED: {entity}")
            except Exception as e:
                print(f"get_entity FAILED: {e}")
                entity = await client.get_input_entity(target_entity)
                print(f"get_input_entity SUCCEEDED: {entity}")
            
            import io
            buf = io.BytesIO()
            res = await client.download_profile_photo(entity, file=buf, download_big=False)
            print(f"download_profile_photo returned: {res}, size: {len(buf.getvalue())}")
        except Exception as e:
            import traceback
            traceback.print_exc()
            print(f"FINAL EXCEPTION: {e}")
                
        await client.disconnect()

asyncio.run(main())
"""

sftp = ssh.open_sftp()
with sftp.file('/tmp/test_avatar.py', 'w') as f:
    f.write(test_script)
sftp.close()

stdin, stdout, stderr = ssh.exec_command('docker cp /tmp/test_avatar.py telegramgeeks-backend:/app/test_avatar.py && docker exec telegramgeeks-backend python /app/test_avatar.py')
out = stdout.read().decode('utf-8', errors='ignore')
print("STDOUT:")
print(out)
