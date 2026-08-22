import paramiko
import sys

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect("213.111.150.162", username="root", password="Tgwu7jGcPanE", timeout=15)

test_py = """
import asyncio
import traceback
from app.db.session import async_session_factory
from app.api.v1.endpoints.admin import SystemSettings, get_settings, update_settings
from app.models import User
from sqlalchemy import select

async def run_test():
    async with async_session_factory() as session:
        try:
            res_user = await session.execute(select(User).where(User.email == 'discordmasters@atomicmail.io'))
            admin = res_user.scalar_one()
            settings_obj = await get_settings(_admin=admin, db=session)
            print("Successfully got settings:", settings_obj.platform_name)
            
            # Now test update_settings
            updated = await update_settings(body=settings_obj, _admin=admin, db=session)
            print("Successfully updated settings:", updated.platform_name)
        except Exception as e:
            print("EXCEPTION in update_settings:")
            traceback.print_exc()

asyncio.run(run_test())
"""

stdin, stdout, stderr = ssh.exec_command("docker exec -i telegramgeeks-backend python -", get_pty=False)
stdin.write(test_py)
stdin.close()

print("=== DIRECT TEST OUTPUT ===")
print(stdout.read().decode('utf-8', errors='replace'))
print(stderr.read().decode('utf-8', errors='replace'))

ssh.close()
