"""Infrastructure layer for Telegram Engagement Platform."""

from __future__ import annotations

import os
from pathlib import Path
from typing import TYPE_CHECKING, Any, Dict, Optional

from loguru import logger

if TYPE_CHECKING:
    from telethon import TelegramClient


# ---------------------------------------------------------------------------
# AI Engine — full multi-provider support with Round-Robin Load Balancing
# ---------------------------------------------------------------------------

class AIEngine:
    """Multi-provider AI engine with Round-Robin load balancing and fallback chain."""

    PROVIDERS = {
        # 12 Generous Free / Open Cloud Providers
        "groq": {"models": ["llama-3.3-70b-versatile", "llama-3.1-8b-instant", "deepseek-r1-distill-llama-70b", "mixtral-8x7b-32768"], "free": True, "badge": "🚀 Ultra Fast (Free)"},
        "sambanova": {"models": ["Meta-Llama-3.3-70B-Instruct", "DeepSeek-R1-Distill-Llama-70B", "Meta-Llama-3.1-8B-Instruct"], "free": True, "badge": "⚡ SambaNova (Free)"},
        "together": {"models": ["meta-llama/Llama-3.3-70B-Instruct-Turbo", "deepseek-ai/DeepSeek-R1", "Qwen/Qwen2.5-72B-Instruct-Turbo"], "free": True, "badge": "✨ Together AI (Free)"},
        "deepseek": {"models": ["deepseek-chat", "deepseek-reasoner"], "free": True, "badge": "🧠 DeepSeek V3/R1 (Free)"},
        "google_gemini": {"models": ["gemini-2.0-flash", "gemini-1.5-flash", "gemini-1.5-pro"], "free": True, "badge": "🆓 Google Gemini (Free)"},
        "github": {"models": ["gpt-4o-mini", "gpt-4o", "Meta-Llama-3.1-70B-Instruct", "Phi-3.5-mini-instruct", "Mistral-large"], "free": True, "badge": "🐙 GitHub Models (Free)"},
        "cerebras": {"models": ["llama3.3-70b", "llama3.1-8b"], "free": True, "badge": "⚡ Cerebras 2000 t/s (Free)"},
        "siliconflow": {"models": ["Qwen/Qwen2.5-7B-Instruct", "deepseek-ai/DeepSeek-V3", "deepseek-ai/DeepSeek-R1"], "free": True, "badge": "🇨🇳 SiliconFlow (Free)"},
        "nvidia_nim": {"models": ["meta/llama-3.1-8b-instruct", "meta/llama-3.1-70b-instruct", "nvidia/llama-3.1-nemotron-70b-instruct"], "free": True, "badge": "🟢 NVIDIA NIM (Free)"},
        "cloudflare_workers_ai": {"models": ["@cf/meta/llama-3.1-8b-instruct", "@cf/mistral/mistral-7b-instruct-v0.1"], "free": True, "badge": "🌐 Cloudflare Edge (Free)"},
        "huggingface": {"models": ["meta-llama/Llama-3.1-8B-Instruct", "mistralai/Mistral-7B-Instruct-v0.3"], "free": True, "badge": "🤗 Hugging Face (Free)"},
        "ollama": {"models": ["llama3.2", "llama3.1", "mistral", "qwen2.5", "phi3"], "free": True, "badge": "🔒 Ollama Local (Free)"},
        
        # 5 Commercial / Paid Providers
        "openai": {"models": ["gpt-4o-mini", "gpt-4o", "gpt-3.5-turbo"], "free": False, "badge": "⚡ OpenAI GPT-4o"},
        "anthropic": {"models": ["claude-3-5-haiku-20241022", "claude-3-5-sonnet-20241022", "claude-3-opus-20240229"], "free": False, "badge": "🧠 Anthropic Claude 3.5"},
        "openrouter": {"models": ["openrouter/auto", "meta-llama/llama-3.3-70b-instruct:free", "deepseek/deepseek-r1:free"], "free": False, "badge": "🔀 OpenRouter Aggregator"},
        "mistral_ai": {"models": ["mistral-small-latest", "open-mistral-nemo"], "free": False, "badge": "🇫🇷 Mistral AI"},
        "cohere": {"models": ["command-r", "command-r-plus"], "free": False, "badge": "🎯 Cohere Command"},
    }

    FREE_PROVIDERS = [p for p, v in PROVIDERS.items() if v["free"]]

    def __init__(
        self,
        provider: str = "groq",
        model: str = "llama-3.3-70b-versatile",
        api_keys: Optional[Dict[str, str]] = None,
        fallback_chain: Optional[list[str]] = None,
        config_service=None,
        routing_strategy: str = "round_robin",
    ):
        self.provider = provider
        self.model = model
        self.api_keys = api_keys or {}
        self.routing_strategy = routing_strategy  # "round_robin" | "fallback_chain" | "free_only_round_robin"
        self.fallback_chain = fallback_chain or self._build_fallback_chain()
        self._clients: dict[str, Any] = {}
        self._config_service = config_service
        self._rr_index: int = 0
        self._backoffs: dict[str, float] = {}  # provider -> timestamp when backoff expires

        if config_service:
            gpt = config_service.get("gpt")
            lic = config_service.get("license")
            if gpt and gpt.get("enabled") and gpt.get("api_key") and lic and lic.get("valid"):
                self.provider = "openai"
                self.model = gpt.get("model") or self.model
                if "openai" not in self.api_keys or not self.api_keys["openai"]:
                    self.api_keys["openai"] = gpt["api_key"]
                logger.info(f"AIEngine overridden by global config: provider=openai, model={self.model}")

        logger.info(f"AIEngine initialized: provider={self.provider}, model={self.model}, routing={self.routing_strategy}")
        logger.info(f"Free providers available ({len(self.FREE_PROVIDERS)}): {self.FREE_PROVIDERS}")

    def _build_fallback_chain(self) -> list[str]:
        if self.provider == "none":
            return []
        chain = [self.provider] if self.provider in self.PROVIDERS else []
        for fp in self.FREE_PROVIDERS:
            if fp not in chain:
                chain.append(fp)
        for pp in self.PROVIDERS:
            if pp not in chain:
                chain.append(pp)
        return chain

    def _is_provider_configured(self, provider: str) -> bool:
        if provider == "ollama":
            return True
        key = self.api_keys.get(provider) or self.api_keys.get(f"{provider}_api_key")
        return bool(key)

    def _get_client(self, provider: str):
        if provider in self._clients:
            return self._clients[provider]
        key = (
            self.api_keys.get(provider)
            or self.api_keys.get(f"{provider}_api_key")
            or self.api_keys.get(f"{provider}_api_token")
            or self.api_keys.get(
                {"openai": "openai_api_key", "anthropic": "anthropic_api_key",
                 "groq": "groq_api_key", "cohere": "cohere_api_key",
                 "mistral_ai": "mistral_api_key", "google_gemini": "gemini_api_key",
                 "deepseek": "deepseek_api_key", "together": "together_api_key",
                 "sambanova": "sambanova_api_key", "github": "github_token",
                 "cerebras": "cerebras_api_key", "siliconflow": "siliconflow_api_key",
                 "nvidia_nim": "nvidia_nim_api_key", "openrouter": "openrouter_api_key",
                 "cloudflare_workers_ai": "cloudflare_api_token",
                 "huggingface": "huggingface_api_key"}.get(provider, "")
            )
        )
        try:
            if provider == "openai" and key:
                from openai import AsyncOpenAI
                self._clients[provider] = AsyncOpenAI(api_key=key)
            elif provider == "anthropic" and key:
                from anthropic import AsyncAnthropic
                self._clients[provider] = AsyncAnthropic(api_key=key)
            elif provider == "groq" and key:
                from openai import AsyncOpenAI
                self._clients[provider] = AsyncOpenAI(
                    api_key=key,
                    base_url="https://api.groq.com/openai/v1",
                )
            elif provider == "deepseek" and key:
                from openai import AsyncOpenAI
                self._clients[provider] = AsyncOpenAI(
                    api_key=key,
                    base_url="https://api.deepseek.com/v1",
                )
            elif provider == "together" and key:
                from openai import AsyncOpenAI
                self._clients[provider] = AsyncOpenAI(
                    api_key=key,
                    base_url="https://api.together.xyz/v1",
                )
            elif provider == "sambanova" and key:
                from openai import AsyncOpenAI
                self._clients[provider] = AsyncOpenAI(
                    api_key=key,
                    base_url="https://api.sambanova.ai/v1",
                )
            elif provider == "cerebras" and key:
                from openai import AsyncOpenAI
                self._clients[provider] = AsyncOpenAI(
                    api_key=key,
                    base_url="https://api.cerebras.ai/v1",
                )
            elif provider == "github" and key:
                from openai import AsyncOpenAI
                self._clients[provider] = AsyncOpenAI(
                    api_key=key,
                    base_url="https://models.inference.ai.azure.com",
                )
            elif provider == "siliconflow" and key:
                from openai import AsyncOpenAI
                self._clients[provider] = AsyncOpenAI(
                    api_key=key,
                    base_url="https://api.siliconflow.cn/v1",
                )
            elif provider == "nvidia_nim" and key:
                from openai import AsyncOpenAI
                self._clients[provider] = AsyncOpenAI(
                    api_key=key,
                    base_url="https://integrate.api.nvidia.com/v1",
                )
            elif provider == "openrouter" and key:
                from openai import AsyncOpenAI
                self._clients[provider] = AsyncOpenAI(
                    api_key=key,
                    base_url="https://openrouter.ai/api/v1",
                    default_headers={"HTTP-Referer": "https://telegramgeekspro.com"},
                )
            elif provider == "mistral_ai" and key:
                from openai import AsyncOpenAI
                self._clients[provider] = AsyncOpenAI(
                    api_key=key,
                    base_url="https://api.mistral.ai/v1",
                )
            elif provider == "cohere" and key:
                from openai import AsyncOpenAI
                self._clients[provider] = AsyncOpenAI(
                    api_key=key,
                    base_url="https://api.cohere.com/v2",
                )
            elif provider == "google_gemini" and key:
                from openai import AsyncOpenAI
                self._clients[provider] = AsyncOpenAI(
                    api_key=key,
                    base_url="https://generativelanguage.googleapis.com/v1beta/openai/",
                )
            elif provider == "ollama":
                import httpx
                base = os.environ.get("OLLAMA_BASE_URL", "http://localhost:11434")
                self._clients[provider] = httpx.AsyncClient(base_url=base, timeout=30)
            elif provider == "cloudflare_workers_ai" and key:
                import httpx
                account_id = os.environ.get("CLOUDFLARE_ACCOUNT_ID", "")
                self._clients[provider] = httpx.AsyncClient(
                    base_url=f"https://api.cloudflare.com/client/v4/accounts/{account_id}/ai/run" if account_id else "https://api.cloudflare.com/client/v4/accounts",
                    headers={"Authorization": f"Bearer {key}"}, timeout=30)
            elif provider == "huggingface" and key:
                import httpx
                self._clients[provider] = httpx.AsyncClient(
                    base_url="https://api-inference.huggingface.co/models",
                    headers={"Authorization": f"Bearer {key}"}, timeout=30)
        except Exception as e:
            logger.warning(f"Provider {provider} client init error: {e}")
            return None
        return self._clients.get(provider)

    def _get_execution_chain(self) -> list[str]:
        """Calculate ordered provider chain based on Round-Robin or Priority Fallback strategy."""
        import time
        now = time.time()
        
        # 1. Gather all active / configured providers
        configured = [p for p in self.PROVIDERS if self._is_provider_configured(p)]
        if not configured:
            configured = self.fallback_chain or list(self.PROVIDERS.keys())

        # 2. Filter for free-only strategy if requested
        if self.routing_strategy == "free_only_round_robin":
            free_candidates = [p for p in configured if self.PROVIDERS.get(p, {}).get("free")]
            if free_candidates:
                configured = free_candidates

        # 3. Separate providers currently in cooldown backoff (e.g. rate-limited 429)
        active_candidates = [p for p in configured if self._backoffs.get(p, 0) < now]
        if not active_candidates:
            # If all are in backoff, use all configured
            active_candidates = configured

        # 4. Perform circular Round-Robin rotation
        if self.routing_strategy in ("round_robin", "free_only_round_robin") and len(active_candidates) > 1:
            idx = self._rr_index % len(active_candidates)
            self._rr_index += 1
            rotated = active_candidates[idx:] + active_candidates[:idx]
            # Append remaining configured providers at the end for ultimate fallback resilience
            for p in configured:
                if p not in rotated:
                    rotated.append(p)
            return rotated

        return self.fallback_chain

    def _get_provider_model(self, provider: str) -> str:
        """Resolve the optimal model name for a provider."""
        provider_models = self.PROVIDERS.get(provider, {}).get("models", [])
        if self.model in provider_models:
            return self.model
        return provider_models[0] if provider_models else self.model

    async def generate(self, prompt: str, system: str = "", max_tokens: int = 500) -> str:
        import time
        chain = self._get_execution_chain()
        logger.info(f"AIEngine execution chain ({self.routing_strategy}): {chain}")

        for provider in chain:
            client = self._get_client(provider)
            if not client:
                continue

            target_model = self._get_provider_model(provider)
            logger.info(f"AIEngine attempting dispatch to [{provider}] with model [{target_model}]")

            try:
                # 1. Standard OpenAI-compatible API clients
                if hasattr(client, "chat") and hasattr(client.chat, "completions"):
                    messages = []
                    if system:
                        messages.append({"role": "system", "content": system})
                    messages.append({"role": "user", "content": prompt})
                    
                    resp = await client.chat.completions.create(
                        model=target_model,
                        messages=messages,
                        max_tokens=max_tokens,
                        temperature=0.7,
                    )
                    content = resp.choices[0].message.content or ""
                    if content:
                        logger.info(f"AI response generated via [{provider}:{target_model}] ({len(content)} chars)")
                        return content

                # 2. Anthropic Native Messages API
                elif provider == "anthropic" and hasattr(client, "messages"):
                    messages = [{"role": "user", "content": prompt}]
                    resp = await client.messages.create(
                        model=target_model,
                        max_tokens=max_tokens,
                        messages=messages,
                        system=system or None,
                    )
                    content = resp.content[0].text if resp.content else ""
                    if content:
                        logger.info(f"AI response generated via [{provider}:{target_model}]")
                        return content

                # 3. Ollama Local Endpoint
                elif provider == "ollama":
                    resp = await client.post("/api/generate", json={
                        "model": target_model,
                        "prompt": f"{system}\n\n{prompt}" if system else prompt,
                        "stream": False,
                        "options": {"num_predict": max_tokens}
                    })
                    if resp.status_code == 200:
                        content = resp.json().get("response", "")
                        if content:
                            return content

                # 4. Hugging Face Serverless Inference
                elif provider == "huggingface":
                    resp = await client.post(
                        f"/{target_model}",
                        json={"inputs": f"{system}\n\n{prompt}" if system else prompt, "parameters": {"max_new_tokens": max_tokens}}
                    )
                    if resp.status_code == 200:
                        data = resp.json()
                        if isinstance(data, list) and len(data) > 0:
                            return data[0].get("generated_text", "")

                # 5. Cloudflare Workers AI
                elif provider == "cloudflare_workers_ai":
                    resp = await client.post(f"/{target_model}", json={
                        "messages": [{"role": "user", "content": prompt}],
                        "max_tokens": max_tokens
                    })
                    if resp.status_code == 200:
                        return resp.json().get("result", {}).get("response", "")

            except Exception as e:
                err_str = str(e)
                logger.warning(f"Provider [{provider}] dispatch failed: {err_str}")
                # If rate limited (429), place in temporary 45s cooldown
                if "429" in err_str or "rate limit" in err_str.lower():
                    self._backoffs[provider] = time.time() + 45.0
                    logger.warning(f"Provider [{provider}] placed in 45s rate-limit backoff")
                continue

        logger.error("All AI providers in Round-Robin chain failed")
        return ""
        return ""

    async def rewrite_in_style(self, text: str, style: str = "casual") -> str:
        prompt = f"Rewrite the following text in a {style} tone. Return only the rewritten text:\n\n{text}"
        return await self.generate(prompt)

    async def generate_reply(self, context: str, style: str = "casual") -> str:
        prompt = f"Given the following message context, generate a natural {style} reply. Return only the reply:\n\n{context}"
        return await self.generate(prompt)

    async def analyze_sentiment(self, text: str) -> dict:
        prompt = f"Analyze the sentiment of: {text}. Return JSON with: sentiment (positive/negative/neutral), confidence (0-1), emotions (list)."
        result = await self.generate(prompt)
        import json
        try:
            return json.loads(result)
        except:
            return {"sentiment": "neutral", "confidence": 0.5, "emotions": []}

    def get_available_providers(self) -> list[dict]:
        return [
            {"id": pid, "name": pid.replace("_", " ").title(), "free": info["free"],
             "models": info["models"], "configured": bool(self._get_client(pid))}
            for pid, info in self.PROVIDERS.items()
        ]


class ProxyPoolManager:
    def __init__(self, max_pool_size: int = 20):
        self.pool: list[dict] = []
        self.max_pool_size = max_pool_size

    async def add_proxy(self, proxy: dict) -> bool:
        if len(self.pool) >= self.max_pool_size:
            return False
        if any(p.get("host") == proxy.get("host") and p.get("port") == proxy.get("port") for p in self.pool):
            return False
        self.pool.append({**proxy, "healthy": None, "last_checked": None})
        return True

    def get_working_proxy(self) -> Optional[dict]:
        working = [p for p in self.pool if p.get("healthy") is True]
        if not working:
            return self.pool[0] if self.pool else None
        import random
        return random.choice(working)

    def get_pool_stats(self) -> dict:
        healthy = sum(1 for p in self.pool if p.get("healthy") is True)
        return {"total": len(self.pool), "healthy": healthy, "unhealthy": len(self.pool) - healthy}


class SessionManager:
    def __init__(self, storage_path: str = "./sessions"):
        self.storage_path = Path(storage_path)
        self.storage_path.mkdir(parents=True, exist_ok=True)

    def save_session(self, phone: str, session_string: str) -> str:
        safe_name = phone.replace("+", "").replace(" ", "_")
        filepath = self.storage_path / f"{safe_name}.session"
        filepath.write_text(session_string)
        return str(filepath)

    def load_session(self, phone: str) -> Optional[str]:
        safe_name = phone.replace("+", "").replace(" ", "_")
        filepath = self.storage_path / f"{safe_name}.session"
        if filepath.exists():
            return filepath.read_text()
        return None

    def list_sessions(self) -> list[dict]:
        sessions = []
        for f in self.storage_path.glob("*.session"):
            sessions.append({"phone": f.stem.replace("_", "+"), "path": str(f), "size": f.stat().st_size})
        return sessions


class Infrastructure:
    """Central hub for all shared services."""

    def __init__(
        self,
        telegram_api_id: int = 12345678,
        telegram_api_hash: str = "your_api_hash",
        session_storage_path: str = "./sessions",
        ai_provider: str = "openai",
        ai_model: str = "gpt-4o-mini",
        openai_api_key: Optional[str] = None,
        anthropic_api_key: Optional[str] = None,
        groq_api_key: Optional[str] = None,
        gemini_api_key: Optional[str] = None,
        deepseek_api_key: Optional[str] = None,
        together_api_key: Optional[str] = None,
        sambanova_api_key: Optional[str] = None,
        github_token: Optional[str] = None,
        cerebras_api_key: Optional[str] = None,
        siliconflow_api_key: Optional[str] = None,
        nvidia_nim_api_key: Optional[str] = None,
        openrouter_api_key: Optional[str] = None,
        cloudflare_api_token: Optional[str] = None,
        cloudflare_account_id: Optional[str] = None,
        mistral_api_key: Optional[str] = None,
        cohere_api_key: Optional[str] = None,
        huggingface_api_key: Optional[str] = None,
        ollama_base_url: str = "http://localhost:11434",
        sms_api_keys: Optional[Dict[str, str]] = None,
        proxy_pool: Optional[list[dict]] = None,
        ai_fallback_chain: Optional[list[str]] = None,
        ai_keys: Optional[Dict[str, str]] = None,
        ai_routing_strategy: str = "round_robin",
        config_service=None,
    ):
        if ollama_base_url:
            os.environ["OLLAMA_BASE_URL"] = ollama_base_url
        if cloudflare_account_id:
            os.environ["CLOUDFLARE_ACCOUNT_ID"] = cloudflare_account_id

        from telegram_layer.src.client.manager import TelegramClientManager
        from telegram_layer.src.config import TelegramConfig

        tg_config = TelegramConfig(
            api_id=telegram_api_id, api_hash=telegram_api_hash,
            session_storage_path=session_storage_path,
        )
        self.client_manager = TelegramClientManager(config=tg_config)
        logger.info("TelegramClientManager initialized")

        self.config_service = config_service

        effective_keys = {
            "openai": openai_api_key,
            "anthropic": anthropic_api_key,
            "groq": groq_api_key,
            "google_gemini": gemini_api_key,
            "deepseek": deepseek_api_key,
            "together": together_api_key,
            "sambanova": sambanova_api_key,
            "github": github_token,
            "cerebras": cerebras_api_key,
            "siliconflow": siliconflow_api_key,
            "nvidia_nim": nvidia_nim_api_key,
            "openrouter": openrouter_api_key,
            "cloudflare_workers_ai": cloudflare_api_token,
            "mistral_ai": mistral_api_key,
            "cohere": cohere_api_key,
            "huggingface": huggingface_api_key,
        }
        if ai_keys:
            effective_keys.update(ai_keys)

        self.ai_engine = AIEngine(
            provider=ai_provider or "groq",
            model=ai_model or "llama-3.3-70b-versatile",
            api_keys={k: v for k, v in effective_keys.items() if v},
            fallback_chain=ai_fallback_chain,
            config_service=config_service,
            routing_strategy=ai_routing_strategy or "round_robin",
        )
        logger.info(f"AIEngine initialized: provider={ai_provider}, model={ai_model}, routing={ai_routing_strategy}")

        self.sms_api_keys = sms_api_keys or {}
        from app.services.sms_provider_hub import SmsProviderHub
        self.sms_provider_hub = SmsProviderHub(api_keys=self.sms_api_keys)
        logger.info(f"SMS Provider Hub initialized with {len(self.sms_provider_hub.get_configured_providers())} configured providers")
        self.proxy_manager = ProxyPoolManager()
        if proxy_pool:
            for proxy in proxy_pool:
                self.proxy_manager.pool.append({**proxy, "healthy": None})
        logger.info(f"Proxy pool initialized with {len(self.proxy_manager.pool)} proxies")

        self.session_manager = SessionManager(session_storage_path)
        logger.info(f"SessionManager initialized at {session_storage_path}")

        logger.info("Infrastructure initialization complete")

    def _resolve_service(self, module_id: str):
        try:
            module = __import__(
                f"telegram_layer.src.actions.{module_id}",
                fromlist=["Service"],
            )
        except ImportError as e:
            logger.warning(f"Cannot import module {module_id}: {e}")
            return None

        class_name_map = {
            "converter": "ConverterService",
            "two_way_converter": "TwoWayConverter",
            "booster": "BoosterService",
            "registrar": "RegistrarService",
            "account_management": "AccountManagementService",
            "mass_messaging": "MassMessagingService",
            "autoreponder": "AutoresponderService",
            "autoposting": "AutopostingService",
            "stories": "StoriesService",
            "reactions": "ReactionsService",
            "message_editor": "MessageEditorService",
            "invite_modules": "InviteService",
            "audience_collector": "AudienceCollectorService",
            "contact_book": "ContactBookService",
            "mass_unsubscriber": "MassUnsubscriberService",
            "gender_detector": "GenderDetectorService",
            "cloner": "ClonerService",
            "interceptor": "InterceptorService",
            "forwarder": "ForwarderService",
            "bot_creator": "BotCreatorService",
            "referrals": "ReferralService",
            "reporter": "ReporterService",
            "admin": "AdminService",
            "link_checker": "LinkCheckerService",
            "database_tools": "DatabaseToolsService",
            "calculator_reports": "CalculatorReportsService",
            "spambot_remover": "SpamBotRemoverService",
            "number_checker": "NumberCheckerService",
            "json_generator": "JsonGeneratorService",
            "duplicator": "DuplicatorService",
            "account_folders": "AccountFolderService",
            "neuro_text": "NeuroTextEngine",
            "persona_manager": "PersonaOrchestrator",
            "proxy_checker": "ProxyCheckerService",
            "views_boost": "ViewsBoostService",
            "mass_subscriptions": "MassSubscriptionsService",
            "channel_comments": "ChannelCommentsService",
            "postbot": "PostbotService",
            "anti_detection": "AntiDetectionService",
            "mass_inspection": "MassInspectionService",
            "parameter_generator": "ParameterGeneratorService",
            "global_search": "GlobalSearchService",
            "admin_chat_search": "AdminChatSearchService",
            "create_chats": "CreateChatsService",
            "open_dialogs": "OpenDialogsService",
            "persona_emotions": "EmotionManager",
            "persona_generator": "PersonaGenerator",
            "group_prompt_generator": "GroupPromptGenerator",
            "persona_ab_test": "ABTestManager",
            "forwarder_wizard": "ForwarderWizard",
            "campaign_export": "CampaignExporter",
            "mass_subscribe_resume": "SubscribeResumeManager",
            "booster_username_check": "UsernameChecker",
            "affiliate_enhanced": "AffiliateManager",
            "marketplace": "MarketplaceManager",
            "sms_dashboard": "SMSDashboardProvider",
        }

        class_name = class_name_map.get(module_id)
        if not class_name:
            class_name = f"{module_id.replace('_', '').title().replace('_', '')}Service"

        service_class = getattr(module, class_name, None)
        if not service_class:
            for attr_name in dir(module):
                if attr_name.endswith("Service") and not attr_name.startswith("_"):
                    service_class = getattr(module, attr_name)
                    break

        if not service_class:
            logger.warning(f"No service class found for module {module_id}")
            return None

        try:
            instance = self._instantiate_service(module_id, service_class)
            if instance:
                logger.info(f"Resolved service {class_name} for module {module_id}")
            return instance
        except Exception as e:
            logger.warning(f"Failed to instantiate {class_name} for {module_id}: {e}")
            return None

    def _instantiate_service(self, module_id: str, service_class) -> Optional[Any]:
        import inspect
        sig = inspect.signature(service_class.__init__)
        params = list(sig.parameters.keys())
        if params and params[0] == 'self':
            params = params[1:]
        if not params:
            return service_class()

        kwargs = {}
        if "client_manager" in params:
            kwargs["client_manager"] = self.client_manager
        if "ai_engine" in params:
            kwargs["ai_engine"] = self.ai_engine
        if "api_keys" in params:
            kwargs["api_keys"] = self.sms_api_keys
        if "sms_provider_hub" in params:
            kwargs["sms_provider_hub"] = self.sms_provider_hub
        if "captcha_solver" in params:
            kwargs["captcha_solver"] = "2captcha"
        if "storage_path" in params:
            kwargs["storage_path"] = self.session_manager.storage_path
        if "base_path" in params:
            kwargs["base_path"] = "./data"
        if "config_service" in params and self.config_service:
            kwargs["config_service"] = self.config_service

        try:
            return service_class(**kwargs)
        except Exception as e:
            logger.warning(f"Instantiation failed for {service_class.__name__}: {e}")
            return None

    def is_ready(self) -> bool:
        return self.client_manager is not None and self.ai_engine is not None

    def status(self) -> dict:
        return {
            "client_manager": "connected" if self.client_manager else "disconnected",
            "ai_engine": {
                "provider": self.ai_engine.provider,
                "model": self.ai_engine.model,
                "fallback_chain": self.ai_engine.fallback_chain,
                "available_providers": len(self.ai_engine.PROVIDERS),
                "free_providers": len(self.ai_engine.FREE_PROVIDERS),
                "configured": bool(self.ai_engine.api_keys),
            },
            "proxy_pool": self.proxy_manager.get_pool_stats(),
            "sessions": len(self.session_manager.list_sessions()),
            "sms_providers": list(self.sms_api_keys.keys()),
            "ready": self.is_ready(),
        }
