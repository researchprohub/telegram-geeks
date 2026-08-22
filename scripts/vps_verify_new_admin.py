import requests
import json
import urllib3

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

base_url = "https://127.0.0.1"
headers = {"Host": "telegramgeekspro.com"}

print("Testing new admin login on production backend...")
login_payload = {
    "email": "discordmasters@atomicmail.io",
    "password": "Blackhat2020@@@"
}

resp = requests.post(f"{base_url}/api/v1/auth/login", json=login_payload, headers=headers, verify=False, timeout=10)
print(f"New Admin Login Status: {resp.status_code}")
data = resp.json()
print("Response Data:", json.dumps(data, indent=2))

if resp.status_code == 200:
    token = data["access_token"]
    auth_headers = {
        "Host": "telegramgeekspro.com",
        "Authorization": f"Bearer {token}"
    }
    me_resp = requests.get(f"{base_url}/api/v1/auth/me", headers=auth_headers, verify=False)
    print("\nAuthenticated User Profile (/api/v1/auth/me):")
    print(json.dumps(me_resp.json(), indent=2))

# Verify old admin login is rejected
print("\nVerifying old admin@test.com is blocked...")
old_resp = requests.post(f"{base_url}/api/v1/auth/login", json={"email": "admin@test.com", "password": "admin123"}, headers=headers, verify=False)
print(f"Old Admin Status (Expect 401): {old_resp.status_code}")
