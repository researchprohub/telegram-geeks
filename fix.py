import paramiko
host = '213.111.150.162'; user = 'root'; pwd = 'Tgwu7jGcPanE'
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(host, username=user, password=pwd)

print("FRONTEND LOGS:")
stdin, stdout, stderr = ssh.exec_command("docker logs --tail 20 telegramgeeks-frontend-1")
print(stdout.read().decode('utf-8', 'ignore'))
print(stderr.read().decode('utf-8', 'ignore'))

print("BACKEND LOGS:")
stdin, stdout, stderr = ssh.exec_command("docker logs --tail 20 telegramgeeks-backend-1")
print(stdout.read().decode('utf-8', 'ignore'))
print(stderr.read().decode('utf-8', 'ignore'))

ssh.close()
