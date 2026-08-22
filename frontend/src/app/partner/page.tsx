import Link from "next/link";
import { Navbar } from "@/components/marketing/Navbar";
import { Footer } from "@/components/marketing/Footer";
import {
  Handshake, Users, ArrowRight, Globe, Smartphone,
  Monitor, MessageCircle, ExternalLink, Filter
} from "lucide-react";
import { partnersApi } from "@/lib/api";

interface Partner {
  name: string;
  img?: string;
  href: string;
  category: "proxies" | "browsers" | "sms";
  description?: string;
}

const DEFAULT_PARTNERS: Partner[] = [
  { name: "5SIM.net", href: "https://5sim.net", category: "sms", description: "Global virtual phone numbers for instant SMS verification." },
  { name: "SMS-Activate", href: "https://sms-activate.org", category: "sms", description: "Tier-1 virtual numbers in 150+ countries." },
  { name: "Grizzly SMS", href: "https://grizzlysms.com", category: "sms", description: "High delivery rates for Telegram registrations." },
  { name: "SMSPool", href: "https://smspool.net", category: "sms", description: "Fast automated SMS code acquisition API." },
  { name: "Proxy-Seller", href: "https://proxy-seller.com", category: "proxies", description: "Dedicated IPv4/IPv6 & Mobile 4G/5G proxy rotation." },
  { name: "MobileProxy.space", href: "https://mobileproxy.space", category: "proxies", description: "High-trust mobile proxies with remote reboot URLs." },
  { name: "Bright Data", href: "https://brightdata.com", category: "proxies", description: "Residential & ISP proxy network for web scraping." },
  { name: "Dolphin{anty}", href: "https://dolphin-anty.com", category: "browsers", description: "Anti-detect multi-account browser." },
  { name: "AdsPower", href: "https://adspower.com", category: "browsers", description: "Multi-profile fingerprint management platform." },
  { name: "Octo Browser", href: "https://octobrowser.net", category: "browsers", description: "Universal anti-detect browser for teams." },
  { name: "Sphere.Chat", href: "https://sphere.chat", category: "browsers", description: "Encrypted messenger & community for 5,000+ marketers." },
  { name: "BLB.team", href: "https://blb.team", category: "browsers", description: "Telegram automation community and knowledge base." },
];

async function fetchPartners(): Promise<Partner[]> {
  try {
    const res = await partnersApi.list();
    if (res.data && res.data.length > 0) return res.data;
  } catch {}
  return DEFAULT_PARTNERS;
}

export const dynamic = "force-dynamic";

const categories = [
  { id: "all", label: "All", icon: Filter },
  { id: "proxies", label: "Proxies", icon: Globe },
  { id: "browsers", label: "Browsers", icon: Monitor },
  { id: "sms", label: "SMS services", icon: Smartphone },
] as const;

export default async function PartnerPage() {
  const partners = await fetchPartners();
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main>
        {/* ── Header ── */}
        <section className="pt-28 pb-8 lg:pt-36 lg:pb-10 relative">
          <div className="absolute inset-0 pointer-events-none">
            <img src="/assets/theme/back-gradients/main-header.svg" alt="" className="w-full h-full object-cover opacity-20" />
          </div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="flex items-start gap-6">
              <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                <Handshake className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground mb-3">
                  Our partners
                </h1>
                <p className="text-muted-foreground max-w-2xl">
                  Open cooperation is the foundation of our work. Here you will find projects and services we trust, with direct links to their websites
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Partner Grid ── */}
        <PartnerGrid partners={partners} />

        {/* ── CTA ── */}
        <section className="py-16 lg:py-20 border-t border-border relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-transparent pointer-events-none" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
            <div className="max-w-2xl mx-auto text-center">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-5">
                <Users className="w-7 h-7 text-primary" />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground mb-4">
                Interested in partnership?
              </h2>
              <p className="text-muted-foreground mb-8">
                Leave your contact details, and we will get in touch with you
              </p>
              <Link
                href="/contacts"
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors"
              >
                Become a partner <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* ── Recurring CTA ── */}
        <section className="py-16 lg:py-20 border-t border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mx-auto text-center">
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground mb-4">
                Professional software for fast channel growth
              </h2>
              <p className="text-muted-foreground mb-8">
                Join thousands of professionals who trust TelegramGeeks Pro for their promotion needs
              </p>
              <Link
                href="/#price"
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors"
              >
                Buy a license <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

function PartnerGrid({ partners }: { partners: Partner[] }) {
  return (
    <section className="py-8 lg:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {partners.map((p) => (
            <a
              key={p.name}
              href={p.href}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative rounded-xl border border-white/[0.08] bg-[#07090a] p-5 flex flex-col justify-between hover:border-[#2ffcd4]/40 hover:bg-white/[0.02] transition-all shadow-sm"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-white group-hover:text-[#2ffcd4] transition-colors">{p.name}</span>
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-white/[0.06] text-white/50 border border-white/[0.06]">
                    {p.category}
                  </span>
                </div>
                {p.description && (
                  <p className="text-xs text-white/60 leading-relaxed line-clamp-2">
                    {p.description}
                  </p>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs text-[#2ffcd4] font-medium">
                <span>Visit Service</span>
                <ExternalLink className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
