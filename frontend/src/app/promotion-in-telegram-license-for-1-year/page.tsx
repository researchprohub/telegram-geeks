import Link from "next/link";
import { Navbar } from "@/components/marketing/Navbar";
import { Footer } from "@/components/marketing/Footer";
import { ChevronRight, Check, ShoppingCart, MessageCircle, HeadphonesIcon, RefreshCw, Store, Star } from "lucide-react";

const features = [
  "Access to the private community chat",
  "Technical support",
  "Program updates",
  "Access to the marketplace",
];

const reviews = [
  { name: "mulad", license: "1 year", text: "Пользовался подобным софтом несколько лет назад, но из-за многочисленных багов решил уйти в кастомные решения. В этом году решил попробовать Telegram Geeks и был удивлен стабильности работы. Теперь задачи выполняются в разы быстрее и проще." },
  { name: "yuri555", license: "1 year", text: "Второй год использую TelegranExpert. Функциональностью, ценами и стабильностью очень доволен. Рекомендую!" },
];

export default function License1YearPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main>
        <section className="pt-28 pb-8 lg:pt-36 lg:pb-10 relative">
          <div className="absolute inset-0 pointer-events-none">
            <img src="/assets/theme/back-gradients/main-header.svg" alt="" className="w-full h-full object-cover opacity-20" />
          </div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
              <Link href="/" className="hover:text-foreground/70 transition-colors">Home</Link>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="text-foreground/70">License for 1 year</span>
            </nav>
            <div className="flex items-start gap-6">
              <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                <ShoppingCart className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground mb-3">
                  Promotion in Telegram with a license for 1 year
                </h1>
                <p className="text-muted-foreground max-w-2xl">
                  A 1-year license is the best option for regular use and long-term work.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="pb-16 lg:pb-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="rounded-2xl border border-border bg-gradient-to-br from-card to-transparent overflow-hidden">
              <div className="grid lg:grid-cols-5 gap-8 p-8 lg:p-12">
                <div className="lg:col-span-3 space-y-6">
                  <p className="text-muted-foreground leading-relaxed">
                    A 1-year license is the best option for regular use and long-term work. Throughout the entire period, you will have access to the core functionality of the program with the latest updates.
                  </p>

                  <h2 className="text-xl font-semibold text-foreground mt-8">Included with the license:</h2>
                  <ul className="space-y-3">
                    {features.map((f) => (
                      <li key={f} className="flex items-center gap-3 text-muted-foreground">
                        <Check className="w-4 h-4 text-primary shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>

                  <p className="text-muted-foreground text-sm mt-6">
                    Additional modules can be purchased separately if needed. You can explore the list of available additional modules in the &quot;Pricing&quot; section.
                  </p>
                </div>

                <div className="lg:col-span-2 lg:border-l border-border lg:pl-8">
                  <div className="rounded-xl border border-border bg-card p-6 text-center sticky top-28">
                    <div className="text-4xl font-bold text-foreground mb-1">550 <span className="text-lg text-muted-foreground">$</span></div>
                    <p className="text-muted-foreground text-sm mb-6">License for 1 year</p>
                    <ul className="text-left space-y-3 mb-6">
                      <li className="flex items-start gap-2 text-sm text-muted-foreground"><Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />Access for 1 year</li>
                      <li className="flex items-start gap-2 text-sm text-muted-foreground"><Store className="w-4 h-4 text-primary shrink-0 mt-0.5" />Account store</li>
                      <li className="flex items-start gap-2 text-sm text-muted-foreground"><RefreshCw className="w-4 h-4 text-primary shrink-0 mt-0.5" />Educational materials</li>
                      <li className="flex items-start gap-2 text-sm text-muted-foreground"><RefreshCw className="w-4 h-4 text-primary shrink-0 mt-0.5" />Free updates</li>
                      <li className="flex items-start gap-2 text-sm text-muted-foreground"><MessageCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />Access to customer chat (3000+)</li>
                      <li className="flex items-start gap-2 text-sm text-muted-foreground"><HeadphonesIcon className="w-4 h-4 text-primary shrink-0 mt-0.5" />Online support</li>
                    </ul>
                    <a
                      href="/cart?type=product&lang=en&pid=4"
                      className="block w-full py-3 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors"
                    >
                      Add to cart
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="pb-16 lg:pb-20 border-t border-border pt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3 mb-8">
              <Star className="w-5 h-5 text-primary" />
              <h2 className="text-2xl font-bold">Reviews</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              {reviews.map((r) => (
                <div key={r.name} className="rounded-xl border border-border bg-muted p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
                      {r.name[0].toUpperCase()}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-foreground">{r.name}</div>
                      <div className="text-xs text-muted-foreground">{r.license}</div>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">{r.text}</p>
                </div>
              ))}
            </div>
            <div className="mt-6 text-center">
              <Link href="/reviews" className="text-sm text-primary hover:underline">More reviews</Link>
            </div>
          </div>
        </section>

        <section className="py-16 lg:py-20 border-t border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mx-auto text-center">
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground mb-4">
                Professional software for fast channel growth
              </h2>
              <p className="text-muted-foreground mb-8">
                Join thousands of professionals who trust Telegram Geeks for their promotion needs
              </p>
              <Link
                href="/#price"
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors"
              >
                Buy a license <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
