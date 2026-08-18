import Link from "next/link";
import { Navbar } from "@/components/marketing/Navbar";
import { Footer } from "@/components/marketing/Footer";
import { ChevronRight, Sparkles, Clock, Gift, Users, MessageCircle, Star } from "lucide-react";

const reviews = [
  { name: "Макс", license: "1 year", text: "Спасибо за тест)" },
  { name: "Blake", license: "1 year", text: "Thanks for the test)" },
];

export default function DemoPage() {
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
              <Link href="/" className="hover:text-muted-foreground transition-colors">Home</Link>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="text-muted-foreground">Demo license</span>
            </nav>
            <div className="flex items-start gap-6">
              <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                <Sparkles className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground mb-3">
                  Free license for 24 hours
                </h1>
                <p className="text-muted-foreground max-w-2xl">
                  Try the Program for Free Before Purchase
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
                    You can use demo access to evaluate the program&apos;s capabilities in real working conditions. This will help you explore the interface, workflow logic and key product features in detail.
                  </p>

                  <h2 className="text-xl font-semibold text-foreground mt-8">What Do You Get During the Trial Period?</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    You will have access to all core modules of the program: explore the interface, test the main workflows and evaluate navigation convenience.
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    Demo access is activated at a convenient time for you and works for exactly 24 hours. This is enough to test the program in real working conditions.
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    If necessary, you can request additional modules for testing. They are provided upon request so you can evaluate exactly the tools that are important for your tasks.
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    After the demo period ends, you will be able to make an informed purchase decision based on your own experience using the program.
                  </p>

                  <h2 className="text-xl font-semibold text-foreground mt-8">How to Get Demo Access?</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    Submit a request on the website — and we will send you login details and instructions.
                  </p>
                </div>

                <div className="lg:col-span-2 lg:border-l border-border lg:pl-8">
                  <div className="rounded-xl border border-border bg-card p-6 text-center sticky top-28">
                    <div className="text-4xl font-bold text-primary mb-1">Free</div>
                    <p className="text-muted-foreground text-sm mb-6">Demo license</p>
                    <ul className="text-left space-y-3 mb-6">
                      <li className="flex items-start gap-2 text-sm text-muted-foreground"><Clock className="w-4 h-4 text-primary shrink-0 mt-0.5" />Access for 24 Hours</li>
                      <li className="flex items-start gap-2 text-sm text-muted-foreground"><Gift className="w-4 h-4 text-primary shrink-0 mt-0.5" />Educational materials</li>
                    </ul>
                    <a
                      href="/cart?type=product&lang=en&pid=2"
                      className="block w-full py-3 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors"
                    >
                      Submit a request
                    </a>
                    <p className="text-xs text-muted-foreground mt-3">Demo access is available for 24 hours. You can use the trial license only once.</p>
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
                      {r.name[0]}
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
                Join thousands of professionals who trust TelegramGeeks Pro for their promotion needs
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
