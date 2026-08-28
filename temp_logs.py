import paramiko
import sys

sys.stdout.reconfigure(encoding='utf-8', errors='replace')
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('213.111.150.162', username='root', password='Tgwu7jGcPanE')
stdin, stdout, stderr = ssh.exec_command('docker logs --tail 3000 telegramgeeks-backend')
out = stdout.read().decode('utf-8', errors='ignore')
err = stderr.read().decode('utf-8', errors='ignore')

for line in (out + err).splitlines():
    if 'error' in line.lower() or 'exception' in line.lower() or '404' in line or 'find the input' in line.lower():
        print(line.encode('ascii', 'replace').decode('ascii'))
