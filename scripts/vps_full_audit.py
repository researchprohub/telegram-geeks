import paramiko

host = "213.111.150.162"
user = "root"
password = "Tgwu7jGcPanE"

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(host, username=user, password=password, timeout=15)

commands = [
    ("OS & System Info", "uname -a && uptime && nproc && free -h && df -h"),
    ("Docker PS All", "docker ps -a"),
    ("Docker Networks & Volumes", "docker network ls && docker volume ls"),
    ("Listening Ports", "ss -tulpn"),
    ("System Nginx / Caddy / Webservers", "which nginx caddy apache2 certbot || true"),
    ("Nginx status / configs if exists", "systemctl status nginx 2>&1 || ls -la /etc/nginx/sites-enabled/ 2>&1 || true"),
    ("Existing Docker inspect for discordmasters-app", "docker inspect discordmasters-app --format '{{json .NetworkSettings.Ports}}' && docker inspect discordmasters-app --format '{{json .HostConfig.PortBindings}}'"),
    ("DNS check for telegramgeekspro.com", "nslookup telegramgeekspro.com 8.8.8.8 || ping -c 2 telegramgeekspro.com || host telegramgeekspro.com || true"),
    ("Installed utilities", "which git node npm python3 docker docker-compose compose rsync || true"),
    ("Docker Compose Version", "docker compose version || docker-compose version || true"),
]

for title, cmd in commands:
    print(f"\n==================== {title} ====================")
    stdin, stdout, stderr = ssh.exec_command(cmd, timeout=30)
    print(stdout.read().decode('utf-8', errors='replace'))
    err = stderr.read().decode('utf-8', errors='replace')
    if err.strip():
        print("[STDERR]", err)

ssh.close()
