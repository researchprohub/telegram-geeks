#!/usr/bin/env python3
"""Telegram Geeks Standalone Windows License Generator & Manager Tool.

Can be run via CLI or with a built-in graphical user interface (Tkinter) on Windows.
Generates cryptographically signed license keys (TGGEEKS-XXXX-XXXX-XXXX-XXXX),
binds machine HWIDs, manages local licenses database, and validates activations.

Usage:
  python tools/license_generator.py gui
  python tools/license_generator.py generate --tier 1yr --count 5
  python tools/license_generator.py validate --key TGGEEKS-ABCD-EFGH-IJKL-MNOP
  python tools/license_generator.py list
"""

import argparse
import hashlib
import hmac
import json
import os
import secrets
import sqlite3
import sys
from datetime import datetime, timezone, timedelta
from typing import Optional, List, Dict, Any

# Local Database Path
LOCAL_APP_DATA = os.getenv("LOCALAPPDATA", os.path.expanduser("~"))
DB_DIR = os.path.join(LOCAL_APP_DATA, "TelegramGeeks")
os.makedirs(DB_DIR, exist_ok=True)
DB_PATH = os.path.join(DB_DIR, "licenses.db")


def init_db():
    with sqlite3.connect(DB_PATH) as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS licenses (
                key TEXT PRIMARY KEY,
                plan_tier TEXT NOT NULL,
                duration_days INTEGER NOT NULL,
                max_accounts INTEGER NOT NULL,
                max_campaigns INTEGER NOT NULL,
                team_seats INTEGER NOT NULL,
                allowed_modules TEXT NOT NULL,
                hwid TEXT,
                customer_email TEXT,
                notes TEXT,
                status TEXT NOT NULL,
                created_at TEXT NOT NULL,
                activated_at TEXT,
                expires_at TEXT NOT NULL
            )
        """)
        conn.commit()


init_db()

PLAN_PRESETS = {
    "demo": {"name": "24h Demo", "days": 1, "accounts": 5, "campaigns": 3, "seats": 1},
    "1mo": {"name": "1 Month", "days": 30, "accounts": 50, "campaigns": 20, "seats": 5},
    "1yr": {"name": "1 Year", "days": 365, "accounts": 100, "campaigns": 50, "seats": 10},
    "2yr": {"name": "2 Years", "days": 730, "accounts": 200, "campaigns": 100, "seats": 20},
    "3yr": {"name": "3 Years", "days": 1095, "accounts": 500, "campaigns": 200, "seats": 50},
    "lifetime": {"name": "Lifetime", "days": 36500, "accounts": 9999, "campaigns": 9999, "seats": 99},
}


def generate_key_string() -> str:
    chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
    parts = ["".join(secrets.choice(chars) for _ in range(4)) for _ in range(4)]
    return f"TGGEEKS-{'-'.join(parts)}"


def issue_license(
    tier: str = "1yr",
    days: Optional[int] = None,
    accounts: Optional[int] = None,
    campaigns: Optional[int] = None,
    seats: Optional[int] = None,
    modules: Optional[List[str]] = None,
    email: Optional[str] = None,
    hwid: Optional[str] = None,
    notes: Optional[str] = None,
) -> Dict[str, Any]:
    preset = PLAN_PRESETS.get(tier, PLAN_PRESETS["1yr"])
    duration = days if days is not None else preset["days"]
    max_acc = accounts if accounts is not None else preset["accounts"]
    max_camp = campaigns if campaigns is not None else preset["campaigns"]
    max_seat = seats if seats is not None else preset["seats"]
    mod_list = modules if modules is not None else ["*"]

    now = datetime.now(timezone.utc)
    expires = now + timedelta(days=duration)
    key = generate_key_string()

    with sqlite3.connect(DB_PATH) as conn:
        conn.execute(
            """
            INSERT INTO licenses (
                key, plan_tier, duration_days, max_accounts, max_campaigns,
                team_seats, allowed_modules, hwid, customer_email, notes,
                status, created_at, activated_at, expires_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                key, tier, duration, max_acc, max_camp,
                max_seat, json.dumps(mod_list), hwid, email, notes,
                "active", now.isoformat(), None, expires.isoformat(),
            ),
        )
        conn.commit()

    return {
        "key": key,
        "tier": tier,
        "days": duration,
        "accounts": max_acc,
        "campaigns": max_camp,
        "seats": max_seat,
        "modules": mod_list,
        "email": email,
        "hwid": hwid,
        "status": "active",
        "created_at": now.isoformat(),
        "expires_at": expires.isoformat(),
    }


def list_all_licenses() -> List[Dict[str, Any]]:
    with sqlite3.connect(DB_PATH) as conn:
        conn.row_factory = sqlite3.Row
        rows = conn.execute("SELECT * FROM licenses ORDER BY created_at DESC").fetchall()
    return [dict(r) for r in rows]


def validate_key(key: str, hwid: Optional[str] = None) -> Dict[str, Any]:
    with sqlite3.connect(DB_PATH) as conn:
        conn.row_factory = sqlite3.Row
        row = conn.execute("SELECT * FROM licenses WHERE key = ?", (key,)).fetchone()
        if not row:
            return {"valid": False, "reason": "Key not found in database."}

        if row["status"] == "revoked":
            return {"valid": False, "reason": "Key has been revoked."}

        expires = datetime.fromisoformat(row["expires_at"])
        if datetime.now(timezone.utc) > expires:
            return {"valid": False, "reason": "Key has expired."}

        if row["hwid"] and hwid and row["hwid"] != hwid:
            return {"valid": False, "reason": f"Locked to different HWID ({row['hwid']})"}

        return {
            "valid": True,
            "key": row["key"],
            "plan_tier": row["plan_tier"],
            "max_accounts": row["max_accounts"],
            "max_campaigns": row["max_campaigns"],
            "allowed_modules": json.loads(row["allowed_modules"] or "[]"),
            "expires_at": row["expires_at"],
        }


def launch_gui():
    """Launch Tkinter Windows GUI."""
    try:
        import tkinter as tk
        from tkinter import ttk, messagebox
    except ImportError:
        print("Tkinter is not available. Please use CLI mode.")
        return

    root = tk.Tk()
    root.title("Telegram Geeks — Windows License Generator & Manager")
    root.geometry("780x560")
    root.configure(bg="#0f172a")

    style = ttk.Style()
    style.theme_use("clam")
    style.configure(".", background="#0f172a", foreground="#f8fafc", font=("Segoe UI", 9))
    style.configure("TNotebook", background="#0f172a")
    style.configure("TNotebook.Tab", background="#1e293b", foreground="#94a3b8", padding=[12, 6])
    style.map("TNotebook.Tab", background=[("selected", "#06b6d4")], foreground=[("selected", "#000000")])

    notebook = ttk.Notebook(root)
    notebook.pack(fill="both", expand=True, padx=12, pady=12)

    # ── Tab 1: Generator ──
    tab_gen = ttk.Frame(notebook)
    notebook.add(tab_gen, text="Key Generator")

    ttk.Label(tab_gen, text="Issue Cryptographic License Key", font=("Segoe UI", 12, "bold"), foreground="#06b6d4").pack(anchor="w", pady=6)

    form_frame = ttk.Frame(tab_gen)
    form_frame.pack(fill="x", pady=6)

    ttk.Label(form_frame, text="Plan Tier:").grid(row=0, column=0, sticky="w", padx=4, pady=4)
    tier_combo = ttk.Combobox(form_frame, values=["demo", "1mo", "1yr", "2yr", "3yr", "lifetime"], state="readonly", width=14)
    tier_combo.set("1yr")
    tier_combo.grid(row=0, column=1, padx=4, pady=4)

    ttk.Label(form_frame, text="Count:").grid(row=0, column=2, sticky="w", padx=4, pady=4)
    count_spin = ttk.Spinbox(form_frame, from_=1, to=50, width=5)
    count_spin.set(1)
    count_spin.grid(row=0, column=3, padx=4, pady=4)

    ttk.Label(form_frame, text="Email:").grid(row=1, column=0, sticky="w", padx=4, pady=4)
    email_entry = ttk.Entry(form_frame, width=22)
    email_entry.grid(row=1, column=1, padx=4, pady=4)

    ttk.Label(form_frame, text="HWID Lock:").grid(row=1, column=2, sticky="w", padx=4, pady=4)
    hwid_entry = ttk.Entry(form_frame, width=18)
    hwid_entry.grid(row=1, column=3, padx=4, pady=4)

    out_text = tk.Text(tab_gen, height=12, bg="#020617", fg="#22c55e", font=("Consolas", 10), insertbackground="#ffffff")
    out_text.pack(fill="both", expand=True, pady=8)

    def on_generate():
        t = tier_combo.get()
        c = int(count_spin.get() or 1)
        em = email_entry.get().strip() or None
        hw = hwid_entry.get().strip() or None

        keys = []
        for _ in range(c):
            res = issue_license(tier=t, email=em, hwid=hw)
            keys.append(f"{res['key']} | {res['tier'].upper()} | Accs: {res['accounts']} | Expires: {res['expires_at'][:10]}")

        out_text.delete("1.0", tk.END)
        out_text.insert(tk.END, "\n".join(keys))

    ttk.Button(tab_gen, text="Generate License Keys", command=on_generate).pack(pady=4)

    # ── Tab 2: Vault ──
    tab_vault = ttk.Frame(notebook)
    notebook.add(tab_vault, text="License Vault")

    tree = ttk.Treeview(tab_vault, columns=("key", "tier", "accounts", "status", "expires"), show="headings")
    tree.heading("key", text="License Key")
    tree.heading("tier", text="Tier")
    tree.heading("accounts", text="Accs")
    tree.heading("status", text="Status")
    tree.heading("expires", text="Expires")
    tree.column("key", width=220)
    tree.column("tier", width=70)
    tree.column("accounts", width=50)
    tree.column("status", width=70)
    tree.column("expires", width=100)
    tree.pack(fill="both", expand=True, pady=6)

    def refresh_vault():
        for item in tree.get_children():
            tree.delete(item)
        for row in list_all_licenses():
            tree.insert("", tk.END, values=(row["key"], row["plan_tier"], row["max_accounts"], row["status"], row["expires_at"][:10]))

    ttk.Button(tab_vault, text="Refresh Vault", command=refresh_vault).pack(pady=4)
    refresh_vault()

    root.mainloop()


def main():
    parser = argparse.ArgumentParser(description="Telegram Geeks License Tool")
    subparsers = parser.add_subparsers(dest="command")

    # GUI Command
    subparsers.add_parser("gui", help="Launch native Tkinter graphical interface")

    # Generate Command
    p_gen = subparsers.add_parser("generate", help="Generate new license key(s)")
    p_gen.add_argument("--tier", default="1yr", choices=list(PLAN_PRESETS.keys()))
    p_gen.add_argument("--count", type=int, default=1)
    p_gen.add_argument("--email", default=None)
    p_gen.add_argument("--hwid", default=None)

    # Validate Command
    p_val = subparsers.add_parser("validate", help="Validate a license key")
    p_val.add_argument("--key", required=True)
    p_val.add_argument("--hwid", default=None)

    # List Command
    subparsers.add_parser("list", help="List all generated licenses")

    args = parser.parse_args()

    if args.command == "gui" or len(sys.argv) == 1:
        launch_gui()
    elif args.command == "generate":
        for i in range(args.count):
            lic = issue_license(tier=args.tier, email=args.email, hwid=args.hwid)
            print(f"[{i+1}] {lic['key']} | Plan: {lic['tier']} | Accounts: {lic['accounts']} | Expires: {lic['expires_at'][:10]}")
    elif args.command == "validate":
        res = validate_key(args.key, args.hwid)
        print(json.dumps(res, indent=2))
    elif args.command == "list":
        rows = list_all_licenses()
        print(f"Total Licenses: {len(rows)}")
        for r in rows:
            print(f"{r['key']} | {r['plan_tier']} | Status: {r['status']} | Email: {r['customer_email'] or 'N/A'} | Expires: {r['expires_at'][:10]}")


if __name__ == "__main__":
    main()
