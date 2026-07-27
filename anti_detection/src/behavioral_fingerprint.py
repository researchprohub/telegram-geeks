"""Behavioral fingerprinting — ensures each account acts uniquely."""

import hashlib
import random
from typing import Optional


class BehavioralFingerprint:
    """Generates and manages unique behavioral fingerprints per account."""

    @staticmethod
    def generate_fingerprint(account_id: str, seed: str = "") -> dict:
        """Generate a unique behavioral fingerprint for an account."""
        seed_str = f"{account_id}:{seed}:{random.randint(0, 999999)}"
        hash_val = hashlib.sha256(seed_str.encode()).hexdigest()

        return {
            "typing_speed_wpm": random.randint(25, 80),
            "avg_message_length": random.randint(15, 200),
            "emoji_frequency": random.uniform(0.0, 0.3),
            "capitalization_style": random.choice(["normal", "lowercase", "mixed"]),
            "punctuation_habits": random.choice(["standard", "minimal", "expressive"]),
            "response_latency_base": random.randint(30, 300),
            "active_hours_bias": random.randint(6, 23),
            "conversation_style": random.choice(["questioner", "responder", "observer", "leader"]),
            "fingerprint_hash": hash_val[:16],
        }

    @staticmethod
    def randomize_keyboard_patterns(fingerprint: dict) -> dict:
        """Apply keyboard-specific patterns from fingerprint."""
        style = fingerprint.get("capitalization_style", "normal")
        if style == "lowercase":
            return {"use_lowercase": True, "random_caps": random.random() < 0.1}
        elif style == "mixed":
            return {"use_lowercase": False, "random_caps": random.random() < 0.3}
        return {"use_lowercase": False, "random_caps": False}

    @staticmethod
    def simulate_reading_time(message_length: int) -> int:
        """Simulate realistic reading time before responding."""
        words = max(1, message_length // 5)
        wpm = random.randint(150, 300)
        seconds = words / wpm * 60
        return max(2, int(seconds))  # At least 2 seconds

    @staticmethod
    def generate_typing_indicator(duration_ms: int) -> list[int]:
        """Generate typing indicator pulses (like real Telegram typing)."""
        pulses = []
        current = 0
        while current < duration_ms:
            pulse_interval = random.randint(500, 2000)
            pulses.append(current + pulse_interval)
            current += pulse_interval
        return pulses

    @staticmethod
    def ensure_diversity(fingerprints: list[dict]) -> list[dict]:
        """Ensure no two fingerprints are too similar."""
        for i in range(len(fingerprints)):
            for j in range(i + 1, len(fingerprints)):
                # If too similar, perturb one
                if fingerprints[i].get("fingerprint_hash") == fingerprints[j].get("fingerprint_hash"):
                    fingerprints[j]["typing_speed_wpm"] = random.randint(25, 80)
                    fingerprints[j]["avg_message_length"] = random.randint(15, 200)
        return fingerprints
