"""Security guide for the Telegram Engagement Platform."""

# Security Guidelines

## 1. API Keys & Secrets
- Never commit `.env` files to version control
- Use different API keys for dev/staging/production
- Rotate OpenAI/Anthropic/Groq keys regularly
- Use a secrets manager (AWS Secrets Manager, HashiCorp Vault) in production

## 2. Database Security
- Change the default PostgreSQL password in production
- Use SSL connections to PostgreSQL (`postgresql+asyncpg://...?sslmode=require`)
- Restrict database access to application containers only
- Regular backups of PostgreSQL volume

## 3. Telegram API Security
- Store session strings encrypted at rest
- Never share session strings publicly
- Monitor for account bans closely
- Use dedicated Telegram accounts (not personal ones)

## 4. Proxy Security
- Use reputable proxy providers
- Rotate proxies regularly
- Test proxy health before use
- Never reuse the same proxy for more than 50 accounts

## 5. Rate Limiting
- Always configure rate limits below Telegram's actual limits
- Start conservative and increase gradually
- Monitor flood wait events
- Implement exponential backoff

## 6. Network Security
- Use HTTPS in production (SSL termination at nginx)
- Restrict API access with JWT authentication
- Implement CORS whitelist
- Use firewall rules to restrict inter-service communication

## 7. Compliance
- Comply with Telegram's Terms of Service
- Respect GDPR/CCPA for any personal data
- Maintain audit logs of all actions
- Have a data retention policy
