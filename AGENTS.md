# Telegram Geeks — Agent Configuration

## Design System
- CSS variables in `globals.css`: `--primary` (blue light / teal dark), `--accent`, `--destructive`, `--success`, `--warning`
- Tailwind extends: `bg-[hsl(var(--primary))]`, `bg-primary`, `bg-primary/10`, etc.
- Always use CSS variables via `bg-primary`, `text-primary`, `bg-card`, `border-border`, etc. Never hardcode Tailwind colors like `bg-green-600`, `bg-orange-500`, `bg-red-500`, `bg-white`
- Sidebar is `bg-background` with `border-border`, active items use `bg-primary/10`

## Available Skills
### .opencode/skills/ (design)
- `design` — branding, logos, CIP, banners, icons, social photos, HTML slides
- `brand` — brand voice, visual identity, messaging frameworks
- `banner-design` — social media, ads, web heroes, 22 styles
- `ui-styling` — shadcn/ui, Tailwind, canvas designs, accessibility
- `design-system` — design tokens, component specs, slide decks
- `slides` — HTML presentations with Chart.js, design tokens, copywriting
- `ui-ux-pro-max` — UI/UX design intelligence database (CSV-backed)
### .agents/skills/ (premium taste)
- `design-taste-frontend` — senior UI/UX engineer, metric-based rules
- `gpt-taste` — elite UX/UI & GSAP motion engineering

## Multi-Agent Backend
- `backend/app/core/ai_engine.py` — OpenAI integration with orchestration
- AI features require `OPENAI_API_KEY` in `.env`
- Backend runs on Python 3.12 with `PYTHONPATH` set to project root