import paramiko
import sys

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect("213.111.150.162", username="root", password="Tgwu7jGcPanE", timeout=15)

script = """
import requests
import json

base = "http://127.0.0.1:8002/api/v1"

# 1. Login as admin
login_res = requests.post(f"{base}/auth/login", json={
    "email": "discordmasters@atomicmail.io",
    "password": "Blackhat2020@@@"
})
print("Login status:", login_res.status_code)
token = login_res.json()["access_token"]
headers = {"Authorization": f"Bearer {token}"}

# 2. Get Settings
get_res = requests.get(f"{base}/admin/settings", headers=headers)
print("GET /admin/settings status:", get_res.status_code)
if get_res.status_code != 200:
    print("GET error:", get_res.text)
else:
    settings = get_res.json()
    print("GET settings keys count:", len(settings))
    
    # 3. Try to PUT settings
    put_res = requests.put(f"{base}/admin/settings", json=settings, headers=headers)
    print("PUT /admin/settings status:", put_res.status_code)
    print("PUT response:", put_res.text)
"""

cmd = f"python3 -c '{script}'"
stdin, stdout, stderr = ssh.exec_command(cmd)
print("=== PYTHON SCRIPT OUTPUT ===")
print(stdout.read().decode('utf-8', errors='replace'))
print(stderr.read().decode('utf-8', errors='replace'))

# Check backend container logs
stdin2, stdout2, stderr2 = ssh.exec_command("docker logs --tail 20 telegramgeeks-backend")
print("\n=== RECENT CONTAINER LOGS ===")
print(stdout2.read().decode('utf-8', errors='replace'))

ssh.close()
