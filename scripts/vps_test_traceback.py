import paramiko
import sys

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect("213.111.150.162", username="root", password="Tgwu7jGcPanE", timeout=15)

test_py = """
import asyncio
import traceback
import json
from app.db.session import async_session_factory
from app.services.settings_service import SettingsService
from app.api.v1.endpoints.admin import SystemSettings, get_settings
from app.models import User
from sqlalchemy import select

async def run_test():
    async with async_session_factory() as session:
        try:
            res_user = await session.execute(select(User).where(User.email == 'discordmasters@atomicmail.io'))
            admin = res_user.scalar_one()
            print("Found admin:", admin.email, "role:", admin.role)
            settings_obj = await get_settings(_admin=admin, db=session)
            print("Successfully executed get_settings!")
            print("Result:", settings_obj.model_dump())
        except Exception as e:
            print("EXCEPTION in get_settings:")
            traceback.print_exc()

asyncio.run(run_test())
"""

# Write to temp file inside container and execute
stdin, stdout, stderr = ssh.exec_command("docker exec -i telegramgeeks-backend python -", get_pty=False)
stdin.write(test_py)
stdin.close()

print("=== DIRECT TEST OUTPUT ===")
print(stdout.read().decode('utf-8', errors='replace'))
print(stderr.read().decode('utf-8', errors='replace'))

ssh.close()
