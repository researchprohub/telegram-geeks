import paramiko
from scp import SCPClient
import sys

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect("213.111.150.162", username="root", password="Tgwu7jGcPanE", timeout=15)

with SCPClient(ssh.get_transport()) as scp:
    scp.put("scripts/vps_verify_new_admin.py", remote_path="/tmp/vps_verify_new_admin.py")

cmd = "python3 /tmp/vps_verify_new_admin.py"
stdin, stdout, stderr = ssh.exec_command(cmd, timeout=30)
print(stdout.read().decode('utf-8', errors='replace'))
err = stderr.read().decode('utf-8', errors='replace')
if err.strip():
    print("[STDERR]", err)

ssh.close()
