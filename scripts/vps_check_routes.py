import paramiko
import sys

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect("213.111.150.162", username="root", password="Tgwu7jGcPanE", timeout=15)

tests = [
    ("Direct Backend /health", "curl -s -i http://127.0.0.1:8002/health"),
    ("Direct Backend /api/v1/health", "curl -s -i http://127.0.0.1:8002/api/v1/health"),
    ("Direct Backend /docs", "curl -s -I http://127.0.0.1:8002/docs"),
    ("Nginx /api/v1/health", "curl -s -i -k https://127.0.0.1/api/v1/health -H 'Host: telegramgeekspro.com'"),
    ("Nginx /docs", "curl -s -i -k https://127.0.0.1/docs -H 'Host: telegramgeekspro.com'"),
    ("Nginx / (Homepage)", "curl -s -I -k https://127.0.0.1/ -H 'Host: telegramgeekspro.com'"),
    ("Nginx /download", "curl -s -I -k https://127.0.0.1/download -H 'Host: telegramgeekspro.com'"),
    ("Nginx /downloads/TelegramGeeks-Pro-v2.4.0-Windows-x64.zip", "curl -s -I -k https://127.0.0.1/downloads/TelegramGeeks-Pro-v2.4.0-Windows-x64.zip -H 'Host: telegramgeekspro.com'"),
]

for title, cmd in tests:
    print(f"\n==================== {title} ====================")
    stdin, stdout, stderr = ssh.exec_command(cmd)
    print(stdout.read().decode('utf-8', errors='replace'))

ssh.close()
