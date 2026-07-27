import Link from "next/link";
import { Navbar } from "@/components/marketing/Navbar";
import { Footer } from "@/components/marketing/Footer";
import {
  ChevronRight, Download as DownloadIcon,
  Monitor, Cpu, HardDrive, Wifi, Layers, Code2
} from "lucide-react";

const requirements = [
  { icon: Monitor, label: "ОС Windows 10" },
  { icon: Code2, label: "Microsoft .NET Framework 4.7.2" },
  { icon: Cpu, label: "Процессор от 2 ядер" },
  { icon: HardDrive, label: "ОЗУ от 2 ГБ" },
  { icon: Monitor, label: "64-разрядная система" },
  { icon: Wifi, label: "Стабильное интернет-соединение" },
];

export default function DownloadPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar locale="ru" />
      <main>
        {/* ── Breadcrumb ── */}
        <section className="pt-28 pb-4 lg:pt-36 lg:pb-6 relative">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
          </div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
              <Link href="/" className="hover:text-muted-foreground transition-colors">Главная</Link>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="text-muted-foreground">Скачать</span>
            </nav>

            <div className="flex items-start gap-6">
              <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                <DownloadIcon className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground mb-3">
                  Скачать
                </h1>
                <p className="text-muted-foreground max-w-2xl">
                  Всё необходимое для эффективного маркетинга в Telegram!
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Download Card ── */}
        <section className="pb-16 lg:pb-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="rounded-2xl border border-border bg-gradient-to-br from-card to-transparent overflow-hidden">
              <div className="grid lg:grid-cols-2 gap-8 p-8 lg:p-12">
                {/* Left: Download */}
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-card text-xs text-primary mb-6">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                    Версия 1.0.0
                  </div>

                  <h2 className="text-2xl lg:text-3xl font-bold tracking-tight mb-2">
                    Telegram <span className="text-primary">Geeks</span>
                  </h2>
                  <p className="text-muted-foreground text-sm mb-8 leading-relaxed">
                    Мощное десктопное приложение для продвижения в Telegram, сбора аудитории
                    и автоматизированных маркетинговых кампаний.
                  </p>

                  <a
                    href="https://disk.yandex.ru/d/EVZBqPQB1pLcyA"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-3 px-8 py-4 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-all group"
                  >
                    <DownloadIcon className="w-5 h-5" />
                    Скачать
                    <Monitor className="w-5 h-5 ml-auto" />
                  </a>

                  <div className="mt-8 flex flex-wrap gap-3">
                    <Link
                      href="/#price"
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all"
                    >
                      Купить лицензию
                    </Link>
                    <Link
                      href="/"
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all"
                    >
                      Смотреть обзор
                    </Link>
                    <Link
                      href="/manuals"
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all"
                    >
                      Инструкция
                    </Link>
                  </div>

                  {/* Languages */}
                  <div className="mt-8 pt-8 border-t border-border">
                    <span className="text-xs text-muted-foreground uppercase tracking-wider">Языки</span>
                    <div className="flex items-center gap-3 mt-2">
                      {["EN", "RU", "CN"].map((lang) => (
                        <span key={lang} className="px-3 py-1 rounded-md bg-card border border-border text-xs text-muted-foreground">
                          {lang}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right: Requirements */}
                <div className="lg:border-l border-border lg:pl-8">
                  <h3 className="text-sm font-semibold text-foreground/80 mb-6 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-primary" />
                    Минимальные требования
                  </h3>
                  <ul className="space-y-3">
                    {requirements.map((req) => (
                      <li key={req.label} className="flex items-center gap-3 px-4 py-3 rounded-lg bg-muted border border-border">
                        <req.icon className="w-4 h-4 text-primary shrink-0" />
                        <span className="text-sm text-muted-foreground">{req.label}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-4 text-xs text-muted-foreground leading-relaxed">
                    Потребление ресурсов зависит от количества одновременно работающих потоков.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer locale="ru" />
    </div>
  );
}
