import paramiko
import sys
sys.stdout.reconfigure(encoding='utf-8')

host = "213.111.150.162"
user = "root"
password = "Tgwu7jGcPanE"

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(host, username=user, password=password, timeout=15)

commands = [
    ("Check discordmasters certs", "ls -la /etc/letsencrypt/live/discordmasters.com/"),
    ("Check renewal configs", "ls -la /etc/letsencrypt/renewal/ && cat /etc/letsencrypt/renewal/* 2>/dev/null || true"),
]

for title, cmd in commands:
    print(f"\n==================== {title} ====================")
    stdin, stdout, stderr = ssh.exec_command(cmd, timeout=30)
    print(stdout.read().decode('utf-8', errors='replace'))

ssh.close()
