import paramiko

host = "213.111.150.162"
password = "Tgwu7jGcPanE"
users = ["root", "ubuntu", "debian", "admin", "Cu9JFJrG4p"]

for u in users:
    print(f"Trying user: {u}...")
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    try:
        ssh.connect(host, username=u, password=password, timeout=10)
        print(f"--> SUCCESS with user: {u}!")
        
        stdin, stdout, stderr = ssh.exec_command("whoami && uname -a && docker ps")
        print("Output:", stdout.read().decode())
        ssh.close()
        break
    except Exception as e:
        print(f"Failed with user {u}: {e}")
