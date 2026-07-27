"""Cheating/Anti-Detection module — simulate organic human behavior.

Telegram Expert manual: Cheating section

Simulates:
- Random delays between actions
- Natural posting patterns
- Avoiding mass actions
- Organic behavior profiles
"""

import asyncio
import random
import time
from datetime import datetime, timezone
from typing import Dict, List, Optional, Callable
from loguru import logger


class AntiDetectionService:
    """Simulate organic human behavior to avoid detection."""

    def __init__(self, client_manager):
        self.client_manager = client_manager
        self.behavior_profiles: Dict[str, Dict] = {}
        self.action_log: List[Dict] = []

    def create_behavior_profile(
        self,
        profile_name: str,
        min_delay: float = 5.0,
        max_delay: float = 60.0,
        activity_pattern: str = "natural",  # natural, random, burst
        max_actions_per_hour: int = 50,
        active_hours: Optional[List[int]] = None,
    ) -> Dict:
        """Create a behavior profile for an account.
        
        Args:
            profile_name: Name for this profile
            min_delay: Minimum delay between actions (seconds)
            max_delay: Maximum delay between actions (seconds)
            activity_pattern: Pattern type
            max_actions_per_hour: Max actions in one hour
            active_hours: Hours when account is active (0-23)
        """
        if active_hours is None:
            # Default: 8 AM to 10 PM
            active_hours = list(range(8, 22))
        
        profile = {
            "name": profile_name,
            "min_delay": min_delay,
            "max_delay": max_delay,
            "activity_pattern": activity_pattern,
            "max_actions_per_hour": max_actions_per_hour,
            "active_hours": active_hours,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        
        self.behavior_profiles[profile_name] = profile
        logger.info(f"Created behavior profile: {profile_name}")
        
        return {"status": "success", "profile": profile}

    async def apply_delay(
        self,
        profile_name: str,
        account_phone: str,
    ) -> float:
        """Apply organic delay based on behavior profile.
        
        Returns:
            Actual delay applied (seconds)
        """
        if profile_name not in self.behavior_profiles:
            # Default profile
            min_delay = 5.0
            max_delay = 30.0
        else:
            profile = self.behavior_profiles[profile_name]
            min_delay = profile["min_delay"]
            max_delay = profile["max_delay"]
        
        # Check if account is in active hours
        current_hour = datetime.now(timezone.utc).hour
        
        if profile_name in self.behavior_profiles:
            active_hours = self.behavior_profiles[profile_name]["active_hours"]
            if current_hour not in active_hours:
                # Longer delay during inactive hours
                min_delay *= 3
                max_delay *= 3
        
        # Calculate delay based on pattern
        if self.behavior_profiles.get(profile_name, {}).get("activity_pattern") == "natural":
            # Natural pattern: varying delays with occasional short bursts
            delay = self._calculate_natural_delay(min_delay, max_delay)
        elif self.behavior_profiles.get(profile_name, {}).get("activity_pattern") == "burst":
            # Burst pattern: sometimes close together, sometimes far apart
            delay = self._calculate_burst_delay(min_delay, max_delay)
        else:
            # Random pattern
            delay = random.uniform(min_delay, max_delay)
        
        # Log the action
        self.action_log.append({
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "account": account_phone,
            "profile": profile_name,
            "delay_applied": delay,
        })
        
        # Apply the delay
        await asyncio.sleep(delay)
        
        return delay

    def _calculate_natural_delay(self, min_delay: float, max_delay: float) -> float:
        """Calculate natural-looking delay."""
        # 70% chance of normal delay, 30% chance of shorter delay (simulating engagement)
        if random.random() < 0.7:
            return random.uniform(min_delay, max_delay)
        else:
            # Shorter delay (user is engaged)
            return random.uniform(min_delay, min_delay * 2)

    def _calculate_burst_delay(self, min_delay: float, max_delay: float) -> float:
        """Calculate burst-pattern delay."""
        # 40% chance of burst (short delay), 60% chance of normal
        if random.random() < 0.4:
            # Burst: very short delay
            return random.uniform(min_delay, min_delay * 1.5)
        else:
            # Normal delay
            return random.uniform(max_delay * 0.5, max_delay)

    async def check_action_rate(
        self,
        account_phone: str,
        max_per_hour: int = 50,
    ) -> Dict:
        """Check if account has exceeded action rate limits.
        
        Returns:
            Dict with allowed status and remaining actions
        """
        # Count actions in last hour
        one_hour_ago = datetime.now(timezone.utc) - __import__('datetime').timedelta(hours=1)
        
        recent_actions = [
            log for log in self.action_log
            if log.get("account") == account_phone
            and datetime.fromisoformat(log["timestamp"]) > one_hour_ago
        ]
        
        actions_count = len(recent_actions)
        remaining = max(0, max_per_hour - actions_count)
        
        return {
            "allowed": remaining > 0,
            "actions_today": actions_count,
            "remaining": remaining,
            "max_per_hour": max_per_hour,
        }

    async def simulate_human_behavior(
        self,
        account_phone: str,
        actions: List[Callable],
        profile_name: str = "default",
    ) -> Dict:
        """Execute a list of actions with organic delays.
        
        Args:
            account_phone: Account to use
            actions: List of async functions to execute
            profile_name: Behavior profile to use
        """
        results = []
        
        for i, action in enumerate(actions):
            # Apply delay before action (except first)
            if i > 0:
                await self.apply_delay(profile_name, account_phone)
            
            # Check rate limit
            rate_check = await self.check_action_rate(account_phone)
            if not rate_check["allowed"]:
                logger.warning(f"Rate limit exceeded for {account_phone}, pausing...")
                # Wait for next hour
                await asyncio.sleep(3600 - (time.time() % 3600))
                continue
            
            # Execute action
            try:
                result = await action()
                results.append({
                    "action_index": i,
                    "success": True,
                    "result": result,
                })
            except Exception as e:
                results.append({
                    "action_index": i,
                    "success": False,
                    "error": str(e),
                })
        
        return {
            "status": "completed",
            "total_actions": len(actions),
            "successful": sum(1 for r in results if r["success"]),
            "failed": sum(1 for r in results if not r["success"]),
            "results": results,
        }

    def get_action_log(self, limit: int = 100) -> List[Dict]:
        """Get action log."""
        return self.action_log[-limit:]

    def get_behavior_profiles(self) -> Dict[str, Dict]:
        """Get all behavior profiles."""
        return self.behavior_profiles.copy()
