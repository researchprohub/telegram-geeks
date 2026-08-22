import paramiko
import sys

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect("213.111.150.162", username="root", password="Tgwu7jGcPanE", timeout=15)

# Check PostgreSQL users
check_cmd = """
docker exec -i telegramgeeks-postgres psql -U postgres -d telegramgeeks -c "SELECT id, email, role, is_active FROM users;"
"""
stdin, stdout, stderr = ssh.exec_command(check_cmd)
print("=== USERS IN DATABASE ===")
print(stdout.read().decode('utf-8', errors='replace'))
print(stderr.read().decode('utf-8', errors='replace'))

# Test Login endpoint
test_login_cmd = """
curl -s -i -X POST http://127.0.0.1:8002/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"discordmasters@atomicmail.io","password":"Blackhat2020@@@"}'
"""
stdin, stdout, stderr = ssh.exec_command(test_login_cmd)
print("\n=== LOGIN ENDPOINT RESPONSE ===")
print(stdout.read().decode('utf-8', errors='replace'))

ssh.close()
