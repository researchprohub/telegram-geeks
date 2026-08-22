import paramiko
import sys

def main():
    host = "213.111.150.162"
    user = "Cu9JFJrG4p"
    password = "Tgwu7jGcPanE"
    
    print(f"Connecting to {host} as {user}...")
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    try:
        ssh.connect(host, username=user, password=password, timeout=15)
        print("SSH Connection successful!\n")
        
        commands = [
            "echo '=== WHOAMI / OS / UPTIME ===' && whoami && uname -a && uptime",
            "echo '=== MEMORY & DISK ===' && free -h && df -h",
            "echo '=== DOCKER CONTAINERS ===' && docker ps -a",
            "echo '=== DOCKER COMPOSE / NETWORKS ===' && docker network ls",
            "echo '=== LISTENING PORTS ===' && (ss -tulpn 2>/dev/null || netstat -tulpn 2>/dev/null || lsof -i -P -n | grep LISTEN)",
            "echo '=== HOME / WORKING DIRECTORIES ===' && ls -la / && ls -la ~",
            "echo '=== CHECK NGINX ON HOST ===' && (which nginx || echo 'No system nginx')",
        ]
        
        for cmd in commands:
            stdin, stdout, stderr = ssh.exec_command(cmd, timeout=30)
            out = stdout.read().decode('utf-8', errors='replace')
            err = stderr.read().decode('utf-8', errors='replace')
            print(out)
            if err.strip():
                print("ERR:", err)
                
    except Exception as e:
        print(f"Error: {e}")
    finally:
        ssh.close()

if __name__ == '__main__':
    main()
