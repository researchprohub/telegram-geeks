import paramiko
import sys

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

HOST = "213.111.150.162"
USER = "root"
PASSWORD = "Tgwu7jGcPanE"

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(HOST, username=USER, password=PASSWORD, timeout=15)

commands = [
    ("Check Nginx sites and SSL configs", "cat /etc/nginx/sites-available/telegramgeekspro"),
    ("Check Certbot certificate issuance", "certbot certonly --webroot -w /var/www/html -d telegramgeekspro.com -d www.telegramgeekspro.com --non-interactive --agree-tos --register-unsafely-without-email --force-renewal 2>&1 || certbot --nginx -d telegramgeekspro.com -d www.telegramgeekspro.com --non-interactive --agree-tos --register-unsafely-without-email 2>&1 || true"),
    ("Check /etc/letsencrypt/live/telegramgeekspro.com", "ls -la /etc/letsencrypt/live/telegramgeekspro.com/ || true"),
    ("Reload Nginx", "nginx -t && systemctl reload nginx"),
    ("Test external SSL handshake directly to VPS IP", "openssl s_client -connect 127.0.0.1:443 -servername telegramgeekspro.com </dev/null 2>&1 | grep -E 'Verify return code|subject|issuer'")
]

for title, cmd in commands:
    print(f"\n==================== {title} ====================")
    stdin, stdout, stderr = ssh.exec_command(cmd, timeout=120)
    print(stdout.read().decode('utf-8', errors='replace'))
    err = stderr.read().decode('utf-8', errors='replace')
    if err.strip():
        print("[STDERR]", err)

ssh.close()
