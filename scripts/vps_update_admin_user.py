import paramiko
from scp import SCPClient
import sys

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

HOST = "213.111.150.162"
USER = "root"
PASSWORD = "Tgwu7jGcPanE"

print(f"Connecting to {HOST}...")
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(HOST, username=USER, password=PASSWORD, timeout=15)

# 1. Upload updated main.py
with SCPClient(ssh.get_transport()) as scp:
    scp.put("backend/app/main.py", remote_path="/opt/telegramgeeks/backend/app/main.py")
print("Uploaded updated main.py to VPS")

# 2. Execute script inside container to create/update admin user
python_script = """
import asyncio
from app.db.session import async_session_factory
from app.models import User
from app.core.security import hash_password
from sqlalchemy import select

async def update_admin():
    async with async_session_factory() as session:
        # Check if new admin exists
        new_email = "discordmasters@atomicmail.io"
        new_pass = "Blackhat2020@@@"
        
        result = await session.execute(select(User).where(User.email == new_email))
        user = result.scalar_one_or_none()
        if user is None:
            user = User(email=new_email, full_name="Super Admin", role="admin", is_active=True)
            session.add(user)
            print(f"Created new admin user: {new_email}")
        else:
            print(f"Found existing user: {new_email}, updating...")
            
        user.hashed_password = hash_password(new_pass)
        user.full_name = "Super Admin"
        user.role = "admin"
        user.is_active = True
        
        # Remove or update old admin@test.com
        res_old = await session.execute(select(User).where(User.email == "admin@test.com"))
        old_user = res_old.scalar_one_or_none()
        if old_user:
            await session.delete(old_user)
            print("Removed deprecated admin@test.com user.")
            
        await session.commit()
        print("Admin user update committed successfully!")

asyncio.run(update_admin())
"""

# Write script inside /tmp on VPS and execute inside container
cmd = f"""
cat << 'EOF' > /opt/telegramgeeks/update_admin.py
{python_script}
EOF

cd /opt/telegramgeeks
docker compose -f docker-compose.prod.yml exec -T telegramgeeks-backend python /app/../update_admin.py || docker compose -f docker-compose.prod.yml exec -T telegramgeeks-backend python -c "{python_script.replace('"', '\\"')}"
docker compose -f docker-compose.prod.yml restart telegramgeeks-backend
sleep 3
"""

stdin, stdout, stderr = ssh.exec_command(cmd, timeout=60)
print(stdout.read().decode('utf-8', errors='replace'))
err = stderr.read().decode('utf-8', errors='replace')
if err.strip():
    print("[STDERR]", err)

ssh.close()
