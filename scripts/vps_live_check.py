import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect("213.111.150.162", username="root", password="Tgwu7jGcPanE", timeout=15)

stdin, stdout, stderr = ssh.exec_command("docker ps -a && (ps aux | grep docker | grep -v grep | head -n 5)")
print(stdout.read().decode())
ssh.close()
