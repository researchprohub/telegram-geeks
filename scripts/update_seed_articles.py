with open('backend/app/db/seed_articles.py', 'r', encoding='utf-8') as f:
    code = f.read()

mapping = {
    'telegram-scraper-guide-2026': '/assets/img/blog/scraper-guide.svg',
    'mass-dm-telegram-outreach-automation': '/assets/img/blog/mass-dm-outreach.svg',
    'telethon-vs-tdata-converter-guide': '/assets/img/blog/session-converter.svg',
    'telegram-expert-alternative-review-2026': '/assets/img/blog/expert-vs-geeks.svg',
    'sms-virtual-numbers-telegram-registration': '/assets/img/blog/sms-registration.svg',
    'telegram-account-warmup-ai-personas': '/assets/img/blog/ai-persona-warming.svg',
    'telegram-message-interceptor-lead-generation': '/assets/img/blog/autoresponder-interceptor.svg',
    'proxy-setup-multi-account-telegram-management': '/assets/img/blog/proxy-guide.svg',
    'telegram-channel-cloner-media-mirroring': '/assets/img/blog/invite-members.svg',
    'telegram-flood-wait-peer-flood-prevention': '/assets/img/blog/anti-ban-safety.svg',
}

for slug, img in mapping.items():
    code = code.replace(f'"slug": "{slug}",', f'"slug": "{slug}",\n        "cover_image": "{img}",')

code = code.replace(
    'existing.category_id = cat_id',
    'existing.category_id = cat_id\n                existing.cover_image = art.get("cover_image")'
)
code = code.replace(
    'category_id=cat_id,',
    'category_id=cat_id,\n                    cover_image=art.get("cover_image"),'
)

with open('backend/app/db/seed_articles.py', 'w', encoding='utf-8') as f:
    f.write(code)
print('Updated seed_articles.py successfully')
