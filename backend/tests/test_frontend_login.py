import urllib.request
import json

# Simulate frontend login
login_data = json.dumps({"email": "user@test.com", "password": "UserPass123!"}).encode()
req = urllib.request.Request("http://localhost:8001/api/v1/auth/login", data=login_data, headers={"Content-Type": "application/json", "Origin": "http://localhost:3000"}, method="POST")
try:
    resp = urllib.request.urlopen(req)
    data = json.loads(resp.read())
    print(f"Login success! Token: {data['access_token'][:50]}...")
    print(f"Cookies: access_token={resp.headers.get('Set-Cookie')}")
except urllib.error.HTTPError as e:
    print(f"Login error: {e.code} {e.read().decode()}")
