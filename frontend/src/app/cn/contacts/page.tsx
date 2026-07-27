import Link from "next/link";
import { Navbar } from "@/components/marketing/Navbar";
import { Footer } from "@/components/marketing/Footer";
import {
  ChevronRight, Mail, MessageCircle, Clock,
  Headphones, CheckCircle, Shield
} from "lucide-react";

const faq = [
  { q: "最快的联系途径是什么？", a: "我们的在线客服、Telegram聊天和电子邮件提供最快响应时间。在线客服对紧急咨询回复最快。" },
  { q: "周末和节假日有支持吗？", a: "有的，我们的支持团队包括周末和大多数节假日。紧急事务可能会略微延迟，但我们尽力确保及时帮助。" },
  { q: "如果我不满意能退款吗？", a: "是的，我们提供退款政策。请联系我们，我们将快速处理您的请求。" },
  { q: "我可以在需要之前测试功能吗？", a: "可以，请通过任意渠道联系我们的支持团队，安排试用或获取功能详情。" },
  { q: "联系如何保障安全？", a: "我们采用端到端加密并与经过验证的官方渠道合作。切勿与未核实来源分享密码或付款详情。" },
];

const channels = [
  { icon: Headphones, title: "在线客服", desc: "网站即时回复（推荐）", action: "开始对话" },
  { icon: MessageCircle, title: "Telegram聊天", desc: "快速响应，方便沟通", action: "发送消息" },
  { icon: Mail, title: "电子邮件", desc: "适合详细咨询", action: "发送邮件" },
  { icon: Clock, title: "响应时间", desc: "平均2小时内回复", highlight: true },
];

export default function ContactsPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar locale="cn" />
      <main>
        <section className="pt-28 pb-8 lg:pt-36 lg:pb-10 relative">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
          </div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
              <Link href="/" className="hover:text-muted-foreground transition-colors">首页</Link>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="text-muted-foreground">联系方式</span>
            </nav>

            <div className="flex items-start gap-6">
              <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                <MessageCircle className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground mb-3">联系我们</h1>
                <p className="text-muted-foreground max-w-2xl">选择最方便的渠道，我们随时为您提供帮助！</p>
              </div>
            </div>
          </div>
        </section>

        <section className="pb-16 lg:pb-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-8">
              <div className="space-y-4">
                {channels.slice(0, 3).map((ch) => (
                  <div key={ch.title} className="rounded-xl border border-border bg-muted p-5 hover:border-primary/20 transition-all">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <ch.icon className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                        <div>
                          <h3 className="font-semibold text-foreground text-sm">{ch.title}</h3>
                          <p className="text-xs text-muted-foreground mt-0.5">{ch.desc}</p>
                        </div>
                      </div>
                      <span className="text-xs text-primary whitespace-nowrap">{ch.action} →</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="rounded-xl border border-border bg-muted p-6 lg:p-8">
                <h2 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-primary" />
                  常见问题
                </h2>
                <div className="space-y-4">
                  {faq.map((item) => (
                    <details key={item.q} className="group">
                      <summary className="text-sm text-muted-foreground cursor-pointer hover:text-foreground transition-colors [&::-webkit-details-marker]:hidden list-none flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 group-open:opacity-100 opacity-40" />
                        {item.q}
                      </summary>
                      <p className="text-xs text-muted-foreground mt-2 pl-3.5">{item.a}</p>
                    </details>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer locale="cn" />
    </div>
  );
}
