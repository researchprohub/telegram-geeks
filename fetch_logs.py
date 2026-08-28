import paramiko
import sys
import os

os.environ['PYTHONIOENCODING'] = 'utf-8'

HOST = '213.111.150.162'
USER = 'root'
PASSWORD = 'Tgwu7jGcPanE'
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(HOST, username=USER, password=PASSWORD, timeout=10)
cmd = "cd /opt/telegramgeeks && docker compose -f docker-compose.prod.yml logs --tail 100 telegramgeeks-backend 2>&1 | grep -iE 'upload|tdata|bulk|session|Failed|Error|parse|zip'"
stdin, stdout, stderr = ssh.exec_command(cmd)
out = stdout.read().decode('utf-8', errors='replace')
with open('vps_logs.txt', 'w', encoding='utf-8') as f:
    f.write(out if out else 'NO MATCHING LINES')
ssh.close()
print('Done. Wrote to vps_logs.txt')
