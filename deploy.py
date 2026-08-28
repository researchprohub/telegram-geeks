import paramiko
import os

host = '213.111.150.162'
user = 'root'
pwd = 'Tgwu7jGcPanE'

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(host, username=user, password=pwd)

stdin, stdout, stderr = ssh.exec_command("ps aux | grep node")
print(stdout.read().decode())

stdin, stdout, stderr = ssh.exec_command("ps aux | grep uvicorn")
print(stdout.read().decode())

stdin, stdout, stderr = ssh.exec_command("ls -la /opt/telegramgeeks")
print(stdout.read().decode())
