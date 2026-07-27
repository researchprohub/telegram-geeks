"""Gender Detection — Determine user gender via AI analysis (Telegram Expert clone)."""

import re
from loguru import logger


class GenderDetectorService:
    """Detect user gender from name, username, and profile data."""

    # Common male/female name prefixes and suffixes
    MALE_INDICATORS = {
        "names": ["alex", "john", "mike", "david", "james", "robert", "alexander", "max", "dmitry", "ivan", "peter", "nick", "tom", "chris", "adam", "ryan", "kevin", "mark", "steve", "jason", "andrew", "ben", "jake", "sam", "leo", "oscar", "harry", "george", "william", "henry", "edward", "frank", "lucas", "noah", "oliver", "emma", "jack", "elijah", "liam", "owen", "ethan", "daniel", "matthew", "samuel", "gabriel", "julian", "theodore", "aiden", "nicholas", "luke", "jayden", "nathan", "tyler"],
        "suffixes": ["ov", "ev", "sky", "man", "boy", "guy", "bro"],
    }

    FEMALE_INDICATORS = {
        "names": ["emma", "olivia", "sophia", "isabella", "mia", "charlotte", "amelia", "harper", "evelyn", "abigail", "emily", "elizabeth", "victoria", "aria", "grace", "chloe", "camila", "zoey", "penelope", "luna", "layla", "nora", "riley", "skylar", "aurora", "hannah", "lily", "ella", "avery", "sarah", "kate", "anna", "rosa", "lucia", "maria", "elena", "natasha", "irina", "olga", "sveta", "katya", "masha", "anya", "dasha", "lena", "vera", "polina", "alina", "milana", "kristina"],
        "suffixes": ["ova", "eva", "ina", "ina", "a", "ia", "ka", "na", "sha", "nya"],
    }

    def detect_gender(self, first_name: str = "", last_name: str = "", username: str = "") -> dict:
        """Detect gender from name components."""
        scores = {"male": 0, "female": 0, "neutral": 0}
        confidence = 0.0
        reasons = []

        # Check first name
        if first_name:
            fn_lower = first_name.lower()
            for name in self.MALE_INDICATORS["names"]:
                if fn_lower == name or fn_lower.startswith(name):
                    scores["male"] += 3
                    reasons.append(f"Male name: {first_name}")
                    break
            for name in self.FEMALE_INDICATORS["names"]:
                if fn_lower == name or fn_lower.startswith(name):
                    scores["female"] += 3
                    reasons.append(f"Female name: {first_name}")
                    break

            # Check suffixes
            for suffix in self.MALE_INDICATORS["suffixes"]:
                if fn_lower.endswith(suffix):
                    scores["male"] += 1
                    break
            for suffix in self.FEMALE_INDICATORS["suffixes"]:
                if fn_lower.endswith(suffix):
                    scores["female"] += 1
                    break

        # Check username
        if username:
            un_lower = username.lower().replace("@", "")
            for name in self.MALE_INDICATORS["names"]:
                if name in un_lower:
                    scores["male"] += 1
                    break
            for name in self.FEMALE_INDICATORS["names"]:
                if name in un_lower:
                    scores["female"] += 1
                    break

        # Determine result
        total = scores["male"] + scores["female"] + scores["neutral"]
        if total == 0:
            return {"gender": "unknown", "confidence": 0.0, "scores": scores, "reasons": ["No name data provided"]}

        if scores["male"] > scores["female"]:
            gender = "male"
            confidence = scores["male"] / max(total, 1)
        elif scores["female"] > scores["male"]:
            gender = "female"
            confidence = scores["female"] / max(total, 1)
        else:
            gender = "neutral"
            confidence = 0.5

        return {
            "gender": gender,
            "confidence": round(min(confidence, 1.0), 2),
            "scores": scores,
            "reasons": reasons if reasons else ["Insufficient data for confident detection"],
        }

    def batch_detect(self, users: list[dict]) -> list[dict]:
        """Batch detect gender for multiple users."""
        results = []
        for user in users:
            result = self.detect_gender(
                first_name=user.get("first_name", ""),
                last_name=user.get("last_name", ""),
                username=user.get("username", ""),
            )
            result["user_id"] = user.get("id", "unknown")
            results.append(result)
        return results
