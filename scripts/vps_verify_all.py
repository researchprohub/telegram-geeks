import paramiko
import sys

sys.stdout.reconfigure(encoding='utf-8')

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect("213.111.150.162", username="root", password="Tgwu7jGcPanE", timeout=15)

tests = [
    ("Docker Container Status", "docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'"),
    ("Backend API Health", "curl -s -i http://127.0.0.1:8002/api/v1/health"),
    ("Backend OpenApi Docs", "curl -s -o /dev/null -w 'HTTP Status: %{http_code}\n' http://127.0.0.1:8002/docs"),
    ("Frontend Next.js Response", "curl -s -I http://127.0.0.1:3001/"),
    ("Nginx Proxy to Frontend (HTTPS telegramgeekspro.com)", "curl -s -I -k https://127.0.0.1/ -H 'Host: telegramgeekspro.com'"),
    ("Nginx Proxy to Backend API (HTTPS telegramgeekspro.com/api/v1/health)", "curl -s -i -k https://127.0.0.1/api/v1/health -H 'Host: telegramgeekspro.com'"),
    ("Desktop App Download Check", "curl -s -I -k https://127.0.0.1/downloads/TelegramGeeks-Pro-v2.4.0-Windows-x64.zip -H 'Host: telegramgeekspro.com'"),
    ("Existing Project Check (discordmasters.com)", "curl -s -I http://127.0.0.1:3000/"),
]

for title, cmd in tests:
    print(f"\n==================== {title} ====================")
    stdin, stdout, stderr = ssh.exec_command(cmd)
    print(stdout.read().decode('utf-8', errors='replace'))
    err = stderr.read().decode('utf-8', errors='replace')
    if err.strip():
        print("[STDERR]", err)

ssh.close()
