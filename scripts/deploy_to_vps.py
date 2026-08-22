import os
import tarfile
import time
import sys
import paramiko
from scp import SCPClient

sys.stdout.reconfigure(encoding='utf-8')

HOST = "213.111.150.162"
USER = "root"
PASSWORD = "Tgwu7jGcPanE"
REMOTE_DIR = "/opt/telegramgeeks"
ARCHIVE_NAME = "telegramgeeks_deploy.tar.gz"

def make_tarfile(output_filename, source_dir):
    print(f"Creating archive {output_filename}...")
    
    # Exclude unnecessary heavy directories
    exclude_dirs = {
        '.venv', '__pycache__', 'node_modules', '.next', '.git',
        '.pytest_cache', 'desktop', '.agents', '.opencode', '.agnes',
        '.superpowers'
    }
    
    include_paths = [
        'backend',
        'frontend',
        'telegram_layer',
        'data',
        'contacts',
        'nginx',
        'docker-compose.prod.yml',
        '.env',
        'VERSION',
        'pyproject.toml',
    ]

    with tarfile.open(output_filename, "w:gz") as tar:
        for p in include_paths:
            full_p = os.path.join(source_dir, p)
            if not os.path.exists(full_p):
                print(f"Skipping missing path: {p}")
                continue
            
            def filter_func(tarinfo):
                basename = os.path.basename(tarinfo.name)
                for ex in exclude_dirs:
                    if ex in tarinfo.name.split(os.sep) or ex in tarinfo.name.split('/'):
                        return None
                if basename.endswith('.pyc') or basename.endswith('.pyo'):
                    return None
                return tarinfo

            tar.add(full_p, arcname=p, filter=filter_func)
            print(f"Added {p}")
            
    size_mb = os.path.getsize(output_filename) / (1024 * 1024)
    print(f"Archive created successfully: {output_filename} ({size_mb:.2f} MB)")

def execute_remote(ssh, cmd, title=None):
    if title:
        print(f"\n---> {title}")
    print(f"[CMD] {cmd}")
    stdin, stdout, stderr = ssh.exec_command(cmd, timeout=300)
    
    # Stream output
    while True:
        line = stdout.readline()
        if not line:
            break
        print(line, end="")
        
    err = stderr.read().decode('utf-8', errors='replace')
    if err.strip():
        print(f"[STDERR]\n{err}")
    exit_status = stdout.channel.recv_exit_status()
    if exit_status != 0:
        print(f"Command failed with exit code: {exit_status}")
    return exit_status

def main():
    root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    tar_path = os.path.join(root_dir, ARCHIVE_NAME)

    # 1. Create tar archive
    make_tarfile(tar_path, root_dir)

    # 2. Connect via SSH
    print(f"\nConnecting to {HOST} as {USER}...")
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(HOST, username=USER, password=PASSWORD, timeout=20)
    print("SSH Connection established!")

    try:
        # 3. Setup remote directories
        execute_remote(ssh, f"mkdir -p {REMOTE_DIR} /etc/letsencrypt/live/telegramgeekspro.com /var/www/html", "Prepare directories")

        # 4. Generate Origin / Self-Signed SSL Cert if not exists
        ssl_gen_cmd = """
        if [ ! -f /etc/letsencrypt/live/telegramgeekspro.com/fullchain.pem ]; then
            echo "Generating SSL certificate for telegramgeekspro.com..."
            openssl req -x509 -nodes -days 3650 -newkey rsa:2048 \
                -keyout /etc/letsencrypt/live/telegramgeekspro.com/privkey.pem \
                -out /etc/letsencrypt/live/telegramgeekspro.com/fullchain.pem \
                -subj "/CN=telegramgeekspro.com" \
                -addext "subjectAltName=DNS:telegramgeekspro.com,DNS:www.telegramgeekspro.com"
            chmod 600 /etc/letsencrypt/live/telegramgeekspro.com/privkey.pem
            echo "SSL certificate created!"
        else
            echo "SSL certificate already exists."
        fi
        """
        execute_remote(ssh, ssl_gen_cmd, "SSL Certificate Setup")

        # 5. Upload archive via SCP
        print(f"\nUploading {ARCHIVE_NAME} to {REMOTE_DIR}...")
        with SCPClient(ssh.get_transport(), progress=lambda filename, size, sent: sys.stdout.write(f"\rUploaded {sent}/{size} bytes ({sent/size*100:.1f}%)") if size > 0 else None) as scp:
            scp.put(tar_path, remote_path=f"{REMOTE_DIR}/{ARCHIVE_NAME}")
        print("\nUpload complete!")

        # 6. Extract archive on remote server
        execute_remote(ssh, f"cd {REMOTE_DIR} && tar -xzf {ARCHIVE_NAME} && rm -f {ARCHIVE_NAME}", "Extract files on VPS")

        # 7. Configure host Nginx
        nginx_setup_cmd = f"""
        cp {REMOTE_DIR}/nginx/telegramgeekspro.conf /etc/nginx/sites-available/telegramgeekspro
        ln -sf /etc/nginx/sites-available/telegramgeekspro /etc/nginx/sites-enabled/telegramgeekspro
        nginx -t && systemctl reload nginx
        echo "Nginx configuration reloaded successfully!"
        """
        execute_remote(ssh, nginx_setup_cmd, "Configure & Reload Host Nginx")

        # 8. Start Docker Containers
        docker_cmd = f"""
        cd {REMOTE_DIR}
        docker compose -f docker-compose.prod.yml down --remove-orphans || true
        docker compose -f docker-compose.prod.yml build
        docker compose -f docker-compose.prod.yml up -d
        sleep 5
        docker compose -f docker-compose.prod.yml ps
        """
        execute_remote(ssh, docker_cmd, "Build & Start Docker Containers")

        # 9. Verify Containers & HTTP Endpoints
        verify_cmd = """
        echo "=== ALL RUNNING DOCKER CONTAINERS ==="
        docker ps
        echo ""
        echo "=== BACKEND HEALTH CHECK (Port 8002) ==="
        curl -s -i http://127.0.0.1:8002/api/v1/health || curl -s -i http://127.0.0.1:8002/docs | head -n 10
        echo ""
        echo "=== FRONTEND HEALTH CHECK (Port 3001) ==="
        curl -s -I http://127.0.0.1:3001/ | head -n 10
        echo ""
        echo "=== NGINX REVERSE PROXY TEST ==="
        curl -s -I -k https://127.0.0.1 -H "Host: telegramgeekspro.com" | head -n 10
        """
        execute_remote(ssh, verify_cmd, "Verify Service Health")

    finally:
        ssh.close()
        if os.path.exists(tar_path):
            try:
                os.remove(tar_path)
            except Exception:
                pass

if __name__ == '__main__':
    main()
