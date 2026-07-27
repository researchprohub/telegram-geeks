import { Star } from "lucide-react";
import { Navbar } from "@/components/marketing/Navbar";
import { Footer } from "@/components/marketing/Footer";

const reviews = [
  {
    text: "不久前购买了这款软件，一点也不后悔。界面非常直观，几分钟就能摸索明白。特别值得一提的是稳定性，使用期间从未出现卡顿或延迟。设置的灵活性也令人满意，可以根据自己的需求进行调整。",
    name: "mkaddy",
    license: "1个月许可证",
  },
  {
    text: "Telegram领域性价比最高的软件，运行稳定无故障，界面清晰，客服响应迅速。我已使用多年，从未遇到任何问题。能够为客户提供大量服务，大多数情况下一个订单就能回本。",
    name: "Spam",
    license: "1个月许可证",
  },
  {
    text: "几年前用过类似的软件，但由于各种bug转向了定制方案。今年决定试试Telegram Geeks，其稳定性令我惊讶。现在任务执行速度快了数倍，也更加简单。",
    name: "mulad",
    license: "1年许可证",
  },
  {
    text: "从软件发布之初就开始使用。很好的商业工具，功能丰富，易于上手（还有管理员提供的丰富教学材料）。客服随时在线。持续更新。强烈推荐！",
    name: "Maxler",
    license: "1个月许可证",
  },
  {
    text: "使用Telegram Geeks已经两年了。对功能、价格和稳定性非常满意。推荐！",
    name: "yuri555",
    license: "1年许可证",
  },
  {
    text: "多年来我一直从事Telegram自动化和流量管理工作，Telegram Geeks确实是我用过的最稳定、设计最精良的工具之一。软件在处理群发、邀请、会话管理和账号养号方面非常流畅，从未出现卡顿或崩溃。最让我印象深刻的是功能的灵活性和界面的直观性，即使是复杂任务也能轻松上手。可以看出开发者真正理解实际的Telegram工作流程。更新频繁，支持响应迅速，整体质量持续提升。如果你认真考虑扩展Telegram业务同时减少封号风险并确保账号安全，这款软件绝对值得拥有。",
    name: "q0659588439",
    license: "1个月许可证",
  },
];

export default function ReviewsPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar locale="cn" />
      <main>
        <section className="relative overflow-hidden pt-20">
          <div className="absolute inset-0 pointer-events-none">
            <img src="/assets/theme/back-gradients/main-header.svg" alt="" className="w-full h-full object-cover opacity-30" />
          </div>
          <div className="absolute top-1/2 left-1/3 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px]" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative py-16 lg:py-24">
            <div className="text-center max-w-2xl mx-auto">
              <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-foreground mb-4">
                用户评价
              </h1>
              <p className="text-muted-foreground text-lg">
                看看客户对Telegram Geeks的评价
              </p>
            </div>
          </div>
        </section>

        <section className="pb-20 lg:pb-28">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="columns-1 md:columns-2 lg:columns-3 gap-5">
              {reviews.map((review, i) => (
                <div
                  key={i}
                  className="break-inside-avoid mb-5 rounded-xl border border-border bg-card p-6 hover:bg-accent transition-colors"
                >
                  <div className="flex gap-1 mb-3">
                    {Array.from({ length: 5 }).map((_, s) => (
                      <Star key={s} className="w-4 h-4 fill-primary text-primary" />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                    {review.text}
                  </p>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-xs font-medium text-foreground/80">
                      {review.name[0].toUpperCase()}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-foreground/80">{review.name}</div>
                      <div className="text-xs text-muted-foreground">{review.license}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="pb-20 lg:pb-28 border-t border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 lg:pt-20">
            <div className="max-w-xl mx-auto text-center">
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground mb-4">
                告诉我们您对我们产品的看法
              </h2>
              <p className="text-muted-foreground text-sm mb-8">
                您的反馈帮助我们改进
              </p>
              <form className="space-y-5 text-left">
                <div>
                  <label className="block text-sm text-muted-foreground mb-2">评分：</label>
                  <div className="flex gap-1">
                    {Array.from({ length: 5 }).map((_, s) => (
                      <button
                        key={s}
                        type="button"
                        className="w-9 h-9 rounded-lg border border-border bg-card flex items-center justify-center hover:border-primary/40 hover:bg-primary/5 transition-colors"
                      >
                        <Star className="w-4 h-4 text-muted-foreground" />
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-muted-foreground mb-2">评价：</label>
                  <textarea
                    rows={5}
                    placeholder="写下您的评价..."
                    className="w-full rounded-xl border border-border bg-muted px-4 py-3 text-sm text-foreground placeholder-white/30 focus:outline-none focus:border-primary/40 resize-none"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors"
                >
                  提交
                </button>
              </form>
            </div>
          </div>
        </section>
      </main>
      <Footer locale="cn" />
    </div>
  );
}
