import Link from "next/link";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/marketing/Navbar";
import { Footer } from "@/components/marketing/Footer";
import { manualContentRu as manualContent } from "@/data/manuals-content-ru";
import { ManualReader } from "@/components/manuals/ManualReader";
import { ManualSystemPreview } from "@/components/manuals/ManualSystemPreview";
import { ArrowLeft, BookOpen } from "lucide-react";

function addHeadingIds(html: string): string {
  return html.replace(
    /<h([23])(?:\s[^>]*)?>(.+?)<\/h\1>/gi,
    (full, level, content) => {
      const text = content.replace(/<[^>]*>/g, "").trim();
      const id = text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
      return `<h${level} id="${id}">${content}</h${level}>`;
    }
  );
}

const seoCards = [
  { title: "Читать руководство", desc: "Пошаговые инструкции для уверенного старта с TelegramGeeks Pro", href: "/ru/manuals" },
  { title: "Смотреть статьи", desc: "Актуальные статьи и новые материалы о продвижении в Telegram", href: "/ru/posts" },
  { title: "Лента обновлений", desc: "Следите за новыми функциями и улучшениями", href: "/ru/upd" },
  { title: "Вопросы — Ответы", desc: "Ответы на часто задаваемые вопросы", href: "/ru/questions" },
  { title: "Отзывы", desc: "Отзывы и мнения реальных пользователей", href: "/ru/reviews" },
  { title: "Преимущества", desc: "Почему выбирают нас? Краткий список преимуществ", href: "/ru/telegram-promotion" },
  { title: "Наши партнеры", desc: "Отличные условия для агентств и крупных клиентов", href: "/ru/refferal" },
];

export default async function ManualPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const content = manualContent[slug];
  if (!content) redirect("/ru/manuals");

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar locale="ru" />
      <main>
        <section className="pt-28 pb-8 lg:pt-36 lg:pb-10 relative">
          <div className="absolute inset-0 pointer-events-none">
            <img src="/assets/theme/back-gradients/main-header.svg" alt="" className="w-full h-full object-cover opacity-20" />
          </div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="flex items-start gap-6">
              <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                <BookOpen className="w-6 h-6 text-primary" />
              </div>
              <div>
                <Link href="/ru/manuals" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors mb-2">
                  <ArrowLeft className="w-3 h-3" />
                  Назад к руководствам
                </Link>
                <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground mb-3">
                  {content.title}
                </h1>
              </div>
            </div>
          </div>
        </section>



        {/* ── Visual System Interface & Screenshots (Web & Desktop App) ── */}
        <section className="pb-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <ManualSystemPreview slug={slug} title={content.title} />
          </div>
        </section>

        <section className="pb-16 lg:pb-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <ManualReader bodyHtml={addHeadingIds(content.body)} />
          </div>
        </section>

        <section className="py-16 border-t border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-10">
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground mb-3">
                Откройте больше возможностей сайта
              </h2>
              <p className="text-muted-foreground text-sm">
                Изучайте документацию, статьи и ресурсы сообщества
              </p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {seoCards.map((card) => (
                <Link
                  key={card.title}
                  href={card.href}
                  className="group rounded-xl border border-border bg-muted p-5 hover:border-primary/20 hover:bg-primary/5 transition-all"
                >
                  <div className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors mb-1">
                    {card.title}
                  </div>
                  <div className="text-xs text-muted-foreground leading-relaxed">
                    {card.desc}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer locale="ru" />
    </div>
  );
}
