"""Enhanced Affiliate System — tiers, commissions, payouts, tracking."""

import random
import string
from datetime import datetime, timezone, timedelta
from typing import Optional
from loguru import logger

AFFILIATE_TIERS = {
    "bronze":  {"min_sales": 0,   "commission_pct": 10, "bonus": 0},
    "silver":  {"min_sales": 10,  "commission_pct": 15, "bonus": 50},
    "gold":    {"min_sales": 50,  "commission_pct": 20, "bonus": 200},
    "elite":   {"min_sales": 200, "commission_pct": 30, "bonus": 1000},
}


class AffiliateManager:
    """Manage affiliate partners — referrals, commissions, payouts."""

    def __init__(self):
        self.partners: dict[str, dict] = {}
        self.commissions: list[dict] = []
        self.payouts: list[dict] = []

    def register(self, user_id: str, referral_code: str = "") -> dict:
        if user_id in self.partners:
            return self.partners[user_id]
        code = referral_code or self._generate_code()
        partner = {
            "user_id": user_id,
            "referral_code": code,
            "tier": "bronze",
            "total_sales": 0,
            "total_commission_earned": 0.0,
            "total_paid": 0.0,
            "balance": 0.0,
            "referrals": [],
            "milestones_unlocked": [],
            "registered_at": datetime.now(timezone.utc).isoformat(),
        }
        self.partners[user_id] = partner
        logger.info(f"Affiliate registered: {user_id} (code={code})")
        return partner

    def _generate_code(self) -> str:
        return "TG" + "".join(random.choices(string.ascii_uppercase + string.digits, k=8))

    def record_sale(self, affiliate_code: str, amount: float, referred_user_id: str = "") -> dict:
        partner = next((p for p in self.partners.values() if p["referral_code"] == affiliate_code), None)
        if not partner:
            return {"error": "Invalid affiliate code"}
        partner["total_sales"] += 1
        tier = self._get_tier(partner["total_sales"])
        if tier != partner["tier"]:
            old_tier = partner["tier"]
            partner["tier"] = tier
            milestone = {
                "type": "tier_upgrade",
                "from": old_tier,
                "to": tier,
                "bonus": AFFILIATE_TIERS[tier]["bonus"],
                "at": datetime.now(timezone.utc).isoformat(),
            }
            partner["milestones_unlocked"].append(milestone)
            partner["balance"] += AFFILIATE_TIERS[tier]["bonus"]
            partner["total_commission_earned"] += AFFILIATE_TIERS[tier]["bonus"]
            logger.info(f"Affiliate {partner['user_id']} upgraded: {old_tier} → {tier} (bonus=${AFFILIATE_TIERS[tier]['bonus']})")
        commission_pct = AFFILIATE_TIERS[tier]["commission_pct"]
        commission_amount = amount * commission_pct / 100
        commission_entry = {
            "user_id": partner["user_id"],
            "referral_code": affiliate_code,
            "sale_amount": amount,
            "commission_pct": commission_pct,
            "commission_amount": commission_amount,
            "referred_user_id": referred_user_id,
            "tier": tier,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        self.commissions.append(commission_entry)
        partner["balance"] += commission_amount
        partner["total_commission_earned"] += commission_amount
        if referred_user_id:
            partner["referrals"].append({"user_id": referred_user_id, "at": commission_entry["created_at"]})
        return commission_entry

    def _get_tier(self, sales: int) -> str:
        for tier_name, tier_data in sorted(AFFILIATE_TIERS.items(), key=lambda x: x[1]["min_sales"], reverse=True):
            if sales >= tier_data["min_sales"]:
                return tier_name
        return "bronze"

    def get_partner(self, user_id: str) -> Optional[dict]:
        p = self.partners.get(user_id)
        if p:
            return {**p, "next_tier": self._next_tier_info(p["total_sales"])}
        return None

    def _next_tier_info(self, sales: int) -> Optional[dict]:
        next_tier = None
        for name, data in sorted(AFFILIATE_TIERS.items(), key=lambda x: x[1]["min_sales"]):
            if sales < data["min_sales"]:
                next_tier = {"tier": name, "sales_needed": data["min_sales"] - sales, "commission_pct": data["commission_pct"], "bonus": data["bonus"]}
                break
        return next_tier

    def request_payout(self, user_id: str, amount: Optional[float] = None, method: str = "crypto") -> dict:
        partner = self.partners.get(user_id)
        if not partner:
            return {"error": "Affiliate not found"}
        payout_amount = amount or partner["balance"]
        if payout_amount <= 0:
            return {"error": "No balance to withdraw"}
        if payout_amount > partner["balance"]:
            return {"error": f"Insufficient balance. Available: ${partner['balance']:.2f}"}
        partner["balance"] -= payout_amount
        partner["total_paid"] += payout_amount
        payout = {
            "user_id": user_id,
            "amount": payout_amount,
            "method": method,
            "status": "pending",
            "requested_at": datetime.now(timezone.utc).isoformat(),
        }
        self.payouts.append(payout)
        logger.info(f"Payout requested: {user_id} → ${payout_amount:.2f} via {method}")
        return payout

    def get_leaderboard(self, top_n: int = 10) -> list[dict]:
        sorted_partners = sorted(self.partners.values(), key=lambda p: p["total_commission_earned"], reverse=True)
        return [{"user_id": p["user_id"], "tier": p["tier"], "total_sales": p["total_sales"], "total_commission_earned": p["total_commission_earned"]} for p in sorted_partners[:top_n]]

    def get_stats(self) -> dict:
        return {
            "total_partners": len(self.partners),
            "total_sales": sum(p["total_sales"] for p in self.partners.values()),
            "total_commission_earned": sum(p["total_commission_earned"] for p in self.partners.values()),
            "total_paid": sum(p["total_paid"] for p in self.partners.values()),
            "total_balance": sum(p["balance"] for p in self.partners.values()),
        }
