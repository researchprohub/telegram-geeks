import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('213.111.150.162', username='root', password='Tgwu7jGcPanE')
stdin, stdout, stderr = ssh.exec_command('openssl x509 -in /etc/letsencrypt/live/discordmasters.com/fullchain.pem -noout -issuer -subject -dates')
print(stdout.read().decode())
ssh.close()
