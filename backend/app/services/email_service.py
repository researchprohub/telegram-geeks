"""Unified Email Service — Multi-Provider (SMTP, Resend, Mailtrap) with Modern Animated HTML Templates."""

import asyncio
import smtplib
import ssl
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Optional, Dict, Any, List
import httpx
from loguru import logger
from sqlalchemy.ext.asyncio import AsyncSession
from app.services.settings_service import SettingsService


class EmailService:
    """Enterprise multi-provider transactional email service."""

    async def get_config(self, db: Optional[AsyncSession] = None) -> Dict[str, str]:
        """Fetch current email settings from database."""
        if db:
            svc = SettingsService(db)
            all_s = await svc.get_all()
            return {
                "provider": all_s.get("email_provider", "disabled"),
                "from_name": all_s.get("email_from_name", "TelegramGeeks Pro"),
                "from_address": all_s.get("email_from_address", "notifications@telegramgeekspro.com"),
                "smtp_host": all_s.get("smtp_host", "smtp.mailtrap.io"),
                "smtp_port": str(all_s.get("smtp_port", "587")),
                "smtp_user": all_s.get("smtp_user", ""),
                "smtp_password": all_s.get("smtp_password", ""),
                "smtp_tls": str(all_s.get("smtp_tls", "true")).lower(),
                "smtp_ssl": str(all_s.get("smtp_ssl", "false")).lower(),
                "resend_api_key": all_s.get("resend_api_key", ""),
                "resend_from_email": all_s.get("resend_from_email", "notifications@telegramgeekspro.com"),
                "mailtrap_api_token": all_s.get("mailtrap_api_token", ""),
                "mailtrap_inbox_id": all_s.get("mailtrap_inbox_id", ""),
                "mailtrap_is_sandbox": str(all_s.get("mailtrap_is_sandbox", "true")).lower(),
                "enabled": str(all_s.get("email_notifications_enabled", "true")).lower(),
            }
        return {
            "provider": "disabled",
            "from_name": "TelegramGeeks Pro",
            "from_address": "notifications@telegramgeekspro.com",
            "enabled": "true",
        }

    async def send_email(
        self,
        to_email: str,
        subject: str,
        html_content: str,
        text_content: Optional[str] = None,
        db: Optional[AsyncSession] = None,
        override_config: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """Send an email through the active provider (SMTP, Resend, or Mailtrap)."""
        config = override_config or await self.get_config(db)
        provider = config.get("provider", "disabled").lower()
        from_name = config.get("from_name", "TelegramGeeks Pro")
        from_address = config.get("from_address", "notifications@telegramgeekspro.com")

        if config.get("enabled") == "false" or provider == "disabled":
            logger.info(f"[Email Service Disabled] Email to {to_email} with subject '{subject}' not sent (provider: {provider})")
            return {"status": "skipped", "provider": "disabled", "message": "Email provider is disabled."}

        logger.info(f"Dispatching email to {to_email} via provider: {provider} (Subject: {subject})")

        try:
            if provider == "smtp":
                return await self._send_smtp(to_email, subject, html_content, text_content, config)
            elif provider == "resend":
                return await self._send_resend(to_email, subject, html_content, text_content, config)
            elif provider == "mailtrap":
                return await self._send_mailtrap(to_email, subject, html_content, text_content, config)
            else:
                raise ValueError(f"Unknown email provider: {provider}")
        except Exception as e:
            logger.error(f"Failed to send email to {to_email} via {provider}: {e}")
            raise

    async def _send_smtp(
        self,
        to_email: str,
        subject: str,
        html_content: str,
        text_content: Optional[str],
        config: Dict[str, Any],
    ) -> Dict[str, Any]:
        """Send email via standard SMTP (supports STARTTLS & SSL)."""
        host = config.get("smtp_host", "localhost")
        port = int(config.get("smtp_port", 587))
        user = config.get("smtp_user", "")
        password = config.get("smtp_password", "")
        from_address = config.get("from_address", "notifications@telegramgeekspro.com")
        from_name = config.get("from_name", "TelegramGeeks Pro")
        use_tls = config.get("smtp_tls") in ("true", "1", True)
        use_ssl = config.get("smtp_ssl") in ("true", "1", True) or port == 465

        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"{from_name} <{from_address}>"
        msg["To"] = to_email

        if text_content:
            msg.attach(MIMEText(text_content, "plain", "utf-8"))
        msg.attach(MIMEText(html_content, "html", "utf-8"))

        def _sync_smtp_send():
            context = ssl.create_default_context()
            if use_ssl:
                server = smtplib.SMTP_SSL(host, port, context=context, timeout=20)
            else:
                server = smtplib.SMTP(host, port, timeout=20)
                if use_tls:
                    server.starttls(context=context)

            if user and password:
                server.login(user, password)

            server.sendmail(from_address, [to_email], msg.as_string())
            server.quit()

        await asyncio.to_thread(_sync_smtp_send)
        return {"status": "success", "provider": "smtp", "recipient": to_email}

    async def _send_resend(
        self,
        to_email: str,
        subject: str,
        html_content: str,
        text_content: Optional[str],
        config: Dict[str, Any],
    ) -> Dict[str, Any]:
        """Send email via Resend HTTP API."""
        api_key = config.get("resend_api_key", "").strip()
        if not api_key:
            raise ValueError("Resend API key is not configured.")

        from_address = config.get("resend_from_email") or config.get("from_address", "onboarding@resend.dev")
        from_name = config.get("from_name", "TelegramGeeks Pro")

        payload = {
            "from": f"{from_name} <{from_address}>",
            "to": [to_email],
            "subject": subject,
            "html": html_content,
        }
        if text_content:
            payload["text"] = text_content

        async with httpx.AsyncClient(timeout=20.0) as client:
            resp = await client.post(
                "https://api.resend.com/emails",
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                },
                json=payload,
            )
            if resp.status_code not in (200, 201):
                raise ValueError(f"Resend API error ({resp.status_code}): {resp.text}")
            return {"status": "success", "provider": "resend", "id": resp.json().get("id")}

    async def _send_mailtrap(
        self,
        to_email: str,
        subject: str,
        html_content: str,
        text_content: Optional[str],
        config: Dict[str, Any],
    ) -> Dict[str, Any]:
        """Send email via Mailtrap HTTP API (Sandbox or Production Sending)."""
        api_token = config.get("mailtrap_api_token", "").strip()
        if not api_token:
            # Fallback to SMTP if user configured Mailtrap as SMTP credentials
            if config.get("smtp_user") and config.get("smtp_password"):
                return await self._send_smtp(to_email, subject, html_content, text_content, config)
            raise ValueError("Mailtrap API token is not configured.")

        is_sandbox = config.get("mailtrap_is_sandbox") in ("true", "1", True)
        inbox_id = config.get("mailtrap_inbox_id", "").strip()

        if is_sandbox and inbox_id:
            endpoint = f"https://sandbox.api.mailtrap.io/api/send/{inbox_id}"
        else:
            endpoint = "https://send.api.mailtrap.io/api/send"

        from_address = config.get("from_address", "notifications@telegramgeekspro.com")
        from_name = config.get("from_name", "TelegramGeeks Pro")

        payload = {
            "from": {"email": from_address, "name": from_name},
            "to": [{"email": to_email}],
            "subject": subject,
            "html": html_content,
        }
        if text_content:
            payload["text"] = text_content

        async with httpx.AsyncClient(timeout=20.0) as client:
            resp = await client.post(
                endpoint,
                headers={
                    "Authorization": f"Bearer {api_token}",
                    "Content-Type": "application/json",
                },
                json=payload,
            )
            if resp.status_code not in (200, 201):
                raise ValueError(f"Mailtrap API error ({resp.status_code}): {resp.text}")
            return {"status": "success", "provider": "mailtrap", "data": resp.json()}


    # ─── Modern Animated Responsive HTML Email Templates ────────────────────────────

    def _wrap_base_template(
        self,
        title: str,
        preheader: str,
        badge_text: str,
        body_html: str,
        cta_text: Optional[str] = None,
        cta_url: Optional[str] = None,
        footer_note: Optional[str] = None,
    ) -> str:
        """Sleek, dark-mode cyberpunk responsive email template with CSS keyframe animation."""
        cta_button = ""
        if cta_text and cta_url:
            cta_button = f"""
            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-top: 28px; margin-bottom: 28px;">
              <tr>
                <td align="center">
                  <table border="0" cellpadding="0" cellspacing="0">
                    <tr>
                      <td align="center" style="border-radius: 12px; background: linear-gradient(135deg, #2DD4BF 0%, #06B6D4 100%); box-shadow: 0 4px 18px rgba(45, 212, 191, 0.35);">
                        <a href="{cta_url}" target="_blank" style="display: inline-block; padding: 14px 32px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 14px; font-weight: 700; color: #090D16; text-decoration: none; border-radius: 12px; letter-spacing: 0.2px;">
                          {cta_text} &rarr;
                        </a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
            """

        return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{title}</title>
  <style>
    @keyframes pulseGlow {{
      0% {{ box-shadow: 0 0 0 0 rgba(45, 212, 191, 0.4); }}
      70% {{ box-shadow: 0 0 0 8px rgba(45, 212, 191, 0); }}
      100% {{ box-shadow: 0 0 0 0 rgba(45, 212, 191, 0); }}
    }}
    @keyframes subtleRotate {{
      from {{ transform: rotate(0deg); }}
      to {{ transform: rotate(360deg); }}
    }}
    .status-pulse {{
      display: inline-block;
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background-color: #2DD4BF;
      animation: pulseGlow 2s infinite;
    }}
    .glow-card {{
      transition: all 0.3s ease;
    }}
    @media only screen and (max-width: 600px) {{
      .wrapper {{ width: 100% !important; padding: 16px !important; }}
      .card {{ padding: 24px 20px !important; }}
    }}
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #06090F; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #F1F5F9; -webkit-font-smoothing: antialiased;">
  <!-- Preheader text for email clients -->
  <div style="display: none; font-size: 1px; color: #06090F; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden;">
    {preheader}
  </div>

  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #06090F; padding: 36px 12px 48px 12px;">
    <tr>
      <td align="center">
        <!-- Main Card Container -->
        <table class="wrapper" border="0" cellpadding="0" cellspacing="0" width="580" style="max-width: 580px; width: 100%;">
          <!-- Header Logo Strip -->
          <tr>
            <td align="center" style="padding-bottom: 24px;">
              <table border="0" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <span style="font-size: 20px; font-weight: 800; letter-spacing: -0.5px; color: #FFFFFF;">
                      Telegram<span style="color: #2DD4BF;">Geeks</span> <span style="font-size: 11px; padding: 3px 7px; border-radius: 6px; background-color: rgba(45, 212, 191, 0.15); color: #2DD4BF; border: 1px solid rgba(45, 212, 191, 0.3); font-weight: 700; text-transform: uppercase;">PRO</span>
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Elevated Content Box with Glowing Border -->
          <tr>
            <td>
              <table class="card glow-card" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #0D131F; border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 20px; padding: 36px 32px; box-shadow: 0 12px 36px rgba(0, 0, 0, 0.6);">
                <!-- Category Badge -->
                <tr>
                  <td style="padding-bottom: 16px;">
                    <span style="display: inline-flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.8px; color: #2DD4BF; background-color: rgba(45, 212, 191, 0.1); border: 1px solid rgba(45, 212, 191, 0.25); padding: 4px 10px; border-radius: 9999px;">
                      <span class="status-pulse"></span>
                      {badge_text}
                    </span>
                  </td>
                </tr>

                <!-- Title -->
                <tr>
                  <td style="font-size: 24px; font-weight: 700; color: #FFFFFF; line-height: 1.3; padding-bottom: 20px; letter-spacing: -0.3px;">
                    {title}
                  </td>
                </tr>

                <!-- Body Content -->
                <tr>
                  <td style="font-size: 14px; line-height: 1.7; color: #94A3B8;">
                    {body_html}
                  </td>
                </tr>

                <!-- Call to Action Button -->
                {cta_button}

                <!-- Security Note / Disclaimer -->
                <tr>
                  <td style="border-top: 1px solid rgba(255, 255, 255, 0.07); padding-top: 20px; margin-top: 24px; font-size: 12px; line-height: 1.6; color: #64748B;">
                    {footer_note or "If you did not request this notification, you can safely ignore this email or reach out to our security team at security@telegramgeekspro.com."}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer Metadata -->
          <tr>
            <td align="center" style="padding-top: 32px; font-size: 11px; line-height: 1.6; color: #475569;">
              <p style="margin: 0 0 6px 0;">&copy; 2026 TelegramGeeks Pro. Enterprise Telegram Growth Engine.</p>
              <p style="margin: 0;">Automated MTProto v2.4.0 Multi-Account Network &bull; High-Volume Infrastructure</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""

    # ─── Template Builders ────────────────────────────────────────────────────────

    def build_welcome_email(self, user_name: str, email: str, login_url: str = "https://telegramgeekspro.com/login") -> Dict[str, str]:
        """Welcome email for new registrations."""
        subject = "Welcome to TelegramGeeks Pro — Account Activated"
        preheader = "Your TelegramGeeks Pro account is live and ready for high-volume Telegram automation."
        badge = "Account Ready"
        body = f"""
        <p style="margin-top: 0;">Hello <strong>{user_name or email}</strong>,</p>
        <p>Welcome to <strong>TelegramGeeks Pro</strong> — the enterprise platform for high-scale Telegram account management, AI persona warming, scrapers, and automated broadcast campaigns.</p>
        
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.06); border-radius: 12px; padding: 16px; margin: 20px 0;">
          <tr>
            <td style="font-size: 13px; color: #CBD5E1;">
              <strong style="color: #2DD4BF;">&bull; Direct MTProto Engine:</strong> Up to 100+ concurrent account sessions<br>
              <strong style="color: #2DD4BF;">&bull; Neuro-Text AI:</strong> GPT-powered multi-persona dynamic variations<br>
              <strong style="color: #2DD4BF;">&bull; Native Windows App:</strong> Downloadable standalone client with HWID locking
            </td>
          </tr>
        </table>

        <p>You can now sign in to your dashboard to connect your proxies, upload Telegram sessions (TData / Telethon), or launch your first automated campaign.</p>
        """
        return {
            "subject": subject,
            "html": self._wrap_base_template(
                title="Welcome to TelegramGeeks Pro",
                preheader=preheader,
                badge_text=badge,
                body_html=body,
                cta_text="Sign In to Dashboard",
                cta_url=login_url,
            ),
            "text": f"Welcome to TelegramGeeks Pro, {user_name}! Sign in to your dashboard at {login_url}",
        }

    def build_password_reset_email(self, user_name: str, reset_code_or_link: str, expires_in_minutes: int = 15) -> Dict[str, str]:
        """Security password reset / verification code email."""
        subject = "Password Reset Request — TelegramGeeks Pro"
        preheader = f"Use verification code {reset_code_or_link} to reset your password. Valid for {expires_in_minutes} minutes."
        badge = "Security Verification"
        body = f"""
        <p style="margin-top: 0;">Hello <strong>{user_name}</strong>,</p>
        <p>We received a request to reset the password for your TelegramGeeks Pro account. Use the secure authorization code below:</p>

        <div style="text-align: center; margin: 24px 0;">
          <span style="display: inline-block; font-family: monospace; font-size: 28px; font-weight: 800; letter-spacing: 6px; color: #2DD4BF; background-color: #06090F; border: 1px solid rgba(45, 212, 191, 0.4); padding: 14px 28px; border-radius: 12px; box-shadow: 0 0 20px rgba(45, 212, 191, 0.2);">
            {reset_code_or_link}
          </span>
        </div>

        <p style="font-size: 13px; color: #94A3B8; text-align: center;">This security code expires in <strong>{expires_in_minutes} minutes</strong>.</p>
        """
        return {
            "subject": subject,
            "html": self._wrap_base_template(
                title="Reset Your Password",
                preheader=preheader,
                badge_text=badge,
                body_html=body,
                footer_note="If you did not request a password reset, please change your password immediately or contact security@telegramgeekspro.com.",
            ),
            "text": f"Your TelegramGeeks password reset code is {reset_code_or_link}. Expires in {expires_in_minutes} minutes.",
        }

    def build_license_delivery_email(
        self,
        user_name: str,
        license_key: str,
        plan_tier: str,
        max_accounts: int = 100,
        download_url: str = "https://telegramgeekspro.com/downloads/TelegramGeeks-Pro-v2.4.0-Windows-x64.zip",
    ) -> Dict[str, str]:
        """Delivery email when a paid license key is generated."""
        subject = f"Your TelegramGeeks Pro {plan_tier.upper()} License Key"
        preheader = f"Your standalone Windows Desktop license key is {license_key}. Download the installer now."
        badge = "License Generated"
        body = f"""
        <p style="margin-top: 0;">Hello <strong>{user_name}</strong>,</p>
        <p>Your <strong>{plan_tier.upper()}</strong> standalone Windows Desktop License has been generated and activated for your account.</p>

        <div style="background-color: #06090F; border: 1px solid rgba(45, 212, 191, 0.35); border-radius: 12px; padding: 20px; margin: 24px 0; text-align: center;">
          <span style="font-size: 11px; text-transform: uppercase; color: #64748B; font-weight: 600; letter-spacing: 1px; display: block; margin-bottom: 6px;">Your Dedicated License Key</span>
          <span style="font-family: monospace; font-size: 18px; font-weight: 800; color: #2DD4BF; letter-spacing: 2px; select-all;">
            {license_key}
          </span>
        </div>

        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="font-size: 13px; color: #CBD5E1; margin-bottom: 20px;">
          <tr>
            <td style="padding: 6px 0;"><strong>Plan Tier:</strong></td>
            <td align="right" style="color: #2DD4BF; font-weight: 700; text-transform: uppercase;">{plan_tier}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0;"><strong>Account Quota:</strong></td>
            <td align="right" style="color: #FFFFFF;">Up to {max_accounts} Telegram Accounts</td>
          </tr>
          <tr>
            <td style="padding: 6px 0;"><strong>Hardware Lock:</strong></td>
            <td align="right" style="color: #FFFFFF;">Auto-locks to 1st activated PC (HWID)</td>
          </tr>
        </table>

        <p>Download the native Windows 64-bit desktop package below and enter your license key during startup.</p>
        """
        return {
            "subject": subject,
            "html": self._wrap_base_template(
                title=f"{plan_tier.upper()} License Activated",
                preheader=preheader,
                badge_text=badge,
                body_html=body,
                cta_text="Download Windows Desktop App",
                cta_url=download_url,
            ),
            "text": f"Your TelegramGeeks Pro license key is {license_key}. Download the desktop app at {download_url}",
        }

    def build_payment_receipt_email(
        self,
        user_name: str,
        order_id: str,
        amount: float,
        currency: str,
        plan_tier: str,
        tx_hash: Optional[str] = None,
    ) -> Dict[str, str]:
        """Order confirmation and payment receipt email."""
        subject = f"Payment Confirmed: Order #{order_id} — TelegramGeeks Pro"
        preheader = f"Your payment of {amount} {currency} for {plan_tier.upper()} has been confirmed."
        badge = "Payment Confirmed"
        tx_row = f"""
        <tr>
          <td style="padding: 6px 0; color: #64748B;">Transaction:</td>
          <td align="right" style="color: #94A3B8; font-family: monospace; font-size: 11px;">{tx_hash[:16]}...</td>
        </tr>
        """ if tx_hash else ""

        body = f"""
        <p style="margin-top: 0;">Hello <strong>{user_name}</strong>,</p>
        <p>We have successfully received and verified your payment. Your subscription benefits and desktop licensing privileges are immediately unlocked.</p>

        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 12px; padding: 18px; margin: 20px 0; font-size: 13px;">
          <tr>
            <td style="padding: 6px 0; color: #64748B;">Order ID:</td>
            <td align="right" style="color: #FFFFFF; font-weight: 600;">#{order_id}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748B;">Plan / Tier:</td>
            <td align="right" style="color: #2DD4BF; font-weight: 700; text-transform: uppercase;">{plan_tier}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748B;">Amount Paid:</td>
            <td align="right" style="color: #FFFFFF; font-weight: 700; font-size: 15px;">{amount:.2f} {currency}</td>
          </tr>
          {tx_row}
        </table>
        """
        return {
            "subject": subject,
            "html": self._wrap_base_template(
                title="Payment Receipt",
                preheader=preheader,
                badge_text=badge,
                body_html=body,
                cta_text="Go to Billing & Licenses",
                cta_url="https://telegramgeekspro.com/dashboard/billing",
            ),
            "text": f"Payment receipt for order #{order_id}: {amount:.2f} {currency} for {plan_tier}.",
        }

    def build_subscription_expiring_email(
        self,
        user_name: str,
        plan_tier: str,
        days_left: int = 3,
        renew_url: str = "https://telegramgeekspro.com/dashboard/billing",
    ) -> Dict[str, str]:
        """Renewal notice when a subscription is expiring soon."""
        subject = f"Action Required: Your {plan_tier.upper()} Plan Expires in {days_left} Days"
        preheader = f"Renew your TelegramGeeks Pro {plan_tier.upper()} plan to prevent automation interruption."
        badge = "Renewal Notice"
        body = f"""
        <p style="margin-top: 0;">Hello <strong>{user_name}</strong>,</p>
        <p>Your <strong>{plan_tier.upper()}</strong> subscription is scheduled to expire in <strong>{days_left} days</strong>.</p>
        <p>To ensure uninterrupted campaign execution, proxy warming, and MTProto session connectivity, please renew your subscription before the expiration date.</p>
        """
        return {
            "subject": subject,
            "html": self._wrap_base_template(
                title=f"Plan Expiring in {days_left} Days",
                preheader=preheader,
                badge_text=badge,
                body_html=body,
                cta_text="Renew Subscription",
                cta_url=renew_url,
            ),
            "text": f"Your TelegramGeeks Pro {plan_tier} plan expires in {days_left} days. Renew at {renew_url}",
        }

    def build_security_alert_email(
        self,
        user_name: str,
        ip_address: str,
        user_agent: str,
        location: str = "Unknown Location",
    ) -> Dict[str, str]:
        """Security alert when login from a new device/IP occurs."""
        subject = "Security Alert: New Sign-in to Your TelegramGeeks Account"
        preheader = f"New sign-in detected from IP {ip_address} ({location})."
        badge = "Security Alert"
        body = f"""
        <p style="margin-top: 0;">Hello <strong>{user_name}</strong>,</p>
        <p>We detected a new sign-in to your TelegramGeeks Pro account from an unrecognized IP address:</p>

        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: rgba(239, 68, 68, 0.05); border: 1px solid rgba(239, 68, 68, 0.2); border-radius: 12px; padding: 16px; margin: 20px 0; font-size: 13px;">
          <tr>
            <td style="padding: 4px 0; color: #94A3B8;">IP Address:</td>
            <td align="right" style="color: #F87171; font-weight: 600; font-family: monospace;">{ip_address}</td>
          </tr>
          <tr>
            <td style="padding: 4px 0; color: #94A3B8;">Location:</td>
            <td align="right" style="color: #CBD5E1;">{location}</td>
          </tr>
          <tr>
            <td style="padding: 4px 0; color: #94A3B8;">Client:</td>
            <td align="right" style="color: #CBD5E1; font-size: 11px;">{user_agent[:40]}</td>
          </tr>
        </table>

        <p>If this was you, no action is needed. If you did not sign in, please reset your password immediately.</p>
        """
        return {
            "subject": subject,
            "html": self._wrap_base_template(
                title="New Sign-in Detected",
                preheader=preheader,
                badge_text=badge,
                body_html=body,
                cta_text="Secure Account",
                cta_url="https://telegramgeekspro.com/login",
            ),
            "text": f"New sign-in to your TelegramGeeks account from IP {ip_address}.",
        }

    def build_test_email(self, recipient: str, provider_name: str) -> Dict[str, str]:
        """Diagnostic test email to verify SMTP / Resend / Mailtrap configuration."""
        subject = f"Test Email: {provider_name.upper()} Integration Verified"
        preheader = f"Your email configuration for {provider_name.upper()} is active and transmitting correctly."
        badge = "System Test Passed"
        body = f"""
        <p style="margin-top: 0;">Congratulations!</p>
        <p>Your email infrastructure configured with <strong>{provider_name.upper()}</strong> is active and delivering emails with 100% transport integrity.</p>

        <div style="background-color: rgba(45, 212, 191, 0.05); border: 1px solid rgba(45, 212, 191, 0.25); border-radius: 12px; padding: 16px; margin: 20px 0; font-size: 13px;">
          <span style="color: #2DD4BF; font-weight: 700;">&check; Transport:</span> {provider_name.upper()}<br>
          <span style="color: #2DD4BF; font-weight: 700;">&check; Target Recipient:</span> {recipient}<br>
          <span style="color: #2DD4BF; font-weight: 700;">&check; Status:</span> Verified &amp; Operational
        </div>
        """
        return {
            "subject": subject,
            "html": self._wrap_base_template(
                title="Email Delivery Verified",
                preheader=preheader,
                badge_text=badge,
                body_html=body,
                cta_text="Open Admin Settings",
                cta_url="https://telegramgeekspro.com/admin/settings",
            ),
            "text": f"Your TelegramGeeks email integration ({provider_name}) is working correctly.",
        }


email_service = EmailService()
