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
    ("DNS A record check", "curl -s https://dns.google/resolve?name=telegramgeekspro.com&type=A || true"),
    ("Let's check discordmasters nginx config SSL file", "ls -la /etc/letsencrypt/live/ || ls -la /etc/ssl/ || true"),
    ("Docker directory on host", "ls -la /opt/ || ls -la /var/www/ || ls -la /root/"),
]

for title, cmd in commands:
    print(f"\n==================== {title} ====================")
    stdin, stdout, stderr = ssh.exec_command(cmd, timeout=30)
    print(stdout.read().decode('utf-8', errors='replace'))

ssh.close()
