import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect("213.111.150.162", username="root", password="Tgwu7jGcPanE", timeout=15)

stdin, stdout, stderr = ssh.exec_command("ps -ef | grep -E 'npm|pip|build|next|node|python' | grep -v 'grep'")
print(stdout.read().decode())
ssh.close()
