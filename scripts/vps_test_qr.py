import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect("213.111.150.162", username="root", password="Tgwu7jGcPanE", timeout=20)

cmd = """docker compose -f /opt/telegramgeeks/docker-compose.prod.yml exec -T telegramgeeks-backend python -c "
import asyncio
from telethon import TelegramClient
from telethon.sessions import StringSession
import qrcode
import qrcode.image.svg

async def test():
    client = TelegramClient(StringSession(), 2040, 'b18441a1ff607e10a989891a5462e627')
    try:
        await client.connect()
        print('Connected to MTProto inside Docker!')
        qr = await client.qr_login()
        print('QR URL:', qr.url)
        await client.disconnect()
    except Exception as e:
        import traceback
        traceback.print_exc()

asyncio.run(test())
"
"""

stdin, stdout, stderr = ssh.exec_command(cmd)
print("STDOUT:", stdout.read().decode())
print("STDERR:", stderr.read().decode())
