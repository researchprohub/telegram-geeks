const fs = require('fs');
const path = require('path');

const blogDir = path.join(__dirname, '..', 'frontend', 'public', 'assets', 'img', 'blog');
if (!fs.existsSync(blogDir)) fs.mkdirSync(blogDir, { recursive: true });

const svgs = [
  {
    name: '2fa-security.svg',
    title: '2FA Cloud Security',
    subtitle: 'Zero-Leak Password Protocol',
    iconColor: '#2ffcd4',
    iconPath: '<rect x="360" y="240" width="80" height="70" rx="12" fill="#2ffcd4" opacity="0.2"/><path d="M375 240 V205 C375 185 425 185 425 205 V240" fill="none" stroke="#2ffcd4" stroke-width="8" stroke-linecap="round"/><circle cx="400" cy="275" r="8" fill="#2ffcd4"/>'
  },
  {
    name: 'mtproto-benchmark.svg',
    title: 'MTProto Concurrency',
    subtitle: 'TDLib vs Telethon Benchmark',
    iconColor: '#38bdf8',
    iconPath: '<path d="M350 290 L380 210 L410 250 L450 170" fill="none" stroke="#38bdf8" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/><circle cx="450" cy="170" r="10" fill="#2ffcd4"/>'
  },
  {
    name: 'channel-cloner.svg',
    title: 'Channel & Media Cloner',
    subtitle: 'Automated Feed Replication',
    iconColor: '#a855f7',
    iconPath: '<rect x="355" y="195" width="60" height="75" rx="8" fill="none" stroke="#a855f7" stroke-width="6"/><rect x="385" y="225" width="60" height="75" rx="8" fill="#a855f7" opacity="0.2" stroke="#2ffcd4" stroke-width="6"/>'
  },
  {
    name: 'mobile-proxies.svg',
    title: '4G/5G Proxy Rotation',
    subtitle: 'Zero-Ban Rotation Matrix',
    iconColor: '#2ffcd4',
    iconPath: '<circle cx="400" cy="240" r="45" fill="none" stroke="#2ffcd4" stroke-width="6" stroke-dasharray="8 6"/><circle cx="400" cy="240" r="20" fill="#2ffcd4" opacity="0.3"/><path d="M400 170 V195 M400 285 V310 M330 240 H355 M445 240 H470" stroke="#2ffcd4" stroke-width="6" stroke-linecap="round"/>'
  },
  {
    name: 'sms-virtual-numbers.svg',
    title: 'SMS API Orchestration',
    subtitle: 'Automated Account Creation',
    iconColor: '#38bdf8',
    iconPath: '<rect x="365" y="180" width="70" height="120" rx="14" fill="none" stroke="#38bdf8" stroke-width="6"/><circle cx="400" cy="275" r="6" fill="#38bdf8"/><rect x="380" y="200" width="40" height="20" rx="4" fill="#2ffcd4" opacity="0.4"/>'
  },
  {
    name: 'comment-sentiment.svg',
    title: 'Comment Lead Scraper',
    subtitle: 'Real-Time Sentiment Extraction',
    iconColor: '#ec4899',
    iconPath: '<path d="M350 190 H450 V260 H390 L360 285 V260 H350 Z" fill="none" stroke="#ec4899" stroke-width="6" stroke-linejoin="round"/><path d="M380 225 H420 M380 240 H405" stroke="#2ffcd4" stroke-width="5" stroke-linecap="round"/>'
  },
  {
    name: 'spambot-unban.svg',
    title: 'SpamBot Appeal Automation',
    subtitle: '24H Account Recovery Protocol',
    iconColor: '#f59e0b',
    iconPath: '<path d="M400 180 L445 205 V255 C445 285 400 310 400 310 C400 310 355 285 355 255 V205 Z" fill="none" stroke="#f59e0b" stroke-width="6"/><path d="M385 245 L395 255 L415 235" stroke="#2ffcd4" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>'
  },
  {
    name: 'crypto-growth.svg',
    title: 'Web3 & Crypto Scaling',
    subtitle: '100K Active Community Blueprint',
    iconColor: '#2ffcd4',
    iconPath: '<polygon points="400,175 440,240 400,265 360,240" fill="none" stroke="#2ffcd4" stroke-width="6"/><polygon points="400,275 440,250 400,310 360,250" fill="none" stroke="#38bdf8" stroke-width="6"/>'
  },
  {
    name: 'dialog-manager.svg',
    title: 'Unified Dialog Inbox',
    subtitle: 'Multi-Operator CRM Routing',
    iconColor: '#6366f1',
    iconPath: '<circle cx="370" cy="220" r="22" fill="none" stroke="#6366f1" stroke-width="6"/><circle cx="430" cy="220" r="22" fill="none" stroke="#2ffcd4" stroke-width="6"/><path d="M370 242 C370 270 430 270 430 242" stroke="#a855f7" stroke-width="6" stroke-linecap="round"/>'
  },
  {
    name: 'invite-admin.svg',
    title: 'Admin-Assisted Inviting',
    subtitle: 'High-Volume Group Growth',
    iconColor: '#10b981',
    iconPath: '<circle cx="380" cy="220" r="20" fill="none" stroke="#10b981" stroke-width="6"/><circle cx="430" cy="220" r="14" fill="none" stroke="#2ffcd4" stroke-width="5"/><path d="M350 280 C350 250 410 250 410 280" stroke="#10b981" stroke-width="6"/><path d="M420 275 C420 255 455 255 455 275" stroke="#2ffcd4" stroke-width="5"/>'
  },
  {
    name: 'reaction-booster.svg',
    title: 'Views & Reaction Engine',
    subtitle: 'Algorithmic Post Ranking',
    iconColor: '#f43f5e',
    iconPath: '<path d="M400 285 L390 275 C345 235 340 195 375 185 C390 180 400 195 400 195 C400 195 410 180 425 185 C460 195 455 235 410 275 Z" fill="#f43f5e" opacity="0.3" stroke="#f43f5e" stroke-width="6"/>'
  },
  {
    name: 'desktop-vs-cloud.svg',
    title: 'Desktop vs Cloud Security',
    subtitle: 'Hardware DPAPI vs Serverless',
    iconColor: '#0ea5e9',
    iconPath: '<rect x="350" y="190" width="100" height="70" rx="8" fill="none" stroke="#0ea5e9" stroke-width="6"/><path d="M375 260 L365 295 H435 L425 260" stroke="#0ea5e9" stroke-width="6" stroke-linejoin="round"/>'
  },
  {
    name: 'voice-video-ai.svg',
    title: 'AI Voice & Video Notes',
    subtitle: 'Multimodal Synthesis Outreach',
    iconColor: '#8b5cf6',
    iconPath: '<rect x="385" y="180" width="30" height="55" rx="15" fill="none" stroke="#8b5cf6" stroke-width="6"/><path d="M365 210 C365 245 435 245 435 210 M400 245 V280 M375 280 H425" stroke="#2ffcd4" stroke-width="6" stroke-linecap="round"/>'
  },
  {
    name: 'folder-management.svg',
    title: '1,000+ Account Folders',
    subtitle: 'Automated Dialog Categorization',
    iconColor: '#eab308',
    iconPath: '<path d="M350 200 H390 L405 220 H450 V280 H350 Z" fill="none" stroke="#eab308" stroke-width="6" stroke-linejoin="round"/><rect x="365" y="235" width="70" height="35" rx="4" fill="#eab308" opacity="0.2"/>'
  },
  {
    name: 'global-search.svg',
    title: 'Global Search Scraping',
    subtitle: 'Telegram Keyword Discovery',
    iconColor: '#06b6d4',
    iconPath: '<circle cx="390" cy="230" r="32" fill="none" stroke="#06b6d4" stroke-width="6"/><path d="M415 255 L455 295" stroke="#2ffcd4" stroke-width="8" stroke-linecap="round"/>'
  },
  {
    name: 'botfather-tokens.svg',
    title: 'Mass BotFather Ops',
    subtitle: '500+ Mini-App Token Provisioning',
    iconColor: '#14b8a6',
    iconPath: '<rect x="360" y="190" width="80" height="80" rx="20" fill="none" stroke="#14b8a6" stroke-width="6"/><circle cx="385" cy="225" r="6" fill="#2ffcd4"/><circle cx="415" cy="225" r="6" fill="#2ffcd4"/><path d="M385 250 Q400 260 415 250" stroke="#14b8a6" stroke-width="5" stroke-linecap="round"/>'
  },
  {
    name: 'secret-chats.svg',
    title: 'Secret Chat Automation',
    subtitle: 'End-to-End Ephemeral Messaging',
    iconColor: '#f97316',
    iconPath: '<path d="M355 240 C355 190 445 190 445 240 C445 270 400 300 400 300 C400 300 355 270 355 240 Z" fill="none" stroke="#f97316" stroke-width="6"/><circle cx="400" cy="235" r="8" fill="#2ffcd4"/>'
  },
  {
    name: 'flood-wait.svg',
    title: 'FloodWait Rate Limits',
    subtitle: 'Exponential Jitter Backoff',
    iconColor: '#ef4444',
    iconPath: '<circle cx="400" cy="240" r="45" fill="none" stroke="#ef4444" stroke-width="6"/><path d="M400 215 V240 L425 255" stroke="#2ffcd4" stroke-width="6" stroke-linecap="round"/>'
  },
  {
    name: 'traffic-arbitrage.svg',
    title: 'Telegram Traffic Arbitrage',
    subtitle: 'High-LTV Funnel Conversion',
    iconColor: '#10b981',
    iconPath: '<path d="M350 280 L385 235 L415 255 L450 190" fill="none" stroke="#10b981" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/><polyline points="435,190 450,190 450,205" fill="none" stroke="#10b981" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>'
  },
  {
    name: 'enterprise-compliance.svg',
    title: 'Enterprise Compliance',
    subtitle: 'GDPR & TOS Data Privacy Shield',
    iconColor: '#3b82f6',
    iconPath: '<path d="M400 180 L445 205 V255 C445 285 400 310 400 310 C400 310 355 285 355 255 V205 Z" fill="none" stroke="#3b82f6" stroke-width="6"/><path d="M380 240 H420 M400 220 V260" stroke="#2ffcd4" stroke-width="6" stroke-linecap="round"/>'
  },
];

svgs.forEach((item) => {
  const content = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="800" height="450" viewBox="0 0 800 450" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stopColor="#080d16" />
      <stop offset="50%" stopColor="#0b1320" />
      <stop offset="100%" stopColor="#05080f" />
    </linearGradient>
    <linearGradient id="glowGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stopColor="${item.iconColor}" stopOpacity="0.25" />
      <stop offset="100%" stopColor="#00f2fe" stopOpacity="0" />
    </linearGradient>
    <pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse">
      <path d="M 32 0 L 0 0 0 32" fill="none" stroke="rgba(255, 255, 255, 0.04)" stroke-width="1" />
    </pattern>
  </defs>

  <!-- Background -->
  <rect width="800" height="450" fill="url(#bgGrad)" />
  <rect width="800" height="450" fill="url(#grid)" />

  <!-- Ambient Glow -->
  <circle cx="400" cy="240" r="140" fill="url(#glowGrad)" filter="blur(30px)" />
  <circle cx="680" cy="90" r="90" fill="${item.iconColor}" fill-opacity="0.08" filter="blur(40px)" />

  <!-- Central Visual Container -->
  <rect x="280" y="140" width="240" height="180" rx="24" fill="#0d1726" fill-opacity="0.8" stroke="rgba(255, 255, 255, 0.1)" stroke-width="1" />
  <rect x="280" y="140" width="240" height="180" rx="24" stroke="${item.iconColor}" stroke-opacity="0.3" stroke-width="1" />

  <!-- Central Graphic -->
  ${item.iconPath}

  <!-- Header Category Badge -->
  <rect x="40" y="40" width="160" height="32" rx="16" fill="${item.iconColor}" fill-opacity="0.12" stroke="${item.iconColor}" stroke-opacity="0.3" />
  <text x="54" y="61" fill="${item.iconColor}" font-family="system-ui, -apple-system, sans-serif" font-size="12" font-weight="700" letter-spacing="1">TELEGRAM GEEKS</text>

  <!-- Title & Subtitle in Footer -->
  <text x="40" y="385" fill="#ffffff" font-family="system-ui, -apple-system, sans-serif" font-size="28" font-weight="800" letter-spacing="-0.5">${item.title}</text>
  <text x="40" y="415" fill="#94a3b8" font-family="system-ui, -apple-system, sans-serif" font-size="16" font-weight="500">${item.subtitle}</text>

  <!-- Corner Watermark Mark -->
  <circle cx="730" cy="390" r="24" fill="#101929" stroke="rgba(255,255,255,0.1)" />
  <path d="M722 388 L738 380 L732 396 L726 400 Z" fill="${item.iconColor}" />
</svg>
`;
  fs.writeFileSync(path.join(blogDir, item.name), content, 'utf-8');
  console.log(`Generated SVG: ${item.name}`);
});

console.log('All 20 article SVGs generated successfully!');
