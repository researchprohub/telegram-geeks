import subprocess
import json
import sys

if sys.platform == "win32":
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")

BASE_URL = "http://localhost:8000"

# Fresh login after role update
resp = subprocess.run(
    ["curl", "-s", "-X", "POST", f"{BASE_URL}/api/v1/auth/login",
     "-H", "Content-Type: application/json",
     "-d", json.dumps({"email": "testadmin@telegramgeeks.com", "password": "TestAdmin123!"})],
    capture_output=True, text=True
)
data = json.loads(resp.stdout)
token = data["access_token"]
print(f"Fresh token obtained")

def test_raw(module_id, operation, params):
    cmd = [
        "curl", "-s", "-X", "POST",
        f"{BASE_URL}/api/v1/modules/{module_id}/execute",
        "-H", f"Authorization: Bearer {token}",
        "-H", "Content-Type: application/json",
        "-d", json.dumps({"operation": operation, "params": params})
    ]
    resp = subprocess.run(cmd, capture_output=True, text=True)
    return json.loads(resp.stdout)

print("\n=== Pro-Gated Modules (Fresh Token) ===\n")

tests = [
    ("json_generator", "generate_json", {"session_string": "test", "api_id": 12345, "api_hash": "testhash"}),
    ("number_checker", "check_number", {"phone": "+1234567890"}),
    ("calculator_reports", "calculate_roi", {"messages_sent": 1000, "conversions": 50, "cost_per_account": 2.0, "revenue_per_conversion": 15.0, "total_accounts": 100}),
    ("link_checker", "check_link", {"url": "https://t.me/python"}),
]

for mod, op, params in tests:
    r = test_raw(mod, op, params)
    status = r.get("status", r.get("detail", {}).get("message", "N/A"))
    print(f"{mod}/{op}: {status}")
    if r.get("result"):
        print(f"  -> {json.dumps(r['result'], indent=2)[:200]}")
    print()
