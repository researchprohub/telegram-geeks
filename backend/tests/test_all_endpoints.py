import urllib.request
import json

# Login
login_data = json.dumps({"email": "admin@test.com", "password": "Testpass123!"}).encode()
req = urllib.request.Request("http://localhost:8000/api/v1/auth/login", data=login_data, headers={"Content-Type": "application/json"}, method="POST")
resp = urllib.request.urlopen(req)
token_resp = json.loads(resp.read())
access_token = token_resp["access_token"]
print(f"Token: {access_token[:50]}...")

# Test /accounts
headers = {"Authorization": f"Bearer {access_token}"}
req2 = urllib.request.Request("http://localhost:8000/api/v1/accounts/", headers=headers)
try:
    resp2 = urllib.request.urlopen(req2)
    print(f"Accounts: {resp2.read().decode()}")
except urllib.error.HTTPError as e:
    print(f"Accounts error: {e.code} {e.read().decode()}")

# Test /campaigns
req3 = urllib.request.Request("http://localhost:8000/api/v1/campaigns/", headers=headers)
try:
    resp3 = urllib.request.urlopen(req3)
    print(f"Campaigns: {resp3.read().decode()}")
except urllib.error.HTTPError as e:
    print(f"Campaigns error: {e.code} {e.read().decode()}")

# Test /personas
req4 = urllib.request.Request("http://localhost:8000/api/v1/personas/", headers=headers)
try:
    resp4 = urllib.request.urlopen(req4)
    print(f"Personas: {resp4.read().decode()}")
except urllib.error.HTTPError as e:
    print(f"Personas error: {e.code} {e.read().decode()}")

# Test /groups
req5 = urllib.request.Request("http://localhost:8000/api/v1/groups/", headers=headers)
try:
    resp5 = urllib.request.urlopen(req5)
    print(f"Groups: {resp5.read().decode()}")
except urllib.error.HTTPError as e:
    print(f"Groups error: {e.code} {e.read().decode()}")

# Test /modules
req6 = urllib.request.Request("http://localhost:8000/api/v1/modules/", headers=headers)
try:
    resp6 = urllib.request.urlopen(req6)
    data = json.loads(resp6.read())
    print(f"Modules: {len(data.get('modules', []))} available")
except urllib.error.HTTPError as e:
    print(f"Modules error: {e.code} {e.read().decode()}")
