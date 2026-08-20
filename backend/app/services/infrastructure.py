"""Infrastructure layer for Telegram Engagement Platform."""

from __future__ import annotations

import os
from pathlib import Path
from typing import TYPE_CHECKING, Any, Dict, Optional

from loguru import logger

if TYPE_CHECKING:
    from telethon import TelegramClient


# ---------------------------------------------------------------------------
# AI Engine — full multi-provider support (8 free + 5 paid)
# ---------------------------------------------------------------------------

class AIEngine:
    """Multi-provider AI engine with fallback chain."""

    PROVIDERS = {
        "openai": {"models": ["gpt-4o-mini", "gpt-4o", "gpt-3.5-turbo"], "free": False},
        "anthropic": {"models": ["claude-3-haiku", "claude-3-sonnet", "claude-3-opus"], "free": False},
        "groq": {"models": ["llama-3.1-8b-instant", "llama-3.1-70b-versatile", "mixtral-8x7b-32768"], "free": True},
        "ollama": {"models": ["llama3", "mistral", "codellama", "phi3", "gemma2"], "free": True},
        "nvidia_nim": {"models": ["meta/llama-3.1-8b-instruct", "meta/llama-3.1-70b-instruct", "mistralai/mixtral-8x7b-instruct-v0.1"], "free": True},
        "cerebras": {"models": ["llama-3.1-8b", "llama-3.1-70b", "llama3.1-8b"], "free": True},
        "cloudflare_workers_ai": {"models": ["@cf/meta/llama-3.1-8b-instruct", "@cf/meta/llama-2-7b-chat-int8", "@cf/mistral/mistral-7b-instruct-v0.1"], "free": True},
        "openrouter": {"models": ["openrouter/auto"], "free": False},
        "siliconflow": {"models": ["Qwen/Qwen2.5-7B-Instruct"], "free": True},
        "cohere": {"models": ["command-r", "command-r-plus"], "free": False},
        "mistral_ai": {"models": ["mistral-small", "mistral-large"], "free": False},
        "google_gemini": {"models": ["gemini-pro", "gemini-1.5-flash"], "free": True},
        "huggingface": {"models": ["meta-llama/Llama-3-8B-Instruct"], "free": True},
        "github": {"models": [
            "gpt-4o-mini", "gpt-4o", "gpt-4", "gpt-4-turbo", "gpt-3.5-turbo",
            "Meta-Llama-3.1-405B-Instruct", "Meta-Llama-3.1-70B-Instruct", "Meta-Llama-3.1-8B-Instruct",
            "Mistral-large", "Mistral-small", "Cohere-command-r-plus", "Cohere-command-r",
            "Phi-3.5-mini-instruct", "Phi-3.5-MoE-instruct",
        ], "free": True},
    }

    FREE_PROVIDERS = [p for p, v in PROVIDERS.items() if v["free"]]

    def __init__(
        self,
        provider: str = "ollama",
        model: str = "llama3",
        api_keys: Optional[Dict[str, str]] = None,
        fallback_chain: Optional[list[str]] = None,
        config_service=None,
    ):
        self.provider = provider
        self.model = model
        self.api_keys = api_keys or {}
        self.fallback_chain = fallback_chain or self._build_fallback_chain()
        self._clients: dict[str, Any] = {}
        self._config_service = config_service

        if config_service:
            gpt = config_service.get("gpt")
            lic = config_service.get("license")
            # ponytail: basic license gate — GPT disabled when license invalid
            if gpt and gpt.get("enabled") and gpt.get("api_key") and lic and lic.get("valid"):
                self.provider = "openai"
                self.model = gpt.get("model") or self.model
                if "openai" not in self.api_keys or not self.api_keys["openai"]:
                    self.api_keys["openai"] = gpt["api_key"]
                logger.info(f"AIEngine overridden by global config: provider=openai, model={self.model}")

        logger.info(f"AIEngine initialized: provider={self.provider}, model={self.model}")
        logger.info(f"Free providers available: {self.FREE_PROVIDERS}")

    def _build_fallback_chain(self) -> list[str]:
        if self.provider == "none":
            return []  # ponytail: no AI providers
        chain = [self.provider] if self.provider in self.PROVIDERS else []
        for fp in self.FREE_PROVIDERS:
            if fp not in chain:
                chain.append(fp)
        for pp in self.PROVIDERS:
            if pp not in chain:
                chain.append(pp)
        return chain

    def _get_client(self, provider: str):
        if provider in self._clients:
            return self._clients[provider]
        key = self.api_keys.get(provider) or self.api_keys.get(
            {"openai": "openai_api_key", "anthropic": "anthropic_api_key",
             "groq": "groq_api_key", "cohere": "cohere_api_key",
             "mistral_ai": "mistral_api_key", "google_gemini": "gemini_api_key",
             "huggingface": "huggingface_api_key"}.get(provider, "")
        )
        try:
            if provider == "openai" and key:
                from openai import AsyncOpenAI
                self._clients[provider] = AsyncOpenAI(api_key=key)
            elif provider == "anthropic" and key:
                from anthropic import AsyncAnthropic
                self._clients[provider] = AsyncAnthropic(api_key=key)
            elif provider == "groq" and key:
                from groq import AsyncGroq
                self._clients[provider] = AsyncGroq(api_key=key)
            elif provider == "ollama":
                import httpx
                base = os.environ.get("OLLAMA_BASE_URL", "http://localhost:11434")
                self._clients[provider] = httpx.AsyncClient(base_url=base, timeout=60)
            elif provider == "cohere" and key:
                import httpx
                self._clients[provider] = httpx.AsyncClient(
                    base_url="https://api.cohere.ai/v1",
                    headers={"Authorization": f"Bearer {key}"}, timeout=60)
            elif provider == "mistral_ai" and key:
                import httpx
                self._clients[provider] = httpx.AsyncClient(
                    base_url="https://api.mistral.ai/v1",
                    headers={"Authorization": f"Bearer {key}"}, timeout=60)
            elif provider == "google_gemini" and key:
                import httpx
                self._clients[provider] = httpx.AsyncClient(
                    base_url=f"https://generativelanguage.googleapis.com/v1beta/models/{self.model}:generateContent?key={key}",
                    timeout=60)
            elif provider == "openrouter" and key:
                import httpx
                self._clients[provider] = httpx.AsyncClient(
                    base_url="https://openrouter.ai/api/v1",
                    headers={"Authorization": f"Bearer {key}", "HTTP-Referer": "https://telegramgeeks.com"},
                    timeout=60)
            elif provider == "siliconflow" and key:
                import httpx
                self._clients[provider] = httpx.AsyncClient(
                    base_url="https://api.siliconflow.cn/v1",
                    headers={"Authorization": f"Bearer {key}"}, timeout=60)
            elif provider == "huggingface" and key:
                import httpx
                self._clients[provider] = httpx.AsyncClient(
                    headers={"Authorization": f"Bearer {key}"}, timeout=60)
            elif provider == "cerebras" and key:
                import httpx
                self._clients[provider] = httpx.AsyncClient(
                    base_url="https://api.cerebras.ai/v1",
                    headers={"Authorization": f"Bearer {key}"}, timeout=60)
            elif provider == "nvidia_nim" and key:
                import httpx
                self._clients[provider] = httpx.AsyncClient(
                    base_url="https://ai.api.nvidia.com/v1",
                    headers={"Authorization": f"Bearer {key}"}, timeout=60)
            elif provider == "cloudflare_workers_ai" and key:
                import httpx
                self._clients[provider] = httpx.AsyncClient(
                    base_url="https://api.cloudflare.com/client/v4/accounts",
                    headers={"Authorization": f"Bearer {key}"}, timeout=60)
            elif provider == "github" and key:
                from openai import AsyncOpenAI
                self._clients[provider] = AsyncOpenAI(
                    api_key=key,
                    base_url="https://models.inference.ai.azure.com",
                )
        except ImportError as e:
            logger.warning(f"Provider {provider} not available: {e}")
            return None
        return self._clients.get(provider)

    async def generate(self, prompt: str, system: str = "", max_tokens: int = 500) -> str:
        for provider in self.fallback_chain:
            client = self._get_client(provider)
            if not client:
                continue
            try:
                if provider == "ollama":
                    resp = await client.post("/api/generate", json={
                        "model": self.model, "prompt": prompt, "stream": False,
                        "options": {"num_predict": max_tokens}})
                    return resp.json().get("response", "")
                elif provider == "openai" and hasattr(client, "chat"):
                    messages = []
                    if system: messages.append({"role": "system", "content": system})
                    messages.append({"role": "user", "content": prompt})
                    resp = await client.chat.completions.create(
                        model=self.model, messages=messages, max_tokens=max_tokens)
                    return resp.choices[0].message.content or ""
                elif provider == "github" and hasattr(client, "chat"):
                    messages = []
                    if system: messages.append({"role": "system", "content": system})
                    messages.append({"role": "user", "content": prompt})
                    resp = await client.chat.completions.create(
                        model=self.model, messages=messages, max_tokens=max_tokens)
                    return resp.choices[0].message.content or ""
                elif provider == "anthropic" and hasattr(client, "messages"):
                    messages = [{"role": "user", "content": prompt}]
                    if system: messages.insert(0, {"role": "system", "content": system})
                    resp = await client.messages.create(
                        model=self.model, max_tokens=max_tokens, messages=messages)
                    return resp.content[0].text if resp.content else ""
                elif provider == "groq" and hasattr(client, "chat"):
                    messages = [{"role": "user", "content": prompt}]
                    if system: messages.insert(0, {"role": "system", "content": system})
                    resp = await client.chat.completions.create(
                        model=self.model, messages=messages, max_tokens=max_tokens)
                    return resp.choices[0].message.content or ""
                elif provider == "cohere":
                    resp = await client.post("/v1/chat", json={
                        "model": self.model, "message": prompt,
                        "max_tokens": max_tokens, "system": system})
                    return resp.json().get("text", "")
                elif provider == "mistral_ai":
                    messages = []
                    if system: messages.append({"role": "system", "content": system})
                    messages.append({"role": "user", "content": prompt})
                    resp = await client.post("/v1/chat/completions", json={
                        "model": self.model, "messages": messages, "max_tokens": max_tokens})
                    data = resp.json()
                    return data["choices"][0]["message"]["content"] if data.get("choices") else ""
                elif provider == "google_gemini":
                    resp = await client.post(
                        f"/{self.model}:generateContent",
                        json={"contents": [{"parts": [{"text": prompt}]}],
                              "generationConfig": {"maxOutputTokens": max_tokens}})
                    data = resp.json()
                    return data["candidates"][0]["content"]["parts"][0]["text"] if data.get("candidates") else ""
                elif provider == "openrouter":
                    messages = []
                    if system: messages.append({"role": "system", "content": system})
                    messages.append({"role": "user", "content": prompt})
                    resp = await client.post("/v1/chat/completions", json={
                        "model": self.model, "messages": messages, "max_tokens": max_tokens})
                    data = resp.json()
                    return data["choices"][0]["message"]["content"] if data.get("choices") else ""
                elif provider == "siliconflow":
                    messages = []
                    if system: messages.append({"role": "system", "content": system})
                    messages.append({"role": "user", "content": prompt})
                    resp = await client.post("/v1/chat/completions", json={
                        "model": self.model, "messages": messages, "max_tokens": max_tokens})
                    data = resp.json()
                    return data["choices"][0]["message"]["content"] if data.get("choices") else ""
                elif provider == "huggingface":
                    resp = await client.post(
                        f"/models/{self.model}",
                        json={"inputs": prompt, "parameters": {"max_new_tokens": max_tokens}})
                    return resp.json()[0].get("generated_text", "")
                elif provider in ("cerebras", "nvidia_nim"):
                    messages = []
                    if system: messages.append({"role": "system", "content": system})
                    messages.append({"role": "user", "content": prompt})
                    resp = await client.post("/chat/completions", json={
                        "model": self.model, "messages": messages, "max_tokens": max_tokens})
                    data = resp.json()
                    return data["choices"][0]["message"]["content"] if data.get("choices") else ""
                elif provider == "cloudflare_workers_ai":
                    account_id = key = client.headers.get("Authorization", "").replace("Bearer ", "")
                    resp = await client.post(f"/{account_id}/ai/run/{self.model}", json={
                        "messages": [{"role": "user", "content": prompt}],
                        "max_tokens": max_tokens})
                    data = resp.json()
                    return data.get("result", {}).get("response", "") if data.get("success") else ""
            except Exception as e:
                logger.warning(f"Provider {provider} failed: {e}")
                continue
        logger.error("All AI providers failed")
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
        ollama_base_url: str = "http://localhost:11434",
        sms_api_keys: Optional[Dict[str, str]] = None,
        proxy_pool: Optional[list[dict]] = None,
        ai_fallback_chain: Optional[list[str]] = None,
        config_service=None,
    ):
        if ollama_base_url:
            os.environ["OLLAMA_BASE_URL"] = ollama_base_url

        from telegram_layer.src.client.manager import TelegramClientManager
        from telegram_layer.src.config import TelegramConfig

        tg_config = TelegramConfig(
            api_id=telegram_api_id, api_hash=telegram_api_hash,
            session_storage_path=session_storage_path,
        )
        self.client_manager = TelegramClientManager(config=tg_config)
        logger.info("TelegramClientManager initialized")

        self.config_service = config_service

        effective_provider = ai_provider
        effective_key = openai_api_key or anthropic_api_key or groq_api_key
        if effective_provider == "none":
            pass  # ponytail: no AI, desktop-only mode
        elif not effective_key and effective_provider != "ollama":
            effective_provider = "ollama"
            logger.info(f"No API key for {effective_provider}; falling back to ollama")

        self.ai_engine = AIEngine(
            provider=effective_provider, model=ai_model,
            api_keys={"openai": openai_api_key, "anthropic": anthropic_api_key, "groq": groq_api_key},
            fallback_chain=ai_fallback_chain,
            config_service=config_service,
        )
        logger.info(f"AIEngine initialized: provider={effective_provider}, model={ai_model}")

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
