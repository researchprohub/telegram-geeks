"use client";

import { useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/marketing/Navbar";
import { Footer } from "@/components/marketing/Footer";
import { Plus, X, ChevronRight, FileText, BookOpen, RefreshCw, MessageCircle, Users, Star, Gift } from "lucide-react";

const faqs = [
  {
    q: "如何购买？",
    a: "您可以直接在网站上下单；购买密钥和模块的流程是完全自动化的。将产品加入购物车，完成注册流程并支付。许可证密钥将自动发送到您的邮箱，同时也会显示在您的个人中心。请务必保存好您的注册信息。如有疑问，您可以联系我们的在线客服或直接在网站上填写申请。",
  },
  {
    q: "如何支付？",
    a: "接受的加密货币包括比特币、USDT、USDC等。网站上的支付和订购流程是完全自动化的。银行卡支付需提前申请。",
  },
  {
    q: "如何联系？",
    a: "您可以通过联系方式部分的信息发送消息，直接在网站上填写申请，或联系我们的在线客服。您也可以在我们的加密通讯工具sphere.chat中注册并联系任何可用的管理员。管理员的联系方式将在您注册时发送的消息中提供。",
  },
  {
    q: "你们有联盟计划吗？",
    a: "是的，我们提供联盟计划，您可以从每笔销售中赚取高达25%的佣金。所有佣金自动计算，联盟链接在您的个人中心中。",
  },
  {
    q: "合作伙伴有奖金吗？",
    a: "是的，联盟计划除了优秀丰厚的佣金外，还有奖金系统；我们为合作伙伴提供模块形式的奖金，以提高工作效率。",
  },
  {
    q: "你们与哪些公司合作？",
    a: "我们有广泛的合作伙伴，包括短信服务、代理服务和其他行业巨头。如果您拥有Telegram Geeks的密钥，我们公司的优势是快速解决任何问题。我们的合作伙伴拥有sphere.chat账户和专门的用户支持群组，任何问题都能得到实时快速解决。",
  },
  {
    q: "什么是sphere.chat？",
    a: "sphere.chat是我们的加密私人通讯工具，是社交媒体营销专家交流经验和解决问题的平台。用户群体相当庞大，拥有超过1500名用户，每位用户都拥有Telegram Geeks的密钥！",
  },
  {
    q: "购买后还有支持吗？",
    a: "有的！我们不仅提供技术支持，还提供信息支持；我们的项目blb.team、sphere.chat包含大量关于Telegram和其他社交网络的工作经验。支持团队位于sphere.chat中，随时为您提供帮助！",
  },
];

const seoCards = [
  { href: "/cn/manuals", title: "阅读手册", desc: "分步指南，帮助您快速上手并熟练使用网站。", icon: BookOpen },
  { href: "/cn/posts", title: "查看文章", desc: "关于网站所有主题的相关文章和最新资料。", icon: FileText },
  { href: "/cn/upd", title: "更新动态", desc: "关注新功能、最新更新和平台新闻。", icon: RefreshCw },
  { href: "/cn/questions", title: "问答", desc: "常见问题的解答和使用服务的技巧。", icon: MessageCircle },
  { href: "/cn/reviews", title: "客户评价", desc: "真实用户对产品和服务的评价和意见。", icon: Star },
  { href: "/cn/telegram-promotion", title: "优势", desc: "为什么选择我们？客户认可的关键优势列表。", icon: Gift },
  { href: "/cn/refferal", title: "合作伙伴", desc: "为代理商、博主和企业客户提供的优惠条件。成为我们的合作伙伴！", icon: Users },
];

export default function QuestionsPage() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar locale="cn" />

      <main>
        <section className="relative pt-28 pb-14 overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-1/3 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[140px]" />
            <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[100px]" />
          </div>
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">问答</h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              您可以在这里找到常见问题的答案。了解信息，快速掌握所有细节！
            </p>
          </div>
        </section>

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
                  常见问题：通过Telegram Geeks在Telegram中批量发送和邀请的一切
                </h2>
                <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
                  <p>
                    欢迎来到我们的FAQ——关于Telegram中批量发送和邀请的常见问题板块。如果您想快速扩大受众并使用现代工具设置Telegram推广，这里将为您提供最重要问题的详细答案。我们将解释如何安全使用批量发送、避免封号、构建邀请策略、跟踪效果以及运行测试活动以增加订阅者。
                  </p>
                  <p>
                    Telegram Geeks是用于自动化发送、扩展用户基础和便捷管理活动的可靠软件。我们收集了实用建议，使每位用户的工作尽可能简单、高效和透明。
                  </p>
                </div>
                <div className="mt-6">
                  <Link
                    href="/cn/demo"
                    className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors"
                  >
                    免费试用 <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

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

        <section className="border-t border-border py-14 lg:py-20">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground mb-3">
              发现更多网站功能
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto mb-10">
              不要局限于此页面——我们为您收集了最佳手册、实用文章、问题解答和真实用户评价。前往您感兴趣的板块，了解更多信息，探索新功能，让您的网站体验更加高效。
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

      <Footer locale="cn" />
    </div>
  );
}
