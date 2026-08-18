"use client";

import { useState } from "react";
import { Star } from "lucide-react";

type FAQDict = { q: string; a: string }[];

const faqDict: { [key: string]: { title: string; items: FAQDict } } = {
  en: {
    title: "Maybe the answer to your question is here!",
    items: [
      { q: "How to buy?", a: "Automated ordering on our website. Add the desired license to your cart, register an account, and complete payment. The license key will be sent to your email and appear in your personal account." },
      { q: "How to pay?", a: "We accept cryptocurrencies including Bitcoin (BTC), Tether (USDT), and USD Coin (USDC). Card payment is available by prior request. Contact our support team for details." },
      { q: "How to contact?", a: "You can reach us through the Contacts section on our website, by submitting a request through the online form, via the online operator chat, or through our Sphere.chat encrypted messenger." },
      { q: "Do you have an Affiliate program?", a: "Yes! We offer an affiliate program where you can earn up to 25% per sale. The system is fully automated — generate your affiliate link in your personal account and start earning commissions." },
      { q: "If you have bonuses for Partners?", a: "Yes, we have a bonus system for our partners. Depending on your tier, you receive additional modules and features to increase your work efficiency." },
      { q: "What companies do you cooperate with?", a: "We partner with leading SMS services, proxy providers, and industry giants. Our partners receive dedicated accounts in Sphere.chat and access to exclusive features." },
      { q: "What is sphere.chat?", a: "Sphere.chat is an encrypted private messenger with over 1,500 users. It's our community hub for professionals in Telegram automation." },
      { q: "Do you have support after purchase?", a: "Yes, we provide both technical and informational support after purchase. Our team is available through blb.team and sphere.chat to help you with any questions or issues." },
    ],
  },
  ru: {
    title: "Возможно, ответ на ваш вопрос уже здесь!",
    items: [
      { q: "Как купить?", a: "Автоматизированный заказ на нашем сайте. Добавьте нужную лицензию в корзину, зарегистрируйте аккаунт и оплатите. Лицензионный ключ придёт на email и появится в личном кабинете." },
      { q: "Как оплатить?", a: "Мы принимаем криптовалюты: Bitcoin (BTC), Tether (USDT), USD Coin (USDC). Оплата картой доступна по предварительному запросу. Свяжитесь с нашей службой поддержки." },
      { q: "Как связаться?", a: "Вы можете связаться с нами через раздел Контакты на сайте, через онлайн-форму, чат с оператором или через наш зашифрованный мессенджер Sphere.chat." },
      { q: "Есть ли партнёрская программа?", a: "Да! Мы предлагаем партнёрскую программу с доходом до 25% с продажи. Система完全自动化 — создайте партнёрскую ссылку в личном кабинете и зарабатывайте." },
      { q: "Есть ли бонусы для партнёров?", a: "Да, у нас есть система бонусов для партнёров. В зависимости от вашего уровня вы получаете дополнительные модули и функции." },
      { q: "С какими компаниями вы сотрудничаете?", a: "Мы сотрудничаем с ведущими SMS-сервисами, прокси-провайдерами и лидерами индустрии. Наши партнёры получают выделенные аккаунты в Sphere.chat." },
      { q: "Что такое sphere.chat?", a: "Sphere.chat — это зашифрованный приватный мессенджер с более чем 1 500 пользователей. Это центр нашего сообщества профессионалов автоматизации Telegram." },
      { q: "Есть ли поддержка после покупки?", a: "Да, мы предоставляем техническую и информационную поддержку после покупки. Наша команда доступна через blb.team и sphere.chat." },
    ],
  },
  cn: {
    title: "也许这里有您问题的答案！",
    items: [
      { q: "如何购买？", a: "在我们网站自动下单。将所需许可证加入购物车，注册账户并完成支付。许可证密钥将发送到您的邮箱并显示在个人中心。" },
      { q: "如何支付？", a: "我们接受加密货币: Bitcoin (BTC)、Tether (USDT) 和 USD Coin (USDC)。银行卡支付需提前申请。请联系我们的支持团队了解详情。" },
      { q: "如何联系？", a: "您可以通过网站的联系方式页面、在线表单、在线客服聊天或我们的加密通讯软件 Sphere.chat 联系我们。" },
      { q: "有联盟计划吗？", a: "是的！我们提供联盟计划，每次销售可赚取高达25%的佣金。系统完全自动化 — 在个人中心生成联盟链接即可开始赚取佣金。" },
      { q: "合作伙伴有奖励吗？", a: "是的，我们为合作伙伴提供奖励系统。根据您的等级，您将获得额外的模块和功能以提高工作效率。" },
      { q: "你们与哪些公司合作？", a: "我们与领先的短信服务商、代理服务器提供商和行业巨头合作。合作伙伴在 Sphere.chat 中获得专属账户和高级功能。" },
      { q: "什么是 sphere.chat？", a: "Sphere.chat 是一个加密的私密通讯软件，拥有超过1500名用户。这是我们Telegram自动化专业人士的社区中心。" },
      { q: "购买后提供支持吗？", a: "是的，我们提供购买后的技术和信息支持。我们的团队通过 blb.team 和 sphere.chat 为您解答任何问题。" },
    ],
  },
};

export function ReviewsSection({ locale = "en" }: { locale?: string }) {
  const data = faqDict[locale] || faqDict.en;
  const cols = 4;
  const rows = Math.ceil(data.items.length / cols);

  return (
    <section id="reviews" className="py-16 lg:py-20 border-t border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground mb-4">
            {data.title}
          </h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-16">
          {data.items.map((faq, i) => (
            <div
              key={i}
              className="rounded-xl border bg-gradient-to-b from-[rgba(8,8,8,.98)] to-[rgba(3,3,3,.98)] border-[rgba(255,255,255,.08)] min-h-[164px] p-4 pb-2 flex flex-col"
            >
              <div className="flex items-start gap-2 mb-2">
                <Star className="w-3.5 h-3.5 text-[#2ffcd4] text-[14px] font-bold shrink-0" />
                <span className="text-[11px] text-[rgba(255,255,255,.42)] opacity-0 shrink-0">Review</span>
              </div>
              <div className="flex-1 text-[11px] text-[rgba(255,255,255,.74)] leading-relaxed line-clamp-1">
                {faq.q}
              </div>
              <p className="mt-2 text-[11px] text-[rgba(255,255,255,.42)]">{faq.a}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}