import paramiko
import sys

# Force UTF-8 stdout
sys.stdout.reconfigure(encoding='utf-8')

host = "213.111.150.162"
user = "root"
password = "Tgwu7jGcPanE"

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(host, username=user, password=password, timeout=15)

commands = [
    ("Nginx Sites Enabled", "ls -la /etc/nginx/sites-enabled/ && ls -la /etc/nginx/conf.d/"),
    ("Nginx Config Content", "cat /etc/nginx/sites-enabled/* 2>/dev/null || cat /etc/nginx/conf.d/* 2>/dev/null || true"),
    ("Certbot Certificates", "certbot certificates 2>&1 || true"),
    ("DNS check for telegramgeekspro.com", "getent hosts telegramgeekspro.com || host telegramgeekspro.com || nslookup telegramgeekspro.com 1.1.1.1 || ping -c 1 telegramgeekspro.com || true"),
    ("Docker compose on host", "docker compose version; docker --version; git --version"),
]

for title, cmd in commands:
    print(f"\n==================== {title} ====================")
    stdin, stdout, stderr = ssh.exec_command(cmd, timeout=30)
    out = stdout.read().decode('utf-8', errors='replace')
    print(out)
    err = stderr.read().decode('utf-8', errors='replace')
    if err.strip():
        print("[STDERR]", err)

ssh.close()
