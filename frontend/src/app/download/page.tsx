import Link from "next/link";
import type { Metadata } from "next";
import { Navbar } from "@/components/marketing/Navbar";
import { Footer } from "@/components/marketing/Footer";
import {
  ChevronRight, Download as DownloadIcon, Monitor, Cpu, HardDrive, Wifi,
  ShieldCheck, Zap, CheckCircle2, Terminal, RefreshCw, KeyRound, ExternalLink,
  Laptop, Cloud, Sparkles, AlertCircle
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Download TelegramGeeks Pro for Windows (Official Desktop App)",
  description:
    "Download TelegramGeeks Pro Windows Desktop Client. 77+ MTProto automation modules, hardware DPAPI encryption, TData 2-way converter, and zero cloud lock-in.",
  keywords: "download telegram geeks, telegram automation software windows, telegram desktop bot, tdata converter download",
  openGraph: {
    title: "Download TelegramGeeks Pro — Windows Desktop Automation Studio",
    description: "Official Windows Desktop Suite with 77+ MTProto modules, local DPAPI encryption, and AI persona warming.",
    images: ["/assets/hero/screenshot.png"],
  },
};

const systemRequirements = [
  { icon: Monitor, label: "Operating System", value: "Windows 10 / 11 (64-bit)" },
  { icon: Cpu, label: "Processor", value: "Intel Core i3 / AMD Ryzen 3 or higher" },
  { icon: HardDrive, label: "Memory (RAM)", value: "4 GB RAM (8 GB recommended for 100+ accounts)" },
  { icon: HardDrive, label: "Disk Space", value: "500 MB free storage" },
  { icon: Wifi, label: "Network", value: "Stable Broadband or 4G/5G mobile connection" },
  { icon: Terminal, label: "Runtime", value: "Microsoft WebView2 / .NET Runtime (Bundled)" },
];

const desktopVsCloudFeatures = [
  { feature: "77 MTProto Automation Modules", web: true, desktop: true },
  { feature: "Autonomous AI Persona Warming", web: true, desktop: true },
  { feature: "Unified Account & Lead Management", web: true, desktop: true },
  { feature: "Hardware DPAPI Token Encryption", web: false, desktop: true },
  { feature: "Offline Standalone Local SQLite", web: false, desktop: true },
  { feature: "High-Concurrency Raw Socket Pooling", web: "Cloud Tier", desktop: "Unlimited Local" },
  { feature: "Zero Cloud Data Leak Risk", web: "Encrypted Cloud", desktop: "100% On-Device" },
];

export default function DownloadPage() {
  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/20 selection:text-primary">
      <Navbar />

      <main className="pt-24 pb-20 lg:pt-32 lg:pb-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* ── Breadcrumb ── */}
          <nav className="flex items-center gap-2 text-xs text-muted-foreground mb-8">
            <Link href="/" className="hover:text-primary transition-colors">Home</Link>
            <ChevronRight className="w-3.5 h-3.5 opacity-50" />
            <span className="text-foreground font-medium">Download Windows Desktop Suite</span>
          </nav>

          {/* ── Top Hero & Primary Download Card ── */}
          <div className="rounded-3xl border border-border bg-gradient-to-b from-card/90 via-card/50 to-background p-8 lg:p-12 shadow-2xl relative overflow-hidden mb-16">
            <div className="absolute top-0 right-0 w-[500px] height-[500px] bg-primary/10 rounded-full blur-3xl pointer-events-none -mr-40 -mt-40" />
            
            <div className="grid lg:grid-cols-12 gap-10 items-center relative z-10">
              
              {/* Left Column: Software Overview & CTA */}
              <div className="lg:col-span-7 space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-xs font-bold text-primary">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Version 2.4.0 Official Release • 64-bit Native</span>
                </div>

                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-foreground leading-[1.15]">
                  Telegram<span className="text-primary text-glow-primary">Geeks Pro</span> for Windows
                </h1>

                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-xl">
                  Deploy the ultimate standalone desktop automation workstation. Built with hardware-bound DPAPI encryption, embedded high-speed SQLite, and direct socket MTProto concurrency.
                </p>

                {/* Primary Download Buttons */}
                <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                  <a
                    href="/downloads/TelegramGeeks-Pro-v2.4.0-Windows-x64.zip"
                    download="TelegramGeeks-Pro-v2.4.0-Windows-x64.zip"
                    className="inline-flex items-center justify-center gap-3 px-8 py-4 rounded-xl bg-primary text-black font-extrabold text-sm hover:bg-cyan-300 transition-all shadow-lg shadow-primary/25 hover:shadow-primary/40 group"
                  >
                    <DownloadIcon className="w-5 h-5 group-hover:translate-y-0.5 transition-transform" />
                    <span>Download Windows Release (.zip / .exe)</span>
                  </a>

                  <a
                    href="/downloads/TelegramGeeks-Pro-v2.4.0-Windows-x64.zip"
                    download="TelegramGeeks-Pro-v2.4.0-Windows-x64.zip"
                    className="inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl border border-border bg-secondary/60 text-foreground text-sm font-semibold hover:bg-secondary hover:border-primary/40 transition"
                  >
                    <HardDrive className="w-4 h-4 text-primary" />
                    <span>Portable Standalone</span>
                  </a>
                </div>

                {/* Account Sync Reassurance Callout */}
                <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 flex items-start gap-3 text-xs leading-relaxed text-foreground/90">
                  <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-primary font-bold">Unified Account Login: </strong>
                    Your Web App account credentials (<code className="font-mono text-primary">email & password</code>) work seamlessly on the Windows Desktop App. All active sessions, campaigns, and licenses sync automatically!
                  </div>
                </div>

                {/* Build Specifications Pill */}
                <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground pt-1">
                  <span>Size: <strong>~98 MB</strong></span>
                  <span>•</span>
                  <span>Updated: <strong>March 2026</strong></span>
                  <span>•</span>
                  <span>SHA256: <strong className="font-mono text-[11px]">e8f29...c4b1</strong></span>
                </div>
              </div>

              {/* Right Column: Workstation Preview Mockup */}
              <div className="lg:col-span-5 relative">
                <div className="rounded-2xl border border-white/[0.12] bg-[#05080f] shadow-2xl p-2 overflow-hidden group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/assets/hero/screenshot.png"
                    alt="TelegramGeeks Pro Windows Desktop UI"
                    className="rounded-xl w-full h-auto object-cover group-hover:scale-102 transition-transform duration-500"
                  />
                </div>
                <div className="mt-3 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                  <span>Digitally Signed & Virus-Free Verified</span>
                </div>
              </div>

            </div>
          </div>

          {/* ── 3-Step Quick Start Guide ── */}
          <section className="mb-16">
            <div className="text-center max-w-2xl mx-auto mb-10">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                How to Install & Get Started
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground mt-2">
                Up and running in less than 2 minutes on your Windows workstation
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 rounded-2xl border border-border bg-card/60 shadow-lg relative">
                <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/25 flex items-center justify-center text-primary font-black text-sm mb-4">
                  1
                </div>
                <h3 className="font-bold text-base text-foreground mb-2">Download & Run Setup</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Download <code className="text-primary font-mono">TelegramGeeks-Pro-Setup.exe</code> and run the installer. Follow the standard Windows installation wizard.
                </p>
              </div>

              <div className="p-6 rounded-2xl border border-border bg-card/60 shadow-lg relative">
                <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/25 flex items-center justify-center text-primary font-black text-sm mb-4">
                  2
                </div>
                <h3 className="font-bold text-base text-foreground mb-2">Sign in with Web Account</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Launch the application and enter the exact same email & password used on your web dashboard. Your license activates automatically.
                </p>
              </div>

              <div className="p-6 rounded-2xl border border-border bg-card/60 shadow-lg relative">
                <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/25 flex items-center justify-center text-primary font-black text-sm mb-4">
                  3
                </div>
                <h3 className="font-bold text-base text-foreground mb-2">Start MTProto Automation</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Import your TData sessions or register virtual SIMs, attach your 4G mobile proxies, and launch scraping or outreach campaigns.
                </p>
              </div>
            </div>
          </section>

          {/* ── Web Cloud vs Windows Desktop Feature Matrix ── */}
          <section className="mb-16">
            <div className="text-center max-w-2xl mx-auto mb-10">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                Dual Execution: Web Cloud vs Windows Desktop
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground mt-2">
                Use whichever client suits your workflow — or use both simultaneously!
              </p>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-border bg-card/60 shadow-xl">
              <table className="w-full text-left text-xs sm:text-sm border-collapse">
                <thead className="bg-secondary/80 text-foreground font-bold border-b border-border">
                  <tr>
                    <th className="px-6 py-4 uppercase tracking-wider text-[11px] text-muted-foreground">Feature / Capability</th>
                    <th className="px-6 py-4 uppercase tracking-wider text-[11px] text-muted-foreground text-center">Web Cloud Dashboard</th>
                    <th className="px-6 py-4 uppercase tracking-wider text-[11px] text-primary text-center">Windows Desktop Workstation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {desktopVsCloudFeatures.map((row, idx) => (
                    <tr key={idx} className="hover:bg-secondary/30 transition-colors">
                      <td className="px-6 py-3.5 font-medium text-foreground">{row.feature}</td>
                      <td className="px-6 py-3.5 text-center">
                        {typeof row.web === "boolean" ? (
                          row.web ? <CheckCircle2 className="w-4 h-4 text-primary mx-auto" /> : <span className="text-muted-foreground">—</span>
                        ) : (
                          <span className="text-muted-foreground font-medium">{row.web}</span>
                        )}
                      </td>
                      <td className="px-6 py-3.5 text-center font-bold text-primary">
                        {typeof row.desktop === "boolean" ? (
                          row.desktop ? <CheckCircle2 className="w-4 h-4 text-primary mx-auto" /> : <span className="text-muted-foreground">—</span>
                        ) : (
                          <span className="text-primary">{row.desktop}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* ── System Requirements ── */}
          <section className="mb-16">
            <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-6 text-center">
              System & Hardware Requirements
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {systemRequirements.map((req, idx) => {
                const Icon = req.icon;
                return (
                  <div key={idx} className="p-4 rounded-xl border border-border bg-card/40 flex items-center gap-3.5">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">{req.label}</div>
                      <div className="text-xs sm:text-sm font-bold text-foreground">{req.value}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* ── FAQ & Support ── */}
          <section className="p-8 rounded-3xl border border-border bg-card/60 max-w-4xl mx-auto">
            <h3 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-primary" />
              <span>Frequently Asked Download & Licensing Questions</span>
            </h3>

            <div className="space-y-4 text-xs sm:text-sm leading-relaxed">
              <div className="border-b border-border pb-4">
                <h4 className="font-bold text-foreground mb-1">Will my Web App account work directly on the Windows App?</h4>
                <p className="text-muted-foreground">
                  <strong>Yes, absolutely.</strong> Your email, password, active license tier, campaigns, and saved sessions are 100% unified. You can log into both Web and Desktop with the same account.
                </p>
              </div>

              <div className="border-b border-border pb-4">
                <h4 className="font-bold text-foreground mb-1">Can I run the Windows app offline or without cloud connection?</h4>
                <p className="text-muted-foreground">
                  Yes. The Windows Desktop Suite has an embedded local SQLite engine that operates completely on your physical machine with hardware DPAPI encryption.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-foreground mb-1">How do software updates work?</h4>
                <p className="text-muted-foreground">
                  The Windows Desktop client has an integrated auto-updater that verifies new releases directly from our secure servers and applies patches in seconds without losing your session database.
                </p>
              </div>
            </div>
          </section>

        </div>
      </main>

      <Footer />
    </div>
  );
}
