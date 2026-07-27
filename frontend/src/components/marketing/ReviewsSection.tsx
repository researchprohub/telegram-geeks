import { Star, ArrowRight } from "lucide-react";
import Link from "next/link";

type ReviewDict = { [key: string]: { text: string; name: string }[] };

const reviewsDict: ReviewDict = {
  en: [
    { text: "Excellent software! I have been using Telegram Geeks for over a year now. The functionality is constantly expanding, the support team is always in touch and helps solve any issues.", name: "elot_178" },
    { text: "I bought a license for a year. Fully satisfied. The session duplicator and mass messaging work flawlessly. The anti-ban system is well thought out.", name: "Roman1992" },
    { text: "I recommend it to everyone who is seriously involved in Telegram promotion. The program pays for itself in the first month of use.", name: "Dr Zoidberg" },
    { text: "Great product, convenient interface, many features. I especially like the audience collection and database management tools.", name: "ssw024" },
    { text: "I was looking for a Telegram promotion tool for a long time. Tried several options, settled on Telegram Geeks. The best solution on the market.", name: "dyadyauasya" },
    { text: "Cooperation with Telegram Geeks has significantly simplified our work with Telegram. Automated processes that used to take hours now run in the background.", name: "SMS-Activate" },
    { text: "The session duplicator feature is absolute gold. I can clone my entire Telegram setup across multiple machines in seconds. This saves me hours of manual setup.", name: "TechExplorer" },
    { text: "I bought a lifetime license and never regretted it. The team regularly releases updates with new features that make our workflows even more efficient.", name: "Bog" },
  ],
  ru: [
    { text: "Отличный софт! Пользуюсь Telegram Geeks уже больше года. Функционал постоянно расширяется, служба поддержки всегда на связи и помогает решить любые вопросы.", name: "elot_178" },
    { text: "Купил лицензию на год. Полностью доволен. Дубликатор сессий и массовая рассылка работают безупречно. Система антибан хорошо продумана.", name: "Roman1992" },
    { text: "Рекомендую всем, кто серьёзно занимается продвижением в Telegram. Программа окупается в первый же месяц использования.", name: "Dr Zoidberg" },
    { text: "Отличный продукт, удобный интерфейс, много функций. Особенно нравятся инструменты сбора аудитории и управления базами данных.", name: "ssw024" },
    { text: "Долго искал инструмент для продвижения в Telegram. Перепробовал несколько вариантов, остановился на Telegram Geeks. Лучшее решение на рынке.", name: "dyadyauasya" },
    { text: "Сотрудничество с Telegram Geeks значительно упростило нашу работу с Telegram. Автоматизированные процессы, которые раньше занимали часы, теперь работают в фоне.", name: "SMS-Activate" },
    { text: "Отличный софт за свои деньги. Купил лицензию и ни разу не пожалел. Команда регулярно выпускает обновления с новыми функциями.", name: "Bog" },
    { text: "Session Duplicator is absolute gold. I can clone my entire Telegram setup across multiple machines in seconds. Saves hours of manual setup.", name: "TechExplorer" },
    { text: "Purchased a lifetime license and never regretted it. Team regularly releases updates with new features that make workflows even more efficient.", name: "PremiumUser" },
  ],
  cn: [
    { text: "优秀的软件！我使用 Telegram Geeks 已经一年多了。功能不断扩展，支持团队随时在线帮助解决任何问题。", name: "elot_178" },
    { text: "我购买了一年的许可证。非常满意。会话复制器和群发消息功能完美运行。反封号系统设计巧妙。", name: "Roman1992" },
    { text: "我推荐给所有认真从事 Telegram 推广的人。这个程序在使用的第一个月就能回本。", name: "Dr Zoidberg" },
    { text: "很好的产品，界面方便，功能丰富。我特别喜欢受众收集和数据库管理工具。", name: "ssw024" },
    { text: "我寻找 Telegram 推广工具很久了。试过几个选择，最终选择了 Telegram Geeks。市场上最好的解决方案。", name: "dyadyauasya" },
    { text: "与 Telegram Geeks 的合作极大地简化了我们在 Telegram 上的工作。过去需要数小时的自动化流程现在在后台运行。", name: "SMS-Activate" },
    { text: "物超所值的软件。我购买了许可证，从未后悔。团队定期发布带有新功能的更新。", name: "Bog" },
    { text: "会话复制器功能简直是金字塔超级兵。我可以跨多台机器克隆完整的Telegram设置，节省数小时的手动配置。", name: "TechExplorer" },
    { text: "购买了终身许可证，从未后悔。团队定期发布新功能，让工作流程更加高效。", name: "PremiumUser" },
  ],
};

const t: { [key: string]: { title: string; more: string } } = {
  en: { title: "Reviews", more: "More reviews" },
  ru: { title: "Отзывы", more: "Больше отзывов" },
  cn: { title: "用户评价", more: "更多评价" },
};

export function ReviewsSection({ locale = "en" }: { locale?: string }) {
  const reviews = reviewsDict[locale] || reviewsDict.en;
  const txt = t[locale] || t.en;
  return (
    <section className="py-20 lg:py-28 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground text-center mb-14">
          {txt.title}
        </h2>
        <div className="columns-1 md:columns-2 lg:columns-3 gap-5 relative">
          {reviews.map((review, i) => (
            <div
              key={i}
              className="break-inside-avoid mb-5 rounded-xl border border-border bg-card p-6"
            >
              <div className="flex gap-1 mb-3">
                {Array.from({ length: 5 }).map((_, s) => (
                  <Star key={s} className="w-4 h-4 fill-primary text-primary" />
                ))}
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                {review.text}
              </p>
              <div className="text-sm font-medium text-foreground/80">{review.name}</div>
            </div>
          ))}
        </div>
        <div className="text-center mt-10">
          <Link
            href="/reviews"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            {txt.more} <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
