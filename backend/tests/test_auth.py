import urllib.request
import json

# Login
login_data = json.dumps({"email": "admin@test.com", "password": "Testpass123!"}).encode()
req = urllib.request.Request("http://localhost:8001/api/v1/auth/login", data=login_data, headers={"Content-Type": "application/json"}, method="POST")
resp = urllib.request.urlopen(req)
token_resp = json.loads(resp.read())
access_token = token_resp["access_token"]
print(f"Got access token: {access_token[:50]}...")

# Test /me endpoint
req2 = urllib.request.Request("http://localhost:8001/api/v1/auth/me", headers={"Authorization": f"Bearer {access_token}"})
resp2 = urllib.request.urlopen(req2)
me_data = json.loads(resp2.read())
print(f"/me response: {me_data}")

# Test /accounts endpoint
req3 = urllib.request.Request("http://localhost:8001/api/v1/accounts/", headers={"Authorization": f"Bearer {access_token}"})
resp3 = urllib.request.urlopen(req3)
accounts_data = json.loads(resp3.read())
print(f"/accounts response: {accounts_data}")
