import paramiko
import sys

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect("213.111.150.162", username="root", password="Tgwu7jGcPanE", timeout=15)

test_cmd = """
echo "=== TEST 1: POST /api/auth/login ==="
curl -s -i -k -X POST https://127.0.0.1/api/auth/login \
  -H "Host: telegramgeekspro.com" \
  -H "Content-Type: application/json" \
  -d '{"email":"discordmasters@atomicmail.io","password":"Blackhat2020@@@"}'

echo ""
echo "=== TEST 2: POST /api/v1/auth/login ==="
curl -s -i -k -X POST https://127.0.0.1/api/v1/auth/login \
  -H "Host: telegramgeekspro.com" \
  -H "Content-Type: application/json" \
  -d '{"email":"discordmasters@atomicmail.io","password":"Blackhat2020@@@"}'
"""

stdin, stdout, stderr = ssh.exec_command(test_cmd)
print(stdout.read().decode('utf-8', errors='replace'))
ssh.close()
