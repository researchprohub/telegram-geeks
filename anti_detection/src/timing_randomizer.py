"""Timing randomizer for human-like behavior."""

import random
import time
from datetime import datetime


class TimingRandomizer:
    """Generates human-like timing patterns for actions."""

    @staticmethod
    def randomize_send_time(base_delay_ms: int, account_history: list[float] | None = None) -> int:
        """Calculate a randomized send time based on account history."""
        # Base variance: ±40%
        variance = base_delay_ms * 0.4
        random_delay = base_delay_ms + random.uniform(-variance, variance)

        # Account aging factor: newer accounts should be slower
        if account_history:
            age_factor = min(len(account_history) / 100, 1.0)
            random_delay *= (1 + age_factor * 0.5)

        return max(1000, int(random_delay))  # Minimum 1 second

    @staticmethod
    def human_like_delay(min_ms: int = 5000, max_ms: int = 60000) -> int:
        """Generate a human-like delay between actions."""
        # Weighted towards shorter delays with occasional long ones
        r = random.random()
        if r < 0.5:
            return random.randint(min_ms, int((min_ms + max_ms) * 0.4))
        elif r < 0.85:
            return random.randint(int((min_ms + max_ms) * 0.4), int((min_ms + max_ms) * 0.7))
        else:
            return random.randint(int((min_ms + max_ms) * 0.7), max_ms)

    @staticmethod
    def simulate_typing_speed(message_length: int, words_per_minute: int = 40) -> int:
        """Simulate typing indicator duration."""
        word_count = max(1, message_length // 5)  # ~5 chars per word
        seconds = word_count / words_per_minute * 60
        # Add variance
        return int(seconds * random.uniform(0.8, 1.5)) * 1000  # ms

    @staticmethod
    def calculate_response_delay(
        last_message_age: int = 0,
        hour_of_day: int = 12,
        is_peak_hour: bool = True,
    ) -> int:
        """Calculate realistic response delay."""
        # Peak hours = faster responses (more active)
        base_delay = random.randint(30, 120) if is_peak_hour else random.randint(120, 600)

        # Older conversations = longer delays
        if last_message_age > 3600:
            base_delay *= 2
        if last_message_age > 86400:
            base_delay *= 3

        # Add randomness
        return int(base_delay * random.uniform(0.5, 1.5))

    @staticmethod
    def simulate_sleep_cycle(account_id: str) -> bool:
        """Determine if an account should 'sleep' (be offline)."""
        hour = datetime.utcnow().hour
        # Most accounts sleep between 2-7 AM
        if 2 <= hour <= 7:
            # 80% chance of sleeping
            return random.random() < 0.8
        # During active hours, brief "away" periods
        return random.random() < 0.02

    @staticmethod
    def jitter(base_value: float, percentage: float = 0.3) -> float:
        """Add random jitter to a value."""
        return base_value * (1 + random.uniform(-percentage, percentage))
