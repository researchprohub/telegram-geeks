"""Check infrastructure service resolution."""
import sys
sys.stderr = sys.stdout
from app.services.infrastructure import Infrastructure
infra = Infrastructure(
    telegram_api_id=12345,
    telegram_api_hash='test',
    session_storage_path='./sessions',
)
for mod_id in ['mass_messaging', 'converter', 'neuro_text', 'account_folders', 'persona_manager', 'proxy_checker', 'views_boost', 'mass_subscriptions', 'gender_detector', 'number_checker', 'json_generator', 'autoreponder', 'autoposting', 'anti_detection', 'open_dialogs', 'contact_book', 'reactions', 'stories', 'channel_comments', 'postbot', 'mass_unsubscriber', 'invite_modules', 'audience_collector', 'calculator_reports', 'link_checker']:
    svc = infra._resolve_service(mod_id)
    print(f"  {mod_id:25s} -> {type(svc).__name__ if svc else 'NONE'}")
