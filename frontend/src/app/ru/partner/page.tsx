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
  img: string;
  href: string;
  category: "proxies" | "browsers" | "sms";
}

async function fetchPartners(): Promise<Partner[]> {
  try {
    const res = await partnersApi.list();
    return res.data;
  } catch {
    return [];
  }
}

export const dynamic = "force-dynamic";

const categories = [
  { id: "all", label: "Все", icon: Filter },
  { id: "proxies", label: "Прокси", icon: Globe },
  { id: "browsers", label: "Браузеры", icon: Monitor },
  { id: "sms", label: "SMS-сервисы", icon: Smartphone },
] as const;

export default async function PartnerPage() {
  const partners = await fetchPartners();
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar locale="ru" />
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
                  Наши партнёры
                </h1>
                <p className="text-muted-foreground max-w-2xl">
                  Открытое сотрудничество — основа нашей работы. Здесь вы найдёте проекты и сервисы, которым мы доверяем, с прямыми ссылками на их сайты
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
                Заинтересованы в партнёрстве?
              </h2>
              <p className="text-muted-foreground mb-8">
                Оставьте свои контактные данные, и мы свяжемся с вами
              </p>
              <Link
                href="/contacts"
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors"
              >
                Стать партнёром <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* ── Recurring CTA ── */}
        <section className="py-16 lg:py-20 border-t border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mx-auto text-center">
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground mb-4">
                Профессиональное ПО для быстрого роста канала
              </h2>
              <p className="text-muted-foreground mb-8">
                Присоединяйтесь к тысячам профессионалов, доверяющих TelegramGeeks Pro продвижение
              </p>
              <Link
                href="/#price"
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors"
              >
                Купить лицензию <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer locale="ru" />
    </div>
  );
}

function PartnerGrid({ partners }: { partners: Partner[] }) {
  return (
    <section className="py-8 lg:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {partners.map((p) =>
            p.href ? (
              <a
                key={p.name}
                href={p.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative rounded-xl border border-border bg-muted p-4 flex items-center justify-center aspect-[5/3] hover:border-primary/20 hover:bg-primary/5 transition-all overflow-hidden"
              >
                <img
                  src={p.img}
                  alt={p.name}
                  className="max-w-full max-h-full object-contain opacity-60 group-hover:opacity-100 transition-opacity"
                  loading="lazy"
                />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-background/60">
                  <div className="flex items-center gap-1.5 text-xs text-primary font-medium">
                    <ExternalLink className="w-3 h-3" />
                    Перейти
                  </div>
                </div>
              </a>
            ) : (
              <div
                key={p.name}
                className="relative rounded-xl border border-border bg-muted p-4 flex items-center justify-center aspect-[5/3] opacity-60 overflow-hidden"
              >
                <img
                  src={p.img}
                  alt={p.name}
                  className="max-w-full max-h-full object-contain"
                  loading="lazy"
                />
              </div>
            )
          )}
        </div>
      </div>
    </section>
  );
}
