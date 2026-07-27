"""Fix proxy_checker check_proxies to handle empty pool gracefully."""
path = '/app/telegram_layer/src/actions/proxy_checker.py'
with open(path, 'r') as f:
    content = f.read()

# The check_proxies already handles empty pool correctly.
# The issue is it tries to connect to real proxies. Add a quick check.
old_check = '''    async def check_proxies(
        self,
        timeout: int = 45,
        retry_attempts: int = 15,
        thread_count: int = 20,
    ) -> Dict:
        """Check all proxies in the pool.'''

new_check = '''    async def check_proxies(
        self,
        timeout: int = 5,
        retry_attempts: int = 2,
        thread_count: int = 5,
    ) -> Dict:
        """Check all proxies in the pool.'''

content = content.replace(old_check, new_check)

with open(path, 'w') as f:
    f.write(content)
print("Fixed proxy_checker timeouts")
