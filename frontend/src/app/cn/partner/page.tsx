import Link from "next/link";
import { Navbar } from "@/components/marketing/Navbar";
import { Footer } from "@/components/marketing/Footer";
import { Handshake, Users, ArrowRight } from "lucide-react";
import { partnersApi } from "@/lib/api";
import { DEFAULT_PARTNERS, Partner } from "@/data/default-partners";
import { PartnerGridInteractive } from "@/components/marketing/PartnerGridInteractive";

async function fetchPartners(): Promise<Partner[]> {
  try {
    const res = await partnersApi.list();
    if (res.data && res.data.length > 0) return res.data;
  } catch {}
  return DEFAULT_PARTNERS;
}

export const dynamic = "force-dynamic";

export default async function PartnerPage() {
  const partners = await fetchPartners();
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar locale="cn" />
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
                  我们的合作伙伴
                </h1>
                <p className="text-muted-foreground max-w-2xl">
                  开放的合作为我们工作的基石。在这里，您将找到我们信赖的项目和服务，附有直达官网的链接
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Interactive Partner Grid with Filters & Search (124 Partners) ── */}
        <PartnerGridInteractive initialPartners={partners} locale="cn" />

        {/* ── CTA ── */}
        <section className="py-16 lg:py-20 border-t border-border relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-transparent pointer-events-none" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
            <div className="max-w-2xl mx-auto text-center">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-5">
                <Users className="w-7 h-7 text-primary" />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground mb-4">
                有意开展合作？
              </h2>
              <p className="text-muted-foreground mb-8">
                请留下您的联系方式，我们将尽快与您取得联系
              </p>
              <Link
                href="/contacts"
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors"
              >
                成为合作伙伴 <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* ── Recurring CTA ── */}
        <section className="py-16 lg:py-20 border-t border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mx-auto text-center">
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground mb-4">
                专业软件助力频道快速增长
              </h2>
              <p className="text-muted-foreground mb-8">
                加入成千上万信赖 TelegramGeeks Pro 进行推广的专业人士队伍
              </p>
              <Link
                href="/#price"
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors"
              >
                购买许可证 <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer locale="cn" />
    </div>
  );
}
