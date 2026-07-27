import Link from "next/link";
import { Navbar } from "@/components/marketing/Navbar";
import { Footer } from "@/components/marketing/Footer";
import { PartnerLogos } from "@/components/marketing/PartnerLogos";
import { ReviewsSection } from "@/components/marketing/ReviewsSection";
import { FaqSection } from "@/components/marketing/FaqSection";
import ModuleExplorer from "@/components/marketing/ModuleExplorer";
import AnimatedSection from "@/components/marketing/AnimatedSection";
import { ArrowRight, Gift, Users, Globe, MessageCircle, Search, Hash, FileJson, UserPlus, Plus, FileText, Send, Zap, Target, Shield, BookOpen, Settings } from "lucide-react";

const topFeatures = [
  { icon: Gift, title: "Более 6 лет", desc: "на рынке" },
  { icon: MessageCircle, title: "Мессенджер", desc: "закрытое сообщество" },
  { icon: Globe, title: "Более 10k клиентов", desc: "по всему миру" },
  { icon: MessageCircle, title: "Поддержка", desc: "24/7" },
];

const featureGroups: { icon: any; label: string; desc: string }[][] = [
  [
    { icon: Search, label: "Поиск чатов и каналов", desc: "Находите любые чаты и каналы по ключевым словам" },
    { icon: Globe, label: "Веб-аккаунты", desc: "Доступ к аккаунтам через браузер" },
    { icon: FileJson, label: "Генератор JSON", desc: "Генерация параметров устройств для регистрации" },
    { icon: UserPlus, label: "Массовая подписка и отписка", desc: "Управление подписками на каналы" },
    { icon: Hash, label: "Создание чатов и каналов", desc: "Массовое создание групп и каналов" },
  ],
  [
    { icon: Zap, label: "Создание ботов", desc: "Регистрация и настройка ботов Telegram" },
    { icon: FileText, label: "Создание постов (PostBot)", desc: "Дизайн постов с кнопками и медиа" },
    { icon: Users, label: "Сбор аудитории", desc: "Сбор участников из групп и каналов" },
    { icon: MessageCircle, label: "Сбор участников чата", desc: "Извлечение списков участников" },
    { icon: FileText, label: "Сбор из аккаунта", desc: "Сбор контактов и диалогов" },
    { icon: Search, label: "Проверка ссылок", desc: "Массовая проверка ссылок" },
  ],
  [
    { icon: MessageCircle, label: "Сбор из комментариев", desc: "Извлечение комментаторов из постов" },
    { icon: Globe, label: "Глобальный поиск", desc: "Поиск по всей базе Telegram" },
    { icon: FileJson, label: "Объединение баз", desc: "Объединение нескольких баз данных" },
    { icon: FileJson, label: "Исключение из баз", desc: "Удаление дубликатов из аудитории" },
    { icon: Users, label: "Определение пола", desc: "Определение пола из профиля Telegram" },
    { icon: UserPlus, label: "Приглашение аудитории", desc: "Приглашение собранных пользователей в группы" },
  ],
  [
    { icon: UserPlus, label: "Приглашение по ID", desc: "Добавление пользователей по Telegram ID" },
    { icon: UserPlus, label: "Приглашение по номерам", desc: "Приглашение пользователей по номеру" },
    { icon: UserPlus, label: "Приглашение по контактам", desc: "Приглашение из телефонных контактов" },
    { icon: Send, label: "Рассылка SMS (GPT)", desc: "Отправка SMS с AI-генерацией контента" },
    { icon: MessageCircle, label: "Комментарии в канале", desc: "Публикация комментариев с нескольких аккаунтов" },
    { icon: Send, label: "Рассылка по ID", desc: "Отправка сообщений по Telegram ID" },
  ],
];

const plans = [
  { name: "Демо-лицензия", price: "Бесплатно", period: "", popular: false, features: ["Доступ на 24 часа", "Базовые функции", "Ограниченное число аккаунтов", "Обучающие материалы"] },
  { name: "1 месяц", price: "$120", period: "/мес", popular: false, features: ["Доступ на 30 дней", "Все основные модули", "Магазин аккаунтов", "Чат с клиентами", "Онлайн-поддержка", "Бесплатные обновления"] },
  { name: "1 год", price: "$550", period: "/год", popular: true, features: ["Доступ на 365 дней", "Все основные модули", "Магазин аккаунтов", "Чат с клиентами (3000+)", "Приоритетная поддержка", "Бесплатные обновления", "Лучшая цена"] },
  { name: "2 года", price: "$1,050", period: "/2 года", popular: false, features: ["Доступ на 730 дней", "Все основные модули", "Магазин аккаунтов", "Чат с клиентами (3000+)", "Приоритетная поддержка", "Бесплатные обновления", "Экономия 20%"] },
  { name: "3 года", price: "$1,350", period: "/3 года", popular: false, features: ["Доступ на 1095 дней", "Все основные модули", "Магазин аккаунтов", "Выделенная поддержка", "Бесплатные обновления", "Скидка на Pro модули", "Экономия 38%"] },
];

export default function RUPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar locale="ru" />
      <main>
        {/* ── Hero ── */}
        <section className="relative min-h-[100dvh] flex items-center overflow-hidden pt-20">
          <div className="absolute inset-0 pointer-events-none">
            <img src="/assets/theme/back-gradients/main-header.svg" alt="" className="w-full h-full object-cover opacity-30" />
          </div>
          <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px]" />
          <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[100px]" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full relative z-10">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <a href="https://www.youtube.com/watch?v=9Vf4twPRhUI" target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-accent text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors mb-6">
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                  Видеообзор
                </a>
                <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tighter leading-none mb-6 text-foreground">
                  Telegram Geeks
                </h1>
                <p className="text-base sm:text-lg text-muted-foreground max-w-xl leading-relaxed mb-8">
                  Полный набор инструментов для продвижения в Telegram: от регистрации, рассылки и приглашений до прогрева аккаунтов, управления чатами и точной работы с сессиями
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Link href="/#price" className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors">
                    Купить <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link href="/demo" className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-colors text-sm">
                    Демо-доступ
                  </Link>
                </div>
              </div>
              <div className="hidden lg:block">
                <div className="relative">
                  <div className="absolute -inset-4 bg-gradient-to-tr from-primary/10 via-transparent to-transparent rounded-2xl blur-xl" />
                  <div className="relative rounded-2xl border border-border bg-gradient-to-br from-card to-transparent overflow-hidden">
                    <img
                      src="/assets/hero/screenshot.png"
                      alt="Telegram Geeks Интерфейс"
                      className="w-full h-auto object-cover"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <PartnerLogos />

        {/* ── Top Features ── */}
        <section className="py-10 border-b border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {topFeatures.map((feat) => (
                <div key={feat.title} className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center shrink-0">
                    <feat.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-foreground">{feat.title}</div>
                    <div className="text-xs text-muted-foreground">{feat.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Welcome ── */}
        <section className="py-16 lg:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <AnimatedSection>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="rounded-xl border border-border bg-muted p-8 lg:p-10">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-5">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="stroke-primary" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 2L11 13" /><path d="M22 2L15 22L11 13L2 9L22 2Z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-foreground mb-4">Добро пожаловать!</h2>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                  Сегодня почти каждый, кто продвигает проекты или услуги в <strong className="text-foreground/80">Telegram</strong>, слышал о нас, и многие уже являются частью нашего сообщества.
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Массовая рассылка, накрутка, приглашения в группы и другие способы получения трафика — всё это делается с <strong className="text-foreground/80">Telegram Geeks!</strong>
                </p>
              </div>
              <div className="rounded-xl border border-border bg-muted p-8 lg:p-10">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center">
                    <MessageCircle className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider">Бренд</div>
                    <div className="text-sm font-semibold text-foreground">Sphere.Chat</div>
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-foreground mb-4">Мы — BLB Team</h2>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                  Мы предоставляем не просто программное обеспечение, а доступ к закрытому сообществу профессионалов, базе знаний и реальным кейсам автоматизации Telegram.
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed mb-5">
                  Наши пользователи получают доступ к зашифрованному мессенджеру <strong className="text-foreground/80">Sphere.chat</strong> с аудиторией 5000+ человек, каждый из которых использует <strong className="text-foreground/80">Telegram Geeks!</strong>
                </p>
                <a href="https://sphere.chat/" target="_blank" rel="nofollow noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors">
                  Зарегистрироваться <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            </div>
            </AnimatedSection>
          </div>
        </section>

        <ModuleExplorer locale="ru" />

        {/* ── Modules Showcase ── */}
        <section className="border-t border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-tr from-primary/5 via-primary/[0.02] to-transparent rounded-3xl blur-2xl pointer-events-none" />
              <img
                src="/assets/landing/modules-showcase.jpg"
                alt="Telegram Geeks модули"
                className="relative w-full h-auto rounded-2xl border border-border shadow-2xl"
              />
            </div>
          </div>
        </section>

        {/* ── Pricing ── */}
        <section id="price" className="py-16 lg:py-20 border-t border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <AnimatedSection>
            <div className="text-center max-w-2xl mx-auto mb-14">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-4">Купить лицензию</h2>
            </div>
            </AnimatedSection>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              {plans.map((plan) => (
                <div key={plan.name} className={`relative rounded-xl border p-6 flex flex-col ${plan.popular ? "border-primary/40 bg-primary/5 shadow-lg shadow-primary/5" : "border-border bg-muted"}`}>
                  {plan.popular && <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-primary text-xs font-semibold text-primary-foreground whitespace-nowrap">Лучшая цена</div>}
                  <div className="mb-5">
                    <h3 className="font-semibold text-base text-foreground mb-1">{plan.name}</h3>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-bold text-foreground">{plan.price}</span>
                      {plan.period && <span className="text-xs text-muted-foreground">{plan.period}</span>}
                    </div>
                  </div>
                  <ul className="space-y-2 mb-6 flex-1">
                    {plan.features.map((feat) => (
                      <li key={feat} className="flex items-start gap-2 text-xs text-muted-foreground">
                        <svg className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                        {feat}
                      </li>
                    ))}
                  </ul>
                  <Link href={plan.price === "Бесплатно" ? "/demo" : "/register"}
                    className={`flex items-center justify-center gap-2 w-full py-2.5 rounded-lg text-sm font-medium transition-colors ${plan.popular ? "bg-primary text-primary-foreground hover:bg-primary/90" : "border border-border text-muted-foreground hover:text-foreground hover:bg-accent"}`}>
                    {plan.price === "Бесплатно" ? "Получить" : "Купить"} <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        <ReviewsSection locale="ru" />

        {/* ── Demo CTA ── */}
        <AnimatedSection>
        <section className="py-16 lg:py-20 border-t border-border relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-transparent pointer-events-none" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
            <div className="max-w-2xl mx-auto text-center">
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground mb-4">
                Попробуйте демо-версию &mdash; убедитесь, что программа вам подходит!
              </h2>
              <p className="text-muted-foreground mb-8">Начните использовать сегодня и увидите результаты</p>
              <Link href="/demo" className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors">
                Отправить заявку <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>
        </AnimatedSection>

        <FaqSection locale="ru" />
      </main>
      <Footer locale="ru" />
    </div>
  );
}
