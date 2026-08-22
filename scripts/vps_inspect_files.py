import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect("213.111.150.162", username="root", password="Tgwu7jGcPanE", timeout=15)

commands = [
    "cat /opt/telegramgeeks/backend/Dockerfile",
    "ls -lh /opt/telegramgeeks/frontend/public/downloads/ || true",
    "cat /opt/telegramgeeks/docker-compose.prod.yml | head -n 25",
]

for cmd in commands:
    print(f"\n--- [CMD] {cmd} ---")
    stdin, stdout, stderr = ssh.exec_command(cmd)
    print(stdout.read().decode())

ssh.close()
