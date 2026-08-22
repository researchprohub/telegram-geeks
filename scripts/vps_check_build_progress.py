import paramiko
import sys

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect("213.111.150.162", username="root", password="Tgwu7jGcPanE", timeout=15)

stdin, stdout, stderr = ssh.exec_command("ps aux | grep docker; echo '---'; docker ps")
out = stdout.read().decode('utf-8', errors='replace')
print(out)
ssh.close()
