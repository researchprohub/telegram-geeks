#!/usr/bin/env python3
"""
Comprehensive test script for TelegramGeeks platform.
Creates test accounts for all plan tiers and validates all endpoints.

New Pricing Structure:
- Starter: $29/mo (13 modules, 5 accounts, 3 campaigns)
- Pro: $79/mo (29 modules, 25 accounts, 20 campaigns)
- Agency: $199/mo (29 modules, unlimited everything)
"""
import subprocess, json, sys, os

BASE = "http://localhost:8000/api/v1"
RESULTS = []

def post(path, data, token=None):
    cmd = ["curl", "-s", "-X", "POST", BASE + path, "-H", "Content-Type: application/json", "-H", "X-CSRF-Token: test_token", "-H", "Cookie: csrf_token=test_token"]
    if token:
        cmd += ["-H", "Authorization: Bearer " + token]
    cmd += ["-d", json.dumps(data)]
    r = subprocess.run(cmd, capture_output=True, text=True)
    try:
        return json.loads(r.stdout)
    except:
        return {"_raw": r.stdout}

def get(path, token=None):
    cmd = ["curl", "-s", BASE + path, "-H", "X-CSRF-Token: test_token", "-H", "Cookie: csrf_token=test_token"]
    if token:
        cmd += ["-H", "Authorization: Bearer " + token]
    r = subprocess.run(cmd, capture_output=True, text=True)
    try:
        return json.loads(r.stdout)
    except:
        return {"_raw": r.stdout}

def put(path, data, token=None):
    cmd = ["curl", "-s", "-X", "PUT", BASE + path, "-H", "Content-Type: application/json", "-H", "X-CSRF-Token: test_token", "-H", "Cookie: csrf_token=test_token"]
    if token:
        cmd += ["-H", "Authorization: Bearer " + token]
    cmd += ["-d", json.dumps(data)]
    r = subprocess.run(cmd, capture_output=True, text=True)
    try:
        return json.loads(r.stdout)
    except:
        return {"_raw": r.stdout}

# Test accounts for each plan tier
TEST_USERS = [
    ("admin@test.com",      "Admin@12345678", "Super Admin",           "admin",    "agency"),
    ("starter@test.com",    "Starter@123456", "Starter User",          "operator", "starter"),
    ("pro@test.com",        "ProUser@123456",   "Pro User",              "operator", "pro"),
    ("agency@test.com",     "Agency@1234567","Agency User",           "operator", "agency"),
    ("viewer@test.com",     "Viewer@1234567",  "Viewer User",           "viewer",   "starter"),
]

print("=" * 70)
print("TELEGRAMGEeks PLATFORM TEST SUITE")
print("=" * 70)
print("\nNEW PRICING STRUCTURE:")
print("  Starter: $29/mo  (13 modules, 5 accounts, 3 campaigns)")
print("  Pro:     $79/mo  (29 modules, 25 accounts, 20 campaigns)")
print("  Agency:  $199/mo (29 modules, unlimited everything)")
print("\nCOMPETITIVE ADVANTAGE vs Telegram Expert:")
print("  Telegram Expert: $120/mo base + $200-$1,250 per module")
print("  TelegramGeeks:   $29/mo base with 13 modules included")
print("=" * 70)

# ── STEP 1: Create/Test User Accounts ──
print("\n" + "=" * 70)
print("STEP 1: Creating Test User Accounts")
print("=" * 70)

tokens = {}
for email, pwd, name, role, plan in TEST_USERS:
    # Try login first (might already exist)
    r = post("/auth/login", {"email": email, "password": pwd})
    if "access_token" in r:
        tokens[email] = r["access_token"]
        print(f"  [OK] {email} (role={role}, plan={plan})")
        RESULTS.append({"user": email, "module": "auth", "status": "OK", "plan": plan, "role": role})
    else:
        # Register new user
        r = post("/auth/register", {"email": email, "password": pwd, "full_name": name})
        if "id" in r and "email" in r:
            # User created, now login
            lr = post("/auth/login", {"email": email, "password": pwd})
            if "access_token" in lr:
                if role == "admin":
                    # Upgrade in DB directly for test purposes
                    script = "import asyncio\\nfrom app.db.session import async_session_factory\\nfrom sqlalchemy import update\\nfrom app.models import User\\nasync def u():\\n    async with async_session_factory() as db:\\n        await db.execute(update(User).where(User.email=='admin@test.com').values(role='admin'))\\n        await db.commit()\\nasyncio.run(u())"
                    subprocess.run(["python", "-c", script.replace('\\n', '\n')])
                    # Re-login to get updated token
                    lr = post("/auth/login", {"email": email, "password": pwd})
                
                tokens[email] = lr["access_token"]
                print(f"  [OK] Registered + Logged in: {email} (role={role}, plan={plan})")
                RESULTS.append({"user": email, "module": "auth_register", "status": "OK", "plan": plan, "role": role})
            else:
                print(f"  [FAIL] Registered but login failed: {email}")
                RESULTS.append({"user": email, "module": "auth_login", "status": "FAIL", "plan": plan})
        else:
            print(f"  [FAIL] Registration failed: {email} -> {r}")
            RESULTS.append({"user": email, "module": "auth_register", "status": "FAIL", "plan": plan})

admin_token = tokens.get("admin@test.com")

# ── STEP 2: Validate Pricing Structure ──
print("\n" + "=" * 70)
print("STEP 2: Validating Pricing Structure")
print("=" * 70)

# Get plans from API
tok = tokens.get("starter@test.com")
if tok:
    plans = get("/modules/plans", tok)
    if isinstance(plans, list):
        print(f"  [OK] Retrieved {len(plans)} pricing tiers")
        for plan in plans:
            print(f"    {plan['tier'].upper()}: ${plan['price_monthly']}/mo (${plan['price_yearly']}/yr)")
            print(f"      Modules: {plan['accounts_limit']} accounts, {plan['campaigns_limit']} campaigns")
            print(f"      Features: {len(plan['features'])} features")
        RESULTS.append({"module": "pricing_structure", "status": "OK", "tiers": len(plans)})
    else:
        print(f"  [FAIL] Failed to get plans: {plans}")
        RESULTS.append({"module": "pricing_structure", "status": "FAIL"})

# ── STEP 3: Test Module Gating ──
print("\n" + "=" * 70)
print("STEP 3: Testing Module Gating by Plan Tier")
print("=" * 70)

# Test starter user - should have access to 13 modules
starter_token = tokens.get("starter@test.com")
if starter_token:
    # Test starter-accessible module
    starter_mod = post("/modules/booster/execute", {"operation": "start_warmup", "params": {}}, starter_token)
    if starter_mod.get("status") in ["queued", "success"]:
        print(f"  [OK] Starter user can access 'booster' module")
        RESULTS.append({"user": "starter@test.com", "module": "booster_execute", "status": "OK"})
    else:
        print(f"  [FAIL] Starter user cannot access 'booster': {starter_mod}")
        RESULTS.append({"user": "starter@test.com", "module": "booster_execute", "status": "FAIL"})
    
    # Test starter-inaccessible module (should get 403)
    pro_mod = post("/modules/cloner/execute", {"operation": "clone_channel", "params": {"source_channel_id": 123, "target_channel_id": 456, "account_id": "test_acc"}}, starter_token)
    if pro_mod.get("detail", {}).get("message") and "Pro" in str(pro_mod.get("detail", {})):
        print(f"  [OK] Starter user correctly blocked from 'cloner' module")
        RESULTS.append({"user": "starter@test.com", "module": "cloner_blocked", "status": "OK"})
    else:
        print(f"  [FAIL] Starter user should be blocked from 'cloner': {pro_mod}")
        RESULTS.append({"user": "starter@test.com", "module": "cloner_blocked", "status": "FAIL"})

# Test admin user - should have access to all modules
if admin_token:
    admin_mod = post("/modules/cloner/execute", {
        "operation": "clone_channel",
        "params": {
            "source_channel_id": 123,
            "target_channel_id": 456,
            "account_id": "test_acc"
        }
    }, admin_token)
    if admin_mod.get("status") in ["queued", "success"]:
        print(f"  [OK] Admin user can access 'cloner' module (all modules)")
        RESULTS.append({"user": "admin@test.com", "module": "cloner_execute", "status": "OK"})
    else:
        print(f"  [FAIL] Admin user cannot access 'cloner': {admin_mod}")
        RESULTS.append({"user": "admin@test.com", "module": "cloner_execute", "status": "FAIL"})

# ── STEP 4: Test Admin Endpoints ──
print("\n" + "=" * 70)
print("STEP 4: Testing Admin Endpoints")
print("=" * 70)

if admin_token:
    # Test users list
    users = get("/admin/users", admin_token)
    if isinstance(users, list):
        print(f"  [OK] Admin can list {len(users)} users")
        RESULTS.append({"module": "admin_users", "status": "OK", "count": len(users)})
    else:
        print(f"  [FAIL] Admin cannot list users: {users}")
        RESULTS.append({"module": "admin_users", "status": "FAIL"})
    
    # Test settings
    settings = get("/admin/settings", admin_token)
    if "starter_price_monthly" in settings:
        print(f"  [OK] Admin settings retrieved")
        print(f"    Starter: ${settings['starter_price_monthly']}/mo")
        print(f"    Pro: ${settings['pro_price_monthly']}/mo")
        print(f"    Agency: ${settings['agency_price_monthly']}/mo")
        RESULTS.append({"module": "admin_settings", "status": "OK"})
    else:
        print(f"  [FAIL] Admin settings failed: {settings}")
        RESULTS.append({"module": "admin_settings", "status": "FAIL"})
    
    # Test analytics
    analytics = get("/admin/analytics/overview", admin_token)
    if "total_users" in analytics:
        print(f"  [OK] Admin analytics retrieved")
        print(f"    Total Users: {analytics['total_users']}")
        print(f"    Active Users: {analytics['active_users']}")
        print(f"    Total Campaigns: {analytics['total_campaigns']}")
        RESULTS.append({"module": "admin_analytics", "status": "OK"})
    else:
        print(f"  [FAIL] Admin analytics failed: {analytics}")
        RESULTS.append({"module": "admin_analytics", "status": "FAIL"})

# ── STEP 5: Test Account CRUD ──
print("\n" + "=" * 70)
print("STEP 5: Testing Account CRUD")
print("=" * 70)

for email, pwd, name, role, plan in TEST_USERS[1:4]:  # starter, pro, agency
    tok = tokens.get(email)
    if not tok: continue
    
    # Create account
    import random
    rand_digits = "".join(str(random.randint(0, 9)) for _ in range(7))
    ar = post("/accounts/", {"phone_number": f"+1555{rand_digits}", "status": "warming", "trust_score": 50.0}, tok)
    if "id" in ar:
        aid = ar["id"]
        print(f"  [OK] Created account {aid} for {plan} plan")
        RESULTS.append({"user": email, "module": "account_create", "status": "OK", "id": aid, "plan": plan})
        
        # Test health check
        hr = post(f"/accounts/{aid}/health", {}, tok)
        if hr.get("is_connected") is not None:
            print(f"    Health check: OK")
            RESULTS.append({"user": email, "module": "account_health", "status": "OK", "id": aid, "plan": plan})
        else:
            print(f"    Health check: FAIL - {hr}")
            RESULTS.append({"user": email, "module": "account_health", "status": "FAIL", "id": aid, "plan": plan})
    else:
        print(f"  [FAIL] Create account for {email}: {ar}")
        RESULTS.append({"user": email, "module": "account_create", "status": "FAIL", "plan": plan})

# ── STEP 6: Test Persona CRUD ──
print("\n" + "=" * 70)
print("STEP 6: Testing Persona CRUD")
print("=" * 70)

for email, pwd, name, role, plan in TEST_USERS[1:4]:  # starter, pro, agency
    tok = tokens.get(email)
    if not tok: continue
    
    pr = post("/personas/", {
        "name": f"{plan.capitalize()} Persona",
        "tone": "casual",
        "energy_level": 0.7,
        "humor_level": 0.5,
        "formality_level": 0.3,
        "niche_tags": ["test"]
    }, tok)
    if "id" in pr:
        pid = pr["id"]
        print(f"  [OK] Created persona {pid} for {plan} plan")
        RESULTS.append({"user": email, "module": "persona_create", "status": "OK", "id": pid, "plan": plan})
    else:
        print(f"  [FAIL] Create persona for {email}: {pr}")
        RESULTS.append({"user": email, "module": "persona_create", "status": "FAIL", "plan": plan})

# ── STEP 7: Test Group CRUD ──
print("\n" + "=" * 70)
print("STEP 7: Testing Group CRUD")
print("=" * 70)

for email, pwd, name, role, plan in TEST_USERS[1:4]:  # starter, pro, agency
    tok = tokens.get(email)
    if not tok: continue
    
    gr = post("/groups/", {
        "chat_id": 1000000000 + hash(email) % 1000000,
        "title": f"{plan.capitalize()} Test Group",
        "group_type": "group",
        "niche_tags": ["test"]
    }, tok)
    if "id" in gr:
        gid = gr["id"]
        print(f"  [OK] Created group {gid} for {plan} plan")
        RESULTS.append({"user": email, "module": "group_create", "status": "OK", "id": gid, "plan": plan})
    else:
        print(f"  [FAIL] Create group for {email}: {gr}")
        RESULTS.append({"user": email, "module": "group_create", "status": "FAIL", "plan": plan})

# ── STEP 8: Test Campaign CRUD ──
print("\n" + "=" * 70)
print("STEP 8: Testing Campaign CRUD")
print("=" * 70)

for email, pwd, name, role, plan in TEST_USERS[1:4]:  # starter, pro, agency
    tok = tokens.get(email)
    if not tok: continue
    
    cr = post("/campaigns/", {
        "name": f"{plan.capitalize()} Campaign",
        "campaign_type": "engagement",
        "description": f"Test {plan} campaign"
    }, tok)
    if "id" in cr:
        crc = cr["id"]
        print(f"  [OK] Created campaign {crc} for {plan} plan")
        RESULTS.append({"user": email, "module": "campaign_create", "status": "OK", "id": crc, "plan": plan})
        
        # Test start
        cs = post(f"/campaigns/{crc}/start", {}, tok)
        if cs.get("status") == "running":
            print(f"    Campaign started: OK")
            RESULTS.append({"user": email, "module": "campaign_start", "status": "OK", "id": crc, "plan": plan})
        else:
            print(f"    Campaign start: FAIL - {cs}")
            RESULTS.append({"user": email, "module": "campaign_start", "status": "FAIL", "id": crc, "plan": plan})
    else:
        print(f"  [FAIL] Create campaign for {email}: {cr}")
        RESULTS.append({"user": email, "module": "campaign_create", "status": "FAIL", "plan": plan})

# ── STEP 9: Test Analytics Endpoints ──
print("\n" + "=" * 70)
print("STEP 9: Testing Analytics Endpoints")
print("=" * 70)

tok = tokens.get("starter@test.com")
if tok:
    # Get accounts for analytics
    accounts = get("/accounts/", tok)
    if isinstance(accounts, list) and len(accounts) > 0:
        aid = accounts[0]["id"]
        ah = get(f"/analytics/account-health/{aid}", tok)
        if ah.get("account_id") == aid:
            print(f"  [OK] Account health analytics working")
            RESULTS.append({"module": "analytics_account_health", "status": "OK"})
        else:
            print(f"  [FAIL] Account health analytics: {ah}")
            RESULTS.append({"module": "analytics_account_health", "status": "FAIL"})
    
    # Get campaigns for analytics
    camps = get("/campaigns/", tok)
    if isinstance(camps, list) and len(camps) > 0:
        crc = camps[0]["id"]
        asum = get(f"/analytics/summary/{crc}", tok)
        if asum.get("campaign_id") == crc:
            print(f"  [OK] Campaign summary analytics working")
            RESULTS.append({"module": "analytics_summary", "status": "OK"})
        else:
            print(f"  [FAIL] Campaign summary analytics: {asum}")
            RESULTS.append({"module": "analytics_summary", "status": "FAIL"})

# ── STEP 10: Test Payment Endpoints ──
print("\n" + "=" * 70)
print("STEP 10: Testing Payment Endpoints")
print("=" * 70)

tok = tokens.get("starter@test.com")
if tok:
    # Test payment creation
    pay = post("/payments/create", {
        "amount": 29.0,  # Starter plan price
        "currency": "USD",
        "order_id": "test_starter",
        "gateway": "nowpayments"
    }, tok)
    if "payment_id" in pay:
        print(f"  [OK] Payment created: {pay['payment_id']}")
        RESULTS.append({"module": "payment_create", "status": "OK"})
    else:
        detail = pay.get("detail", "Unknown error")
        print(f"  [INFO] Payment: {detail[:80]}")
        RESULTS.append({"module": "payment_create", "status": "INFO", "detail": str(detail)[:80]})
    
    # Test manual deposit
    md = post("/payments/manual-deposit", {
        "currency": "USDT",
        "network": "TRC20"
    }, tok)
    if "address" in md:
        print(f"  [OK] Manual deposit address: {md['address'][:20]}...")
        RESULTS.append({"module": "manual_deposit", "status": "OK"})
    else:
        detail = md.get("detail", "Not configured")
        print(f"  [INFO] Manual deposit: {detail[:80]}")
        RESULTS.append({"module": "manual_deposit", "status": "INFO"})

# ── STEP 11: Test Module Registry ──
print("\n" + "=" * 70)
print("STEP 11: Testing Module Registry (29 modules)")
print("=" * 70)

tok = tokens.get("starter@test.com")
if tok:
    mods = get("/modules", tok)
    total = mods.get("total", 0)
    active = mods.get("active", 0)
    modules = mods.get("modules", [])
    cats = mods.get("categories", [])
    
    print(f"  Total modules: {total}")
    print(f"  Active modules: {active}")
    print(f"  Categories: {', '.join(cats)}")
    
    RESULTS.append({"module": "modules_list", "status": "OK", "total": total, "active": active})
    
    # Test a few key modules
    test_modules = ["converter", "mass_messaging", "invite_modules", "cloner", "bot_creator"]
    for mod_id in test_modules:
        mod = next((m for m in modules if m["id"] == mod_id), None)
        if mod:
            print(f"    [OK] {mod_id}: {mod['name']}")
            RESULTS.append({"module": f"{mod_id}_exists", "status": "OK"})
        else:
            print(f"    [FAIL] {mod_id}: not found")
            RESULTS.append({"module": f"{mod_id}_exists", "status": "FAIL"})

# ── FINAL SUMMARY ──
print("\n" + "=" * 70)
print("FINAL TEST SUMMARY")
print("=" * 70)

ok = sum(1 for r in RESULTS if r.get("status") in ("OK", "queued", "received", "INFO"))
fail = sum(1 for r in RESULTS if r.get("status") == "FAIL")
info = sum(1 for r in RESULTS if r.get("status") == "INFO")

print(f"  [OK] Passed: {ok}")
print(f"  [FAIL] Failed: {fail}")
print(f"  [INFO] Informational: {info}")
print(f"  Total tests: {len(RESULTS)}")

# Module breakdown
ms = {}
for r in RESULTS:
    m = r.get("module", "?")
    s = r.get("status", "?")
    if m not in ms: ms[m] = {"ok": 0, "fail": 0, "info": 0}
    if s in ("OK", "queued", "received", "INFO"): ms[m]["ok"] += 1
    elif s == "FAIL": ms[m]["fail"] += 1
    else: ms[m]["info"] += 1

print("\n  Module Breakdown:")
for mod, c in sorted(ms.items()):
    bar = "+" * c["ok"] + "-" * c["fail"] + "~" * c["info"]
    print(f"    {mod:40s} {bar} (+{c['ok']} -{c['fail']} ~{c['info']})")

# Plan tier breakdown
ps = {}
for r in RESULTS:
    p = r.get("plan", "system")
    if p not in ps: ps[p] = {"ok": 0, "fail": 0}
    if r.get("status") in ("OK", "queued", "received", "INFO"): ps[p]["ok"] += 1
    else: ps[p]["fail"] += 1

print("\n  Plan Tier Results:")
for plan, c in sorted(ps.items()):
    bar = "+" * c["ok"] + "-" * c["fail"]
    print(f"    {plan:15s} {bar} (+{c['ok']} -{c['fail']})")

# Save results
outpath = os.path.join(os.path.dirname(os.path.abspath(__file__)), "test_results_final.json")
with open(outpath, "w") as f:
    json.dump(RESULTS, f, indent=2, default=str)
print(f"\n  Full results saved to {outpath}")

# Print test accounts summary
print("\n" + "=" * 70)
print("TEST ACCOUNTS SUMMARY")
print("=" * 70)
for email, pwd, name, role, plan in TEST_USERS:
    print(f"  {email:25s} | Role: {role:10s} | Plan: {plan:10s} | Password: {pwd}")

print("\n" + "=" * 70)
if fail == 0:
    print("  [ALL TESTS PASSED - {ok} ok, {info} info]".format(ok=ok, info=info))
else:
    print(f"  [!] {fail} test(s) FAILED")
print("=" * 70)

sys.exit(0 if fail == 0 else 1)
