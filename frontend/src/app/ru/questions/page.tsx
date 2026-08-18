"use client";

import { useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/marketing/Navbar";
import { Footer } from "@/components/marketing/Footer";
import { Plus, X, ChevronRight, FileText, BookOpen, RefreshCw, MessageCircle, Users, Star, Gift } from "lucide-react";

const faqs = [
  {
    q: "Как купить?",
    a: "Вы можете оформить заказ непосредственно на сайте; процедура покупки ключа и модулей полностью автоматизирована. Добавьте товар в корзину, пройдите процедуру регистрации и оплатите покупку. Лицензионный ключ будет отправлен на вашу электронную почту автоматически, а также появится в личном кабинете. Обязательно сохраните регистрационные данные. Если у вас есть вопросы, вы можете написать нашему онлайн-консультанту или заполнить заявку прямо на сайте.",
  },
  {
    q: "Как оплатить?",
    a: "К оплате принимаются криптовалюты: Bitcoin, USDT, USDC и др. Процедура оплаты и оформления заказа на сайте полностью автоматизирована. Оплата картами возможна по предварительному запросу.",
  },
  {
    q: "Как связаться?",
    a: "Вы можете написать сообщение, используя информацию в разделе «Контакты», заполнить заявку прямо на сайте или написать нашему онлайн-оператору. Также вы можете зарегистрироваться в нашем мессенджере sphere.chat и написать любому доступному модератору. Контакты для связи с модераторами можно найти в сообщении, которое будет отправлено вам при регистрации.",
  },
  {
    q: "У вас есть партнёрская программа?",
    a: "Да, мы предоставляем партнёрскую программу, вы можете зарабатывать до 25% с каждой продажи. Все начисления автоматизированы, партнёрская ссылка находится в вашем личном кабинете.",
  },
  {
    q: "Есть ли бонусы для партнёров?",
    a: "Да, партнёрская программа, помимо отличных и щедрых выплат, также имеет бонусную систему; мы предоставляем нашим партнёрам бонусы в виде модулей для повышения эффективности их работы.",
  },
  {
    q: "С какими компаниями вы сотрудничаете?",
    a: "У нас довольно широкий круг партнёров, среди них SMS-сервисы, прокси-сервисы и другие сервисы, которые сегодня являются лидерами отрасли в своей области. Преимущество нашей компании — быстрое решение любых возникающих проблем, если вы являетесь обладателем ключа TelegramGeeks Pro. Наши партнёры имеют аккаунты в sphere.chat, специальные личные группы для поддержки пользователей, где любые вопросы решаются быстро и в реальном времени.",
  },
  {
    q: "Что такое sphere.chat?",
    a: "sphere.chat — это наш зашифрованный приватный мессенджер, место, где эксперты по маркетингу в социальных сетях обмениваются опытом и решают проблемы. Аудитория достаточно большая и насчитывает более 1500 пользователей, и каждый пользователь владеет ключом TelegramGeeks Pro!",
  },
  {
    q: "Предоставляете ли вы поддержку после покупки?",
    a: "Да! Мы стараемся поддерживать наших пользователей не только технически, но и информационно; наши проекты blb.team, sphere.chat содержат просто огромное количество информации по работе с Telegram и другими социальными сетями. Команда поддержки находится в sphere.chat и всегда готова вам помочь!",
  },
];

const seoCards = [
  { href: "/manuals", title: "Почитать мануал", desc: "Пошаговые инструкции для уверенного старта и быстрого освоения сайта.", icon: BookOpen },
  { href: "/posts", title: "Посмотреть статьи", desc: "Актуальные статьи и свежие материалы по всем темам сайта.", icon: FileText },
  { href: "/upd", title: "Лента обновлений", desc: "Следите за новыми функциями, свежими обновлениями и новостями платформы.", icon: RefreshCw },
  { href: "/questions", title: "Вопросы &ndash; Ответы", desc: "Ответы на часто задаваемые вопросы и советы по использованию сервиса.", icon: MessageCircle },
  { href: "/reviews", title: "Отзывы", desc: "Отзывы и мнения реальных пользователей о продукте и сервисе.", icon: Star },
  { href: "/telegram-promotion", title: "Преимущества", desc: "Почему выбирают нас? Краткий список ключевых преимуществ, оценённых клиентами.", icon: Gift },
  { href: "/refferal", title: "Наши партнёры", desc: "Отличные условия для агентств, блогеров и корпоративных клиентов. Станьте нашим партнёром!", icon: Users },
];

export default function QuestionsPage() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar locale="ru" />

      <main>
        {/* ── Header ── */}
        <section className="relative pt-28 pb-14 overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-1/3 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[140px]" />
            <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[100px]" />
          </div>
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
              ВОПРОСЫ &mdash; ОТВЕТЫ
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Здесь вы можете найти ответы на часто задаваемые и популярные вопросы. Изучите информацию, чтобы быстро разобраться во всех деталях!
            </p>
          </div>
        </section>

        {/* ── Info Section ── */}
        <section className="border-y border-border">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
            <div className="grid lg:grid-cols-[auto_1fr] gap-8 items-start">
              <div className="hidden lg:block w-48 pt-2">
                <svg className="w-full text-primary/20" fill="currentColor" viewBox="0 0 1536 1083.9675" xmlns="http://www.w3.org/2000/svg">
                  <path d="M921 99q5-15 20.5-25t32.5-9q16 1 30 12.5t18 27.5q4 16 0 31.5t-10 29.5q-24 58-57 111.5T888 383q-37 54-75 107t-81 102q-41 46-88 86t-99 74q-52 34-108 61-55 27-114 46 25 5 51-3t51 1q18 5 31 21t23 32l4 8q2 4-1 7-1 2-3.5 3t-4.5 2q-70 21-144 25t-148 4q-46 0-93-8.5T14 907q-8-10-12-23t0-25q2-6 6-10.5t8-8.5q36-40 72-81 35-40 70.5-80.5T230 598q35-41 71-81 5-6 11-11.5t13-6.5q15-3 27 6.5t20 20.5q9 10 17 22.5t8 26.5q0 13-7 24t-15 21q-33 41-66 82.5T243 786q39-15 77-31 39-15 76-33.5t73-40.5q35-21 68-46 38-30 73-65 34-34 65-72t60-78q29-41 56-81 36-59 70.5-118T921 99zM649 663q7-3 13-7.5t11-11.5q2-2 3.5-4.5t1.5-4.5q-10 4-17 11.5T649 663zm-9 3q-4 2-7 5t-6 7q8-1 14-4.5t8-8.5q-2-2-5-1t-4 2zm-46 48q6-3 11-6.5t8-8.5q-7 2-12.5 6t-9.5 9h3z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-foreground mb-4">
                  FAQ: Всё о массовых рассылках и приглашениях в Telegram через TelegramGeeks Pro
                </h2>
                <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
                  <p>
                    Добро пожаловать в наш FAQ — раздел часто задаваемых вопросов о массовых рассылках и приглашениях в Telegram. Если вы хотите быстро увеличить аудиторию и настроить продвижение в Telegram с помощью современных инструментов, здесь вы найдёте подробные ответы на самые важные вопросы. Мы рассказываем, как безопасно использовать массовые рассылки, избегать блокировок, выстроить стратегию приглашений, отслеживать эффективность и запускать тестовые кампании для роста подписчиков.
                  </p>
                  <p>
                    TelegramGeeks Pro — это надёжное программное обеспечение для автоматизации рассылок, расширения базы и удобного управления кампаниями. Мы собрали практические рекомендации, чтобы работа с сервисом была максимально простой, эффективной и прозрачной для каждого пользователя.
                  </p>
                </div>
                <div className="mt-6">
                  <Link
                    href="/demo"
                    className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors"
                  >
                    Попробовать бесплатно <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── FAQ Accordion ── */}
        <section className="py-14 lg:py-20">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="space-y-2">
              {faqs.map((faq, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-border bg-muted overflow-hidden"
                >
                  <button
                    onClick={() => setOpen(open === i ? null : i)}
                    className="flex items-center justify-between w-full px-5 py-4 text-left text-sm font-medium text-foreground/80 hover:text-foreground hover:bg-muted transition-colors"
                  >
                    <span>{faq.q}</span>
                    {open === i ? (
                      <X className="w-4 h-4 text-primary shrink-0" />
                    ) : (
                      <Plus className="w-4 h-4 text-muted-foreground shrink-0" />
                    )}
                  </button>
                  {open === i && (
                    <div className="px-5 pb-4 text-sm text-muted-foreground leading-relaxed">
                      {faq.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── SEO Cards ── */}
        <section className="border-t border-border py-14 lg:py-20">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground mb-3">
              Откройте больше возможностей сайта
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto mb-10">
              Не ограничивайтесь только этой страницей — мы собрали для вас лучшие инструкции, полезные статьи, ответы на вопросы и реальные отзывы пользователей. Перейдите в интересующий вас раздел, чтобы узнать больше, изучить новые возможности и сделать ваше пребывание на сайте максимально эффективным.
            </p>
            <div className="h-px bg-accent mb-10" />
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {seoCards.map((card) => (
                <Link
                  key={card.title}
                  href={card.href}
                  className="group rounded-xl border border-border bg-muted p-5 text-left hover:border-primary/20 hover:bg-primary/5 transition-all"
                >
                  <div className="w-9 h-9 rounded-lg bg-accent flex items-center justify-center mb-4 group-hover:bg-primary/10 transition-colors">
                    <card.icon className="w-4 h-4 text-primary" />
                  </div>
                  <h3 className="text-sm font-semibold text-foreground mb-1.5">{card.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{card.desc}</p>
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
