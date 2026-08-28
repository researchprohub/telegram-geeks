import paramiko
host = '213.111.150.162'; user = 'root'; pwd = 'Tgwu7jGcPanE'
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(host, username=user, password=pwd)

stdin, stdout, stderr = ssh.exec_command("cd /opt/telegramgeeks && docker compose down --remove-orphans && docker compose up -d")
out = stdout.read()
print(out.decode('ascii', 'ignore'))
err = stderr.read()
print(err.decode('ascii', 'ignore'))
ssh.close()
