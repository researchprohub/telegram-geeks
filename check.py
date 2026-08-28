import paramiko
host = '213.111.150.162'; user = 'root'; pwd = 'Tgwu7jGcPanE'
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(host, username=user, password=pwd)

stdin, stdout, stderr = ssh.exec_command("cat /opt/telegramgeeks/docker-compose.prod.yml")
out = stdout.read()
print(out.decode('ascii', 'ignore'))
ssh.close()
