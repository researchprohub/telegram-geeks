const fs = require('fs');
const path = require('path');

const blogImgDir = path.join(process.cwd(), 'frontend', 'public', 'assets', 'img', 'blog');
if (!fs.existsSync(blogImgDir)) fs.mkdirSync(blogImgDir, { recursive: true });

const banners = [
  {
    fileName: 'scraper-guide.svg',
    tag: 'AUDIENCE & SCRAPING',
    title: 'Telegram Scraper Studio 2026',
    subtitle: 'MTProto Scraping • Hidden Group Members • Channel Comments',
    accentColor: '#2ffcd4',
    secondaryColor: '#0088cc',
    iconType: 'scraper',
  },
  {
    fileName: 'mass-dm-outreach.svg',
    tag: 'MESSAGING & CAMPAIGNS',
    title: 'Mass DM Outreach Scale',
    subtitle: 'Smart Delays • Spintax Variations • Flood Ban Prevention',
    accentColor: '#00f2fe',
    secondaryColor: '#4facfe',
    iconType: 'messaging',
  },
  {
    fileName: 'session-converter.svg',
    tag: 'ACCOUNT CONVERSION',
    title: 'Telethon Session vs TData',
    subtitle: 'Bi-Directional Converter • AuthKey Migration • Bulk Manager',
    accentColor: '#a855f7',
    secondaryColor: '#ec4899',
    iconType: 'converter',
  },
  {
    fileName: 'expert-vs-geeks.svg',
    tag: 'COMPETITIVE ANALYSIS',
    title: 'Telegram Expert vs Telegram Geeks',
    subtitle: '2026 In-Depth Benchmark • Performance • Module Comparison',
    accentColor: '#38ef7d',
    secondaryColor: '#11998e',
    iconType: 'comparison',
  },
  {
    fileName: 'sms-registration.svg',
    tag: 'ACCOUNT REGISTRATION',
    title: 'Automated SMS Registration',
    subtitle: '5SIM & SMS-Activate APIs • 2FA Password Setup • Device Emulation',
    accentColor: '#f59e0b',
    secondaryColor: '#d97706',
    iconType: 'registration',
  },
  {
    fileName: 'ai-persona-warming.svg',
    tag: 'AI NEURO-TEXT',
    title: 'AI Persona Warming Engine',
    subtitle: 'Peer-to-Peer Dialogues • Human Typing Cadence • Trust Scores',
    accentColor: '#2ffcd4',
    secondaryColor: '#8b5cf6',
    iconType: 'ai',
  },
  {
    fileName: 'proxy-guide.svg',
    tag: 'PROXY INFRASTRUCTURE',
    title: 'Telegram Proxy Architecture',
    subtitle: 'Mobile 4G/5G Rotation • IPv4/IPv6 • Latency Optimization',
    accentColor: '#3b82f6',
    secondaryColor: '#1d4ed8',
    iconType: 'proxy',
  },
  {
    fileName: 'invite-members.svg',
    tag: 'GROWTH & INVITES',
    title: 'Invite 10,000+ Members Fast',
    subtitle: 'Invite via Admin • FloodWait Balancing • Live Channel Growth',
    accentColor: '#10b981',
    secondaryColor: '#059669',
    iconType: 'invite',
  },
  {
    fileName: 'autoresponder-interceptor.svg',
    tag: 'AUTOMATION & BOTS',
    title: '24/7 AI Sales Interceptor',
    subtitle: 'Keyword Triggers • NLP Context Memory • Automated Conversion',
    accentColor: '#06b6d4',
    secondaryColor: '#0891b2',
    iconType: 'bot',
  },
  {
    fileName: 'anti-ban-safety.svg',
    tag: 'SECURITY & HARDENING',
    title: 'Telegram Anti-Ban Blueprint',
    subtitle: 'Hardware Fingerprints • MTProto Safe Limits • Session Health',
    accentColor: '#ef4444',
    secondaryColor: '#b91c1c',
    iconType: 'security',
  },
];

function getIllustration(type, accent, secondary) {
  switch (type) {
    case 'scraper':
      return `
        <g transform="translate(780, 140)">
          <circle cx="180" cy="180" r="160" fill="${accent}" fill-opacity="0.05" stroke="${accent}" stroke-opacity="0.2" stroke-width="1.5" stroke-dasharray="6 6"/>
          <circle cx="180" cy="180" r="110" fill="${secondary}" fill-opacity="0.08" stroke="${accent}" stroke-opacity="0.4" stroke-width="2"/>
          <circle cx="180" cy="180" r="50" fill="${accent}" fill-opacity="0.2" stroke="${accent}" stroke-width="3"/>
          <path d="M165 180 L175 190 L195 170" stroke="${accent}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
          <!-- Satellite nodes -->
          <circle cx="60" cy="100" r="22" fill="#0f172a" stroke="${accent}" stroke-width="2"/>
          <circle cx="300" cy="90" r="26" fill="#0f172a" stroke="${secondary}" stroke-width="2"/>
          <circle cx="80" cy="270" r="20" fill="#0f172a" stroke="${accent}" stroke-width="2"/>
          <circle cx="290" cy="260" r="24" fill="#0f172a" stroke="${accent}" stroke-width="2"/>
          <!-- Connect lines -->
          <line x1="180" y1="180" x2="60" y2="100" stroke="${accent}" stroke-opacity="0.5" stroke-width="1.5"/>
          <line x1="180" y1="180" x2="300" y2="90" stroke="${accent}" stroke-opacity="0.5" stroke-width="1.5"/>
          <line x1="180" y1="180" x2="80" y2="270" stroke="${accent}" stroke-opacity="0.5" stroke-width="1.5"/>
          <line x1="180" y1="180" x2="290" y2="260" stroke="${accent}" stroke-opacity="0.5" stroke-width="1.5"/>
        </g>
      `;
    case 'messaging':
      return `
        <g transform="translate(780, 140)">
          <rect x="40" y="60" width="280" height="180" rx="16" fill="#0f172a" stroke="${accent}" stroke-width="2" />
          <path d="M40 80 L180 170 L320 80" stroke="${accent}" stroke-width="2.5" fill="none" />
          <rect x="70" y="110" width="220" height="150" rx="14" fill="#1e293b" fill-opacity="0.9" stroke="${secondary}" stroke-width="1.5" />
          <circle cx="250" cy="80" r="30" fill="${accent}" fill-opacity="0.2" stroke="${accent}" stroke-width="2"/>
          <path d="M240 80 L248 88 L262 74" stroke="${accent}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
          <line x1="100" y1="160" x2="220" y2="160" stroke="${accent}" stroke-width="3" stroke-linecap="round"/>
          <line x1="100" y1="190" x2="180" y2="190" stroke="white" stroke-opacity="0.4" stroke-width="2.5" stroke-linecap="round"/>
          <line x1="100" y1="220" x2="240" y2="220" stroke="white" stroke-opacity="0.2" stroke-width="2" stroke-linecap="round"/>
        </g>
      `;
    case 'converter':
      return `
        <g transform="translate(760, 130)">
          <!-- Left box: Telethon -->
          <rect x="20" y="80" width="130" height="180" rx="12" fill="#0f172a" stroke="${accent}" stroke-width="2"/>
          <text x="85" y="130" fill="${accent}" font-family="sans-serif" font-weight="bold" font-size="14" text-anchor="middle">.SESSION</text>
          <text x="85" y="160" fill="white" fill-opacity="0.5" font-family="sans-serif" font-size="11" text-anchor="middle">Telethon / Pyrogram</text>
          <rect x="40" y="190" width="90" height="8" rx="4" fill="${accent}" fill-opacity="0.4"/>
          <rect x="40" y="210" width="60" height="8" rx="4" fill="white" fill-opacity="0.2"/>

          <!-- Middle arrows -->
          <g transform="translate(175, 150)">
            <circle cx="25" cy="20" r="32" fill="#1e293b" stroke="${accent}" stroke-width="2"/>
            <path d="M12 15 L35 15 M27 8 L35 15 L27 22" stroke="${accent}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M38 25 L15 25 M23 18 L15 25 L23 32" stroke="${secondary}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
          </g>

          <!-- Right box: TDATA -->
          <rect x="250" y="80" width="130" height="180" rx="12" fill="#0f172a" stroke="${secondary}" stroke-width="2"/>
          <text x="315" y="130" fill="${secondary}" font-family="sans-serif" font-weight="bold" font-size="14" text-anchor="middle">tdata / D873</text>
          <text x="315" y="160" fill="white" fill-opacity="0.5" font-family="sans-serif" font-size="11" text-anchor="middle">Telegram Desktop</text>
          <rect x="270" y="190" width="90" height="8" rx="4" fill="${secondary}" fill-opacity="0.4"/>
          <rect x="270" y="210" width="60" height="8" rx="4" fill="white" fill-opacity="0.2"/>
        </g>
      `;
    case 'comparison':
      return `
        <g transform="translate(760, 130)">
          <!-- Telegram Geeks card -->
          <rect x="20" y="60" width="160" height="220" rx="14" fill="#0a1219" stroke="${accent}" stroke-width="2.5"/>
          <text x="100" y="105" fill="${accent}" font-family="sans-serif" font-weight="900" font-size="16" text-anchor="middle">TG GEEKS PRO</text>
          <line x1="40" y1="125" x2="160" y2="125" stroke="${accent}" stroke-opacity="0.3" stroke-width="1.5"/>
          <text x="100" y="155" fill="white" font-family="sans-serif" font-size="12" text-anchor="middle">✓ AI Neuro-Text</text>
          <text x="100" y="185" fill="white" font-family="sans-serif" font-size="12" text-anchor="middle">✓ Cloud + Desktop</text>
          <text x="100" y="215" fill="white" font-family="sans-serif" font-size="12" text-anchor="middle">✓ 77+ Fast Modules</text>
          <rect x="50" y="240" width="100" height="24" rx="6" fill="${accent}" fill-opacity="0.2"/>
          <text x="100" y="256" fill="${accent}" font-family="sans-serif" font-weight="bold" font-size="10" text-anchor="middle">MODERN 2026</text>

          <!-- VS Badge -->
          <circle cx="195" cy="170" r="24" fill="#0f172a" stroke="white" stroke-opacity="0.3" stroke-width="2"/>
          <text x="195" y="176" fill="white" font-family="sans-serif" font-weight="900" font-size="13" text-anchor="middle">VS</text>

          <!-- Telegram Expert card -->
          <rect x="220" y="80" width="150" height="190" rx="14" fill="#0a1219" stroke="white" stroke-opacity="0.2" stroke-width="1.5"/>
          <text x="295" y="120" fill="white" fill-opacity="0.7" font-family="sans-serif" font-weight="bold" font-size="14" text-anchor="middle">TG EXPERT</text>
          <line x1="240" y1="138" x2="350" y2="138" stroke="white" stroke-opacity="0.1" stroke-width="1"/>
          <text x="295" y="170" fill="white" fill-opacity="0.5" font-family="sans-serif" font-size="11" text-anchor="middle">Standard UI</text>
          <text x="295" y="200" fill="white" fill-opacity="0.5" font-family="sans-serif" font-size="11" text-anchor="middle">No AI Neuro-Text</text>
          <text x="295" y="230" fill="white" fill-opacity="0.5" font-family="sans-serif" font-size="11" text-anchor="middle">Legacy Engine</text>
        </g>
      `;
    case 'registration':
      return `
        <g transform="translate(780, 140)">
          <!-- SIM Card -->
          <path d="M60 90 L160 90 L200 130 L200 270 L60 270 Z" fill="#0f172a" stroke="${accent}" stroke-width="2.5"/>
          <rect x="80" y="150" width="80" height="60" rx="6" fill="${accent}" fill-opacity="0.15" stroke="${accent}" stroke-width="1.5"/>
          <!-- Gold chip lines -->
          <line x1="120" y1="150" x2="120" y2="210" stroke="${accent}" stroke-width="1.5"/>
          <line x1="80" y1="180" x2="160" y2="180" stroke="${accent}" stroke-width="1.5"/>
          <!-- SMS Bubble -->
          <rect x="170" y="60" width="150" height="90" rx="14" fill="#1e293b" stroke="${secondary}" stroke-width="2"/>
          <text x="190" y="95" fill="${secondary}" font-family="sans-serif" font-weight="bold" font-size="11">SMS CODE: 74921</text>
          <text x="190" y="120" fill="white" fill-opacity="0.6" font-family="sans-serif" font-size="10">2FA Verified ✓</text>
          <!-- Phone signal -->
          <circle cx="85" cy="115" r="5" fill="${accent}"/>
          <circle cx="105" cy="115" r="5" fill="${accent}"/>
          <circle cx="125" cy="115" r="5" fill="${accent}"/>
        </g>
      `;
    case 'ai':
      return `
        <g transform="translate(770, 130)">
          <!-- AI Brain Network -->
          <circle cx="180" cy="170" r="120" fill="${accent}" fill-opacity="0.05" stroke="${accent}" stroke-opacity="0.3" stroke-width="1.5" stroke-dasharray="4 4"/>
          <circle cx="180" cy="170" r="70" fill="${secondary}" fill-opacity="0.15" stroke="${accent}" stroke-width="2"/>
          <path d="M150 150 Q180 120 210 150 Q180 200 150 150 Z" fill="${accent}" fill-opacity="0.3" stroke="${accent}" stroke-width="2"/>
          <!-- Neural nodes -->
          <circle cx="90" cy="120" r="14" fill="#0f172a" stroke="${accent}" stroke-width="2"/>
          <circle cx="270" cy="110" r="16" fill="#0f172a" stroke="${secondary}" stroke-width="2"/>
          <circle cx="100" cy="230" r="18" fill="#0f172a" stroke="${accent}" stroke-width="2"/>
          <circle cx="260" cy="220" r="15" fill="#0f172a" stroke="${accent}" stroke-width="2"/>
          <!-- Synapses -->
          <line x1="180" y1="170" x2="90" y2="120" stroke="${accent}" stroke-width="1.5"/>
          <line x1="180" y1="170" x2="270" y2="110" stroke="${accent}" stroke-width="1.5"/>
          <line x1="180" y1="170" x2="100" y2="230" stroke="${accent}" stroke-width="1.5"/>
          <line x1="180" y1="170" x2="260" y2="220" stroke="${accent}" stroke-width="1.5"/>
          <!-- Chat bubbles -->
          <rect x="230" y="40" width="130" height="40" rx="8" fill="#1e293b" stroke="${accent}" stroke-width="1.5"/>
          <text x="245" y="65" fill="${accent}" font-family="sans-serif" font-weight="bold" font-size="11">Human Cadence</text>
        </g>
      `;
    case 'proxy':
      return `
        <g transform="translate(780, 130)">
          <!-- Server Stack -->
          <rect x="50" y="60" width="220" height="50" rx="10" fill="#0f172a" stroke="${accent}" stroke-width="2"/>
          <circle cx="80" cy="85" r="6" fill="${accent}"/>
          <line x1="110" y1="85" x2="230" y2="85" stroke="white" stroke-opacity="0.3" stroke-width="2"/>

          <rect x="50" y="130" width="220" height="50" rx="10" fill="#0f172a" stroke="${accent}" stroke-width="2"/>
          <circle cx="80" cy="155" r="6" fill="${secondary}"/>
          <line x1="110" y1="155" x2="200" y2="155" stroke="white" stroke-opacity="0.3" stroke-width="2"/>

          <rect x="50" y="200" width="220" height="50" rx="10" fill="#0f172a" stroke="${accent}" stroke-width="2"/>
          <circle cx="80" cy="225" r="6" fill="${accent}"/>
          <line x1="110" y1="225" x2="240" y2="225" stroke="white" stroke-opacity="0.3" stroke-width="2"/>

          <!-- 4G/5G Badge -->
          <circle cx="280" cy="155" r="42" fill="#1e293b" stroke="${accent}" stroke-width="2.5"/>
          <text x="280" y="150" fill="${accent}" font-family="sans-serif" font-weight="900" font-size="14" text-anchor="middle">4G / 5G</text>
          <text x="280" y="170" fill="white" font-family="sans-serif" font-weight="bold" font-size="9" text-anchor="middle">ROTATION</text>
        </g>
      `;
    case 'invite':
      return `
        <g transform="translate(780, 130)">
          <circle cx="180" cy="170" r="140" fill="${accent}" fill-opacity="0.06" stroke="${accent}" stroke-opacity="0.3" stroke-width="1.5"/>
          <!-- Center Channel -->
          <circle cx="180" cy="170" r="55" fill="#0f172a" stroke="${accent}" stroke-width="3"/>
          <text x="180" y="165" fill="${accent}" font-family="sans-serif" font-weight="900" font-size="18" text-anchor="middle">+10k</text>
          <text x="180" y="185" fill="white" fill-opacity="0.7" font-family="sans-serif" font-size="10" text-anchor="middle">MEMBERS</text>
          <!-- Users joining -->
          <circle cx="80" cy="100" r="22" fill="#1e293b" stroke="${accent}" stroke-width="2"/>
          <circle cx="280" cy="90" r="22" fill="#1e293b" stroke="${secondary}" stroke-width="2"/>
          <circle cx="70" cy="240" r="22" fill="#1e293b" stroke="${accent}" stroke-width="2"/>
          <circle cx="290" cy="230" r="22" fill="#1e293b" stroke="${accent}" stroke-width="2"/>
          <!-- Incoming arrows -->
          <path d="M105 115 L140 145 M130 135 L140 145 L130 152" stroke="${accent}" stroke-width="2"/>
          <path d="M255 105 L220 140 M230 130 L220 140 L230 147" stroke="${accent}" stroke-width="2"/>
          <path d="M95 225 L135 190 M125 185 L135 190 L125 200" stroke="${accent}" stroke-width="2"/>
          <path d="M265 215 L225 190 M235 185 L225 190 L235 200" stroke="${accent}" stroke-width="2"/>
        </g>
      `;
    case 'bot':
      return `
        <g transform="translate(780, 130)">
          <!-- Bot Face -->
          <rect x="70" y="80" width="200" height="160" rx="24" fill="#0f172a" stroke="${accent}" stroke-width="2.5"/>
          <!-- Antenna -->
          <line x1="170" y1="40" x2="170" y2="80" stroke="${accent}" stroke-width="3"/>
          <circle cx="170" cy="35" r="10" fill="${accent}"/>
          <!-- Eyes -->
          <circle cx="120" cy="140" r="18" fill="${accent}" fill-opacity="0.2" stroke="${accent}" stroke-width="2"/>
          <circle cx="120" cy="140" r="8" fill="${accent}"/>
          <circle cx="220" cy="140" r="18" fill="${accent}" fill-opacity="0.2" stroke="${accent}" stroke-width="2"/>
          <circle cx="220" cy="140" r="8" fill="${accent}"/>
          <!-- Mouth / Wave -->
          <path d="M130 190 Q170 215 210 190" stroke="${accent}" stroke-width="3" stroke-linecap="round" fill="none"/>
          <!-- Radar badge -->
          <rect x="210" y="50" width="130" height="35" rx="8" fill="#1e293b" stroke="${secondary}" stroke-width="1.5"/>
          <text x="275" y="72" fill="${secondary}" font-family="sans-serif" font-weight="bold" font-size="11" text-anchor="middle">24/7 INTERCEPTOR</text>
        </g>
      `;
    case 'security':
      return `
        <g transform="translate(780, 120)">
          <!-- Shield -->
          <path d="M170 50 L270 90 L270 190 C270 250 170 290 170 290 C170 290 70 250 70 190 L70 90 Z" fill="#0f172a" stroke="${accent}" stroke-width="3"/>
          <path d="M170 80 L245 110 L245 185 C245 230 170 265 170 265 C170 265 95 230 95 185 L95 110 Z" fill="${accent}" fill-opacity="0.1" stroke="${accent}" stroke-opacity="0.5" stroke-width="1.5"/>
          <!-- Lock Check -->
          <circle cx="170" cy="170" r="35" fill="${accent}" fill-opacity="0.2" stroke="${accent}" stroke-width="2"/>
          <path d="M155 170 L165 180 L185 160" stroke="${accent}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
        </g>
      `;
  }
}

function escXml(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

for (const b of banners) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 675" width="1200" height="675">
  <defs>
    <!-- Dark gradient background -->
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#020406"/>
      <stop offset="50%" stop-color="#06090e"/>
      <stop offset="100%" stop-color="#040608"/>
    </linearGradient>

    <!-- Accent glow -->
    <radialGradient id="glow" cx="80%" cy="40%" r="60%">
      <stop offset="0%" stop-color="${b.accentColor}" stop-opacity="0.18"/>
      <stop offset="60%" stop-color="${b.secondaryColor}" stop-opacity="0.05"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
    </radialGradient>

    <!-- Pattern -->
    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255, 255, 255, 0.03)" stroke-width="1"/>
    </pattern>
  </defs>

  <!-- Background -->
  <rect width="1200" height="675" fill="url(#bgGrad)"/>
  <rect width="1200" height="675" fill="url(#glow)"/>
  <rect width="1200" height="675" fill="url(#grid)"/>

  <!-- Left Content Container -->
  <g transform="translate(80, 0)">
    <!-- Brand badge -->
    <g transform="translate(0, 100)">
      <rect x="0" y="0" width="220" height="34" rx="8" fill="rgba(47, 252, 212, 0.08)" stroke="${b.accentColor}" stroke-opacity="0.4" stroke-width="1"/>
      <circle cx="16" cy="17" r="4" fill="${b.accentColor}"/>
      <text x="28" y="22" fill="${b.accentColor}" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="800" font-size="11" letter-spacing="1.5">${escXml(b.tag)}</text>
    </g>

    <!-- Main Title -->
    <text x="0" y="240" fill="#ffffff" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="900" font-size="44" letter-spacing="-1">
      ${escXml(b.title)}
    </text>

    <!-- Subtitle / Feature Points -->
    <text x="0" y="295" fill="rgba(255, 255, 255, 0.65)" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="18" font-weight="400">
      ${escXml(b.subtitle)}
    </text>

    <!-- Feature metrics bar -->
    <g transform="translate(0, 420)">
      <rect x="0" y="0" width="580" height="85" rx="14" fill="#080d12" stroke="rgba(255, 255, 255, 0.08)" stroke-width="1.5"/>

      <!-- Metric 1 -->
      <g transform="translate(30, 22)">
        <text x="0" y="16" fill="${b.accentColor}" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="900" font-size="20">100%</text>
        <text x="0" y="38" fill="rgba(255, 255, 255, 0.45)" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="500" font-size="12">MTProto Native</text>
      </g>

      <!-- Metric 2 -->
      <g transform="translate(210, 22)">
        <text x="0" y="16" fill="#ffffff" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="900" font-size="20">Zero-Ban</text>
        <text x="0" y="38" fill="rgba(255, 255, 255, 0.45)" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="500" font-size="12">Smart Warmup</text>
      </g>

      <!-- Metric 3 -->
      <g transform="translate(390, 22)">
        <text x="0" y="16" fill="${b.accentColor}" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="900" font-size="20">77+ Modules</text>
        <text x="0" y="38" fill="rgba(255, 255, 255, 0.45)" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="500" font-size="12">Windows Pro</text>
      </g>
    </g>

    <!-- Platform Footer watermark -->
    <g transform="translate(0, 570)">
      <circle cx="10" cy="10" r="10" fill="${b.accentColor}"/>
      <path d="M6 10 L9 13 L14 7" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <text x="30" y="15" fill="rgba(255, 255, 255, 0.5)" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="700" font-size="13" letter-spacing="1">TELEGRAM GEEKS PRO • OFFICIAL GUIDE</text>
    </g>
  </g>

  <!-- Right Graphic Illustration -->
  ${getIllustration(b.iconType, b.accentColor, b.secondaryColor)}
</svg>`;

  const outPath = path.join(blogImgDir, b.fileName);
  fs.writeFileSync(outPath, svg, 'utf8');
  console.log(`Generated banner: ${outPath}`);
}
