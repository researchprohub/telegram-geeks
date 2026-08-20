import urllib.request
import json

# Login
login_data = json.dumps({"email": "admin@test.com", "password": "Testpass123!"}).encode()
req = urllib.request.Request("http://localhost:8001/api/v1/auth/login", data=login_data, headers={"Content-Type": "application/json"}, method="POST")
resp = urllib.request.urlopen(req)
token_resp = json.loads(resp.read())
access_token = token_resp["access_token"]
print(f"Got token: {access_token[:50]}...")

# Test /me
headers = {"Authorization": f"Bearer {access_token}"}
req2 = urllib.request.Request("http://localhost:8001/api/v1/auth/me", headers=headers)
try:
    resp2 = urllib.request.urlopen(req2)
    print(f"/me: {resp2.read().decode()}")
except urllib.error.HTTPError as e:
    print(f"/me error: {e.code} {e.read().decode()}")

# Test /accounts
req3 = urllib.request.Request("http://localhost:8001/api/v1/accounts/", headers=headers)
try:
    resp3 = urllib.request.urlopen(req3)
    print(f"/accounts: {resp3.read().decode()}")
except urllib.error.HTTPError as e:
    print(f"/accounts error: {e.code} {e.read().decode()}")
