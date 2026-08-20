import urllib.request
import json

# Login
login_data = json.dumps({"email": "admin@test.com", "password": "Testpass123!"}).encode()
req = urllib.request.Request("http://localhost:8001/api/v1/auth/login", data=login_data, headers={"Content-Type": "application/json"}, method="POST")
resp = urllib.request.urlopen(req)
token_resp = json.loads(resp.read())
access_token = token_resp["access_token"]
print(f"Got token: {access_token[:50]}...")

# Test /modules
headers = {"Authorization": f"Bearer {access_token}"}
req2 = urllib.request.Request("http://localhost:8001/api/v1/modules/", headers=headers)
try:
    resp2 = urllib.request.urlopen(req2)
    data = json.loads(resp2.read())
    print(f"Modules: {len(data.get('modules', []))} available")
    for m in data.get('modules', [])[:5]:
        print(f"  - {m['name']} ({m['category']})")
except urllib.error.HTTPError as e:
    print(f"Modules error: {e.code} {e.read().decode()}")
