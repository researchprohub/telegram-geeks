"use client";

import { motion } from "framer-motion";
import { Navbar } from "@/components/marketing/Navbar";
import { Footer } from "@/components/marketing/Footer";
import AnimatedSection from "@/components/marketing/AnimatedSection";
import {
  Info, Shield, Users, Feather, Zap, Globe, Search, MessageCircle,
  UserPlus, Bot, Send, Hash, FileJson, BarChart3, BookOpen
} from "lucide-react";

const features = [
  { icon: Shield, title: "Безопасность", desc: "Надёжная защита ваших аккаунтов и данных" },
  { icon: Users, title: "Команда", desc: "Профессиональная команда с многолетним опытом в Telegram-маркетинге" },
  { icon: Feather, title: "Надёжность", desc: "Стабильная работа и регулярные обновления" },
  { icon: Zap, title: "Скорость", desc: "Высокопроизводительные модули для любых задач" },
  { icon: Globe, title: "Глобальность", desc: "Используется клиентами по всему миру для продвижения в Telegram" },
];

const moduleCategories = [
  { icon: Search, title: "Сбор аудитории", desc: "Сбор участников из групп, каналов и комментариев. Фильтрация по гео, языку и активности. Глобальный поиск по Telegram." },
  { icon: MessageCircle, title: "Рассылки и автоматизация", desc: "Массовая рассылка со спинтаксом, автоответчик, автопостинг, форвардер, перехватчик, комментарии в каналах и SMS с GPT." },
  { icon: UserPlus, title: "Система приглашений", desc: "Пять методов приглашения — по ID, username, телефону, контактам или правам администратора. Умные лимиты и автостоп при банах." },
  { icon: Zap, title: "Продвижение аккаунтов", desc: "Накрутка просмотров и реакций, прогреватель аккаунтов (30-дневный график), массовые подписки и рефералы в ботов." },
  { icon: Bot, title: "Регистрация и сессии", desc: "Автоматическая регистрация через SMS-сервисы, QR-вход, импорт/экспорт сессий и генерация параметров устройств." },
  { icon: FileJson, title: "Клонирование и миграция", desc: "Клонирование чатов и каналов с медиа. Дублирование сессий между устройствами. Пересылка с заменой слов." },
  { icon: Hash, title: "Инструменты управления", desc: "Масс-инспекция, менеджер папок, проверка прокси, создание ботов/чатов, управление администраторами и журнал консоли." },
  { icon: BarChart3, title: "Аналитика и отчёты", desc: "Отчёты по кампаниям с показателями успешности, отслеживание ошибок и сравнение эффективности аккаунтов." },
];

export default function AboutPage() {
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
                <Info className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground mb-3">О нас</h1>
                <p className="text-muted-foreground max-w-2xl">
                  Мы — команда профессионалов, стремящаяся предоставить лучшие инструменты для маркетинга и продвижения в Telegram
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="pb-16 lg:pb-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <AnimatedSection>
            <div className="max-w-3xl mx-auto space-y-6 text-muted-foreground leading-relaxed mb-14">
              <p>
                Telegram Geeks — это универсальная платформа для Telegram-маркетинга, предоставляющая автоматическую регистрацию аккаунтов,
                расширенный таргетинг аудитории, массовую рассылку и комплексные инструменты управления аккаунтами.
              </p>
              <p>
                Наше программное обеспечение включает <strong className="text-foreground/80">49 модулей</strong> в 8 категориях —
                от сбора аудитории и массовых рассылок до прогрева аккаунтов, клонирования каналов и аналитики кампаний.
                Каждый модуль создан для реальной автоматизации Telegram, используемой профессионалами маркетинга по всему миру.
              </p>
              <p>
                Мы сотрудничаем с нашими партнёрами уже несколько лет. Наши клиенты активно используют программное обеспечение
                и очень довольны качеством и надёжностью. Функционал покрывает все потребности и работает безупречно.
              </p>
            </div>
            </AnimatedSection>

            <AnimatedSection delay={0.1}>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-14">
              {features.map((f, i) => (
                <motion.div
                  key={f.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ delay: i * 0.08, duration: 0.35 }}
                  whileHover={{ y: -4 }}
                  className="rounded-xl border border-border bg-muted p-6 hover:border-primary/20 hover:bg-primary/5 transition-colors"
                >
                  <f.icon className="w-5 h-5 text-primary mb-3" />
                  <h3 className="font-semibold text-foreground mb-1">{f.title}</h3>
                  <p className="text-sm text-muted-foreground">{f.desc}</p>
                </motion.div>
              ))}
            </div>
            </AnimatedSection>

            <AnimatedSection delay={0.2}>
            <h2 className="text-2xl font-bold text-foreground mb-8 text-center">Что мы предлагаем</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {moduleCategories.map((cat, i) => (
                <motion.div
                  key={cat.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ delay: i * 0.06, duration: 0.35 }}
                  whileHover={{ y: -4, scale: 1.01 }}
                  className="rounded-xl border border-border bg-card p-6 hover:border-primary/20 transition-all"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                      <cat.icon className="w-4 h-4 text-primary" />
                    </div>
                    <h3 className="font-semibold text-foreground">{cat.title}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{cat.desc}</p>
                </motion.div>
              ))}
            </div>
            </AnimatedSection>
          </div>
        </section>
      </main>
      <Footer locale="ru" />
    </div>
  );
}
