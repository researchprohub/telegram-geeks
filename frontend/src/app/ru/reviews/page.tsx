import { Star } from "lucide-react";
import { Navbar } from "@/components/marketing/Navbar";
import { Footer } from "@/components/marketing/Footer";

const reviews = [
  {
    text: "Приобрел софт не так давно и не пожалел ни разу. Интерфейс достаточно понятный, можно разобраться просто методом тыка за пару минут. Отдельный плюс стабильность, ни зависаний, ни лагов за всё время использования не было. Ну и гибкость настроек прям радует, есть где развернуться под свои задачи.",
    name: "mkaddy",
    license: "Лицензия на 1 месяц",
  },
  {
    text: "Лучшее соотношение цены и наполнения по тг, работает стабильно, без сбоев и багов, понятный интерфейс, отзывчивая поддержка, использую не один год, за все время не было никаких проблем. Дает возможность оказывать огромный перечень услуг для клиентов, в большинстве случаев окупается одним заказом",
    name: "Spam",
    license: "Лицензия на 1 месяц",
  },
  {
    text: "Пользовался подобным софтом несколько лет назад, но из-за многочисленных багов решил уйти в кастомные решения. В этом году решил попробовать TelegramGeeks Pro и был удивлен стабильности работы. Теперь задачи выполняются в разы быстрее и проще.",
    name: "mulad",
    license: "Лицензия на 1 год",
  },
  {
    text: "Пользуюсь софтом с самого начала его создания. Хороший инструмент для бизнеса, большой функционал, легко разобраться (также много обучающего материала от админов). ТП всегда на связи. Постоянные обновления. Рекомендую!",
    name: "Maxler",
    license: "Лицензия на 1 месяц",
  },
  {
    text: "Второй год использую TelegranExpert. Функциональностью, ценами и стабильностью очень доволен. Рекомендую!",
    name: "yuri555",
    license: "Лицензия на 1 год",
  },
  {
    text: "Я работаю в сфере автоматизации Telegram и управления трафиком много лет, и TelegramGeeks Pro — честно один из самых стабильных и продуманных инструментов, которые я использовал. Софт отлично справляется с массовой рассылкой, приглашениями, управлением сессиями и фармингом аккаунтов — без случайных зависаний и сбоев. Больше всего впечатлила гибкость функционала и насколько интуитивно понятен интерфейс даже для сложных задач. Видно, что разработчики действительно понимают реальные рабочие процессы в Telegram. Обновления выходят часто, поддержка отвечает быстро, а общее качество постоянно улучшается. Если вы серьёзно настроены масштабировать операции в Telegram, минимизируя блокировки и обеспечивая безопасность аккаунтов, этот софт определённо того стоит.",
    name: "q0659588439",
    license: "Лицензия на 1 месяц",
  },
];

export default function ReviewsPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar locale="ru" />
      <main>
        <section className="relative overflow-hidden pt-20">
          <div className="absolute inset-0 pointer-events-none">
            <img src="/assets/theme/back-gradients/main-header.svg" alt="" className="w-full h-full object-cover opacity-30" />
          </div>
          <div className="absolute top-1/2 left-1/3 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px]" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative py-16 lg:py-24">
            <div className="text-center max-w-2xl mx-auto">
              <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-foreground mb-4">
                Отзывы
              </h1>
              <p className="text-muted-foreground text-lg">
                Что говорят наши клиенты о TelegramGeeks Pro
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
                  className="break-inside-avoid mb-5 rounded-xl border border-border bg-card p-6 hover:bg-white/[0.06] transition-colors"
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
                Расскажите нам, что вы думаете о нашем продукте
              </h2>
              <p className="text-muted-foreground text-sm mb-8">
                Ваш отзыв помогает нам становиться лучше
              </p>
              <form className="space-y-5 text-left">
                <div>
                  <label className="block text-sm text-muted-foreground mb-2">Оценка:</label>
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
                  <label className="block text-sm text-muted-foreground mb-2">Отзыв:</label>
                  <textarea
                    rows={5}
                    placeholder="Напишите ваш отзыв..."
                    className="w-full rounded-xl border border-border bg-muted px-4 py-3 text-sm text-foreground placeholder-white/30 focus:outline-none focus:border-primary/40 resize-none"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors"
                >
                  Отправить
                </button>
              </form>
            </div>
          </div>
        </section>
      </main>
      <Footer locale="ru" />
    </div>
  );
}
