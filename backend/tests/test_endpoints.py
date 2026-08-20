import urllib.request
import json

# Login
login_data = json.dumps({"email": "admin@test.com", "password": "Testpass123!"}).encode()
req = urllib.request.Request("http://localhost:8001/api/v1/auth/login", data=login_data, headers={"Content-Type": "application/json"}, method="POST")
resp = urllib.request.urlopen(req)
token_resp = json.loads(resp.read())
access_token = token_resp["access_token"]

# Test /accounts with Bearer token
headers = {"Authorization": f"Bearer {access_token}"}
req2 = urllib.request.Request("http://localhost:8001/api/v1/accounts/", headers=headers)
try:
    resp2 = urllib.request.urlopen(req2)
    print(f"Accounts: {resp2.read().decode()}")
except urllib.error.HTTPError as e:
    print(f"Accounts error: {e.code} {e.read().decode()}")

# Test /campaigns with Bearer token
req3 = urllib.request.Request("http://localhost:8001/api/v1/campaigns/", headers=headers)
try:
    resp3 = urllib.request.urlopen(req3)
    print(f"Campaigns: {resp3.read().decode()}")
except urllib.error.HTTPError as e:
    print(f"Campaigns error: {e.code} {e.read().decode()}")
