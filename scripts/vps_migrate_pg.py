import paramiko
import sys

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect("213.111.150.162", username="root", password="Tgwu7jGcPanE", timeout=20)

sql = """
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS folder VARCHAR(30) DEFAULT 'active';
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS username VARCHAR(100);
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS first_name VARCHAR(100);
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT FALSE;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS device_model VARCHAR(100);
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS os_version VARCHAR(100);
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS app_version VARCHAR(50);
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS lang_code VARCHAR(20);
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS system_lang_code VARCHAR(20);
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS proxy_id INTEGER;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS country VARCHAR(4);
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS last_check_at TIMESTAMP WITHOUT TIME ZONE;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS api_id INTEGER;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS api_hash VARCHAR(64);
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS spamblock_until TIMESTAMP WITHOUT TIME ZONE;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS health_check_at TIMESTAMP WITHOUT TIME ZONE;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS health_score INTEGER;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS dc_id INTEGER;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS ping_ms INTEGER;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS last_known_ip VARCHAR(45);
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS last_proxy VARCHAR(200);
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS ip_country VARCHAR(100);

ALTER TABLE proxies ADD COLUMN IF NOT EXISTS latency_ms INTEGER;
ALTER TABLE proxies ADD COLUMN IF NOT EXISTS fail_count INTEGER DEFAULT 0;
ALTER TABLE proxies ADD COLUMN IF NOT EXISTS added_at TIMESTAMP WITHOUT TIME ZONE;

ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS target_db_id INTEGER;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS message_template TEXT;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS gpt_spin BOOLEAN DEFAULT FALSE;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS delay_min INTEGER DEFAULT 30;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS delay_max INTEGER DEFAULT 120;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS max_per_day INTEGER DEFAULT 50;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS media_path VARCHAR(512);
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS tone VARCHAR(64) DEFAULT 'natural';
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS sent INTEGER DEFAULT 0;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS failed INTEGER DEFAULT 0;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITHOUT TIME ZONE;
"""

cmd = f'docker compose -f /opt/telegramgeeks/docker-compose.prod.yml exec -T telegramgeeks-postgres psql -U postgres -d telegramgeeks -c "{sql}"'

stdin, stdout, stderr = ssh.exec_command(cmd)
print("STDOUT:", stdout.read().decode('utf-8', errors='replace'))
print("STDERR:", stderr.read().decode('utf-8', errors='replace'))

# Check columns now
cmd_check = 'docker compose -f /opt/telegramgeeks/docker-compose.prod.yml exec -T telegramgeeks-postgres psql -U postgres -d telegramgeeks -c "\\d accounts"'
stdin, stdout, stderr = ssh.exec_command(cmd_check)
print("\n=== UPDATED ACCOUNTS TABLE SCHEMA ===")
print(stdout.read().decode('utf-8', errors='replace'))
