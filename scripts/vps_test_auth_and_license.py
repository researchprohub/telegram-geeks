import requests
import json
import urllib3

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

base_url = "https://127.0.0.1"
headers = {"Host": "telegramgeekspro.com"}

print("Testing user login on production backend...")
login_payload = {
    "email": "admin@test.com",
    "password": "admin123"
}

resp = requests.post(f"{base_url}/api/v1/auth/login", json=login_payload, headers=headers, verify=False, timeout=10)
print(f"Login Response Status: {resp.status_code}")
data = resp.json()
print("Response Data:", json.dumps(data, indent=2))

if resp.status_code == 200 and "access_token" in data:
    token = data["access_token"]
    auth_headers = {
        "Host": "telegramgeekspro.com",
        "Authorization": f"Bearer {token}"
    }
    
    # Test License Generation
    print("\nTesting admin license generation endpoint...")
    lic_gen = {
        "plan_tier": "lifetime",
        "customer_email": "admin@test.com",
        "notes": "Master Administrator License Key"
    }
    gen_resp = requests.post(f"{base_url}/api/v1/licenses/admin/generate", json=lic_gen, headers=auth_headers, verify=False)
    print(f"Generate License Status: {gen_resp.status_code}")
    print("License Data:", json.dumps(gen_resp.json(), indent=2))
    
    # Test License Activation & HWID Binding
    if gen_resp.status_code == 200:
        key = gen_resp.json()["license"]["key"]
        print(f"\nTesting client license activation with HWID for key: {key}...")
        act_resp = requests.post(f"{base_url}/api/v1/licenses/activate", json={"key": key, "hwid": "WIN-MOCK-HWID-001"}, headers=headers, verify=False)
        print(f"Activation Status: {act_resp.status_code}")
        print("Activation Data:", json.dumps(act_resp.json(), indent=2))
        
        # Test HWID Lock Enforce (different HWID should be blocked)
        print("\nTesting anti-piracy HWID lock mismatch prevention...")
        hacker_resp = requests.post(f"{base_url}/api/v1/licenses/activate", json={"key": key, "hwid": "HACKER-CRACK-HWID-999"}, headers=headers, verify=False)
        print(f"Hacker Mismatch Status (Expect 400): {hacker_resp.status_code}")
        print("Hacker Response:", json.dumps(hacker_resp.json(), indent=2))
