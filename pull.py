import paramiko
host = '213.111.150.162'; user = 'root'; pwd = 'Tgwu7jGcPanE'
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(host, username=user, password=pwd)

stdin, stdout, stderr = ssh.exec_command("cd /opt/telegramgeeks && git stash && git pull origin main")
print("GIT:", stdout.read().decode())
print(stderr.read().decode())

stdin, stdout, stderr = ssh.exec_command("docker ps")
print("DOCKER:", stdout.read().decode())

ssh.close()
