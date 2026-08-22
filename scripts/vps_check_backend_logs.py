import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect("213.111.150.162", username="root", password="Tgwu7jGcPanE", timeout=15)

stdin, stdout, stderr = ssh.exec_command("docker logs telegramgeeks-backend --tail 50")
print("=== BACKEND DOCKER LOGS ===")
print(stdout.read().decode())
err = stderr.read().decode()
if err.strip():
    print("[STDERR]", err)

stdin, stdout, stderr = ssh.exec_command("curl -s -i http://127.0.0.1:8002/health || curl -s -i http://127.0.0.1:8002/api/v1/health || true")
print("=== HEALTH ENDPOINT TEST ===")
print(stdout.read().decode())

ssh.close()
