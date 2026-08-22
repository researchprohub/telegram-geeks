import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect("213.111.150.162", username="root", password="Tgwu7jGcPanE", timeout=15)

stdin, stdout, stderr = ssh.exec_command("ls -lh /opt/telegramgeeks/ && docker ps")
print(stdout.read().decode())
err = stderr.read().decode()
if err.strip():
    print("[ERR]", err)
ssh.close()
