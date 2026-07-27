import Link from "next/link";
import { Navbar } from "@/components/marketing/Navbar";
import { Footer } from "@/components/marketing/Footer";
import { MessageCircle, HelpCircle, ExternalLink } from "lucide-react";

export default function ContactsPage() {
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
                <MessageCircle className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground mb-3">
                  Контакты
                </h1>
                <p className="text-muted-foreground max-w-2xl">
                  Свяжитесь с нашей службой поддержки или подпишитесь на нас в социальных сетях
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Support ── */}
        <section className="py-12 lg:py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-2 gap-10 items-center">
              <div>
                <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-5">
                  <HelpCircle className="w-7 h-7 text-primary" />
                </div>
                <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground mb-4">
                  Служба поддержки
                </h2>
                <p className="text-muted-foreground leading-relaxed mb-3">
                  Наши пользователи получают доступ к защищённому мессенджеру{" "}
                  <Link href="https://sphere.chat/" className="text-primary hover:underline" target="_blank">
                    Sphere.chat
                  </Link>
                </p>
                <p className="text-muted-foreground leading-relaxed mb-6">
                  Вы можете написать в чат до покупки, чтобы уточнить детали,
                  или обратиться к модераторам за помощью, уже работая с продуктом.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Link
                    href="https://sphere.chat/"
                    target="_blank"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors"
                  >
                    Открыть Sphere.chat <ExternalLink className="w-4 h-4" />
                  </Link>
                  <Link
                    href="https://sphere.chat/"
                    target="_blank"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:border-border transition-colors"
                  >
                    Как зарегистрироваться <ExternalLink className="w-4 h-4" />
                  </Link>
                </div>
              </div>
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 via-transparent to-transparent rounded-2xl" />
                <img
                  src="/assets/img/home_panel_img.png"
                  alt="Интерфейс Sphere.chat"
                  className="w-full rounded-2xl border border-border"
                />
              </div>
            </div>
          </div>
        </section>

        {/* ── Socials ── */}
        <section className="py-16 lg:py-20 border-t border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mx-auto text-center">
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground mb-4">
                Подпишитесь на нас в соцсетях
              </h2>
              <p className="text-muted-foreground mb-8">
                Будьте в курсе новых функций, советов и новостей
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                {[
                  { label: "SphereChat", href: "https://sphere.chat/" },
                  { label: "BLB.team", href: "https://blb.team/" },
                  { label: "YouTube", href: "https://www.youtube.com/@PAKETA_TGE" },
                ].map((s) => (
                  <Link
                    key={s.label}
                    href={s.href}
                    target="_blank"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-border bg-muted text-muted-foreground hover:text-foreground hover:border-primary/20 hover:bg-primary/5 transition-all"
                  >
                    <ExternalLink className="w-4 h-4" />
                    {s.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="py-16 lg:py-20 border-t border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mx-auto text-center">
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground mb-4">
                Профессиональное ПО для быстрого роста канала
              </h2>
              <p className="text-muted-foreground mb-8">
                Присоединяйтесь к тысячам профессионалов, доверяющих Telegram Geeks продвижение
              </p>
              <Link
                href="/#price"
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors"
              >
                Купить лицензию
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer locale="ru" />
    </div>
  );
}
