import { Navbar } from "@/components/marketing/Navbar";
import { Footer } from "@/components/marketing/Footer";
import { ShoppingCart, Trash2, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function CartPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main>
        <section className="pt-28 pb-8 lg:pt-36 lg:pb-10 relative">
          <div className="absolute inset-0 pointer-events-none">
            <img src="/assets/theme/back-gradients/main-header.svg" alt="" className="w-full h-full object-cover opacity-20" />
          </div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="flex items-start gap-6">
              <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                <ShoppingCart className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground mb-3">Cart</h1>
                <p className="text-muted-foreground max-w-2xl">Your shopping cart is empty</p>
              </div>
            </div>
          </div>
        </section>

        <section className="pb-20">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="rounded-xl border border-border bg-muted p-12">
              <ShoppingCart className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-foreground mb-2">Your cart is empty</h2>
              <p className="text-muted-foreground text-sm mb-6">Looks like you haven&apos;t added any licenses yet</p>
              <Link href="/#price" className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors">
                <ArrowLeft className="w-4 h-4" />
                Browse licenses
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
