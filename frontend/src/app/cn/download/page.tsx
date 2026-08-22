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
  title: "下载 TelegramGeeks Pro Windows 桌面客户端 (官方版)",
  description: "下载 TelegramGeeks Pro Windows 桌面端。77+ MTProto 自动化模块、硬件 DPAPI 加密、TData 双向转换，零云端锁定。",
};

const systemRequirements = [
  { icon: Monitor, label: "操作系统", value: "Windows 10 / 11 (64位)" },
  { icon: Cpu, label: "处理器", value: "Intel Core i3 / AMD Ryzen 3 或更高" },
  { icon: HardDrive, label: "内存 (RAM)", value: "4 GB RAM (管理100+账号推荐 8 GB)" },
  { icon: HardDrive, label: "存储空间", value: "500 MB 可用空间" },
  { icon: Wifi, label: "网络", value: "稳定的宽带或 4G/5G 移动网络" },
  { icon: Terminal, label: "运行环境", value: "Microsoft WebView2 / .NET Runtime (内置)" },
];

export default function DownloadPage() {
  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/20 selection:text-primary">
      <Navbar locale="cn" />

      <main className="pt-24 pb-20 lg:pt-32 lg:pb-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* ── 面包屑 ── */}
          <nav className="flex items-center gap-2 text-xs text-muted-foreground mb-8">
            <Link href="/cn" className="hover:text-primary transition-colors">首页</Link>
            <ChevronRight className="w-3.5 h-3.5 opacity-50" />
            <span className="text-foreground font-medium">下载 Windows 桌面端</span>
          </nav>

          {/* ── 顶部下载卡片 ── */}
          <div className="rounded-3xl border border-border bg-gradient-to-b from-card/90 via-card/50 to-background p-8 lg:p-12 shadow-2xl relative overflow-hidden mb-16">
            <div className="absolute top-0 right-0 w-[500px] height-[500px] bg-primary/10 rounded-full blur-3xl pointer-events-none -mr-40 -mt-40" />
            
            <div className="grid lg:grid-cols-12 gap-10 items-center relative z-10">
              
              <div className="lg:col-span-7 space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-xs font-bold text-primary">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>版本 2.4.0 官方正式版 • 64位原生</span>
                </div>

                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-foreground leading-[1.15]">
                  Telegram<span className="text-primary text-glow-primary">Geeks Pro</span> Windows 客户端
                </h1>

                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-xl">
                  部署顶级独立桌面自动化工作站。集成硬件绑定 DPAPI 加密、内置极速 SQLite 引擎与原生 MTProto 套接字并发。
                </p>

                {/* 下载按钮 */}
                <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                  <a
                    href="/downloads/TelegramGeeks-Pro-v2.4.0-Windows-x64.zip"
                    download="TelegramGeeks-Pro-v2.4.0-Windows-x64.zip"
                    className="inline-flex items-center justify-center gap-3 px-8 py-4 rounded-xl bg-primary text-black font-extrabold text-sm hover:bg-cyan-300 transition-all shadow-lg shadow-primary/25 hover:shadow-primary/40 group"
                  >
                    <DownloadIcon className="w-5 h-5 group-hover:translate-y-0.5 transition-transform" />
                    <span>下载 Windows 完整发行版 (.zip / .exe)</span>
                  </a>

                  <a
                    href="/downloads/TelegramGeeks-Pro-v2.4.0-Windows-x64.zip"
                    download="TelegramGeeks-Pro-v2.4.0-Windows-x64.zip"
                    className="inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl border border-border bg-secondary/60 text-foreground text-sm font-semibold hover:bg-secondary hover:border-primary/40 transition"
                  >
                    <HardDrive className="w-4 h-4 text-primary" />
                    <span>便携免安装版 (.zip)</span>
                  </a>
                </div>

                {/* 统一账号提示 */}
                <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 flex items-start gap-3 text-xs leading-relaxed text-foreground/90">
                  <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-primary font-bold">统一账号登录：</strong>
                    您在网页版注册的账号（邮箱与密码）可直接登录 Windows 桌面端。您的授权套餐、活跃会话和营销任务自动同步！
                  </div>
                </div>
              </div>

              {/* 预览图 */}
              <div className="lg:col-span-5 relative">
                <div className="rounded-2xl border border-white/[0.12] bg-[#05080f] shadow-2xl p-2 overflow-hidden group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/assets/hero/screenshot.png"
                    alt="TelegramGeeks Pro Windows 桌面界面"
                    className="rounded-xl w-full h-auto object-cover group-hover:scale-102 transition-transform duration-500"
                  />
                </div>
                <div className="mt-3 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                  <span>数字签名认证 • 100% 安全无毒</span>
                </div>
              </div>

            </div>
          </div>

          {/* ── 快速开始 ── */}
          <section className="mb-16">
            <div className="text-center max-w-2xl mx-auto mb-10">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                如何安装与使用
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground mt-2">
                2分钟内即可在 Windows 工作站上开始运行
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 rounded-2xl border border-border bg-card/60 shadow-lg">
                <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/25 flex items-center justify-center text-primary font-black text-sm mb-4">
                  1
                </div>
                <h3 className="font-bold text-base text-foreground mb-2">下载并运行安装包</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  下载安装程序，按提示完成安装。
                </p>
              </div>

              <div className="p-6 rounded-2xl border border-border bg-card/60 shadow-lg">
                <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/25 flex items-center justify-center text-primary font-black text-sm mb-4">
                  2
                </div>
                <h3 className="font-bold text-base text-foreground mb-2">使用网页版账号登录</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  启动应用，输入您在网页版注册的邮箱与密码，系统将自动激活您的授权。
                </p>
              </div>

              <div className="p-6 rounded-2xl border border-border bg-card/60 shadow-lg">
                <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/25 flex items-center justify-center text-primary font-black text-sm mb-4">
                  3
                </div>
                <h3 className="font-bold text-base text-foreground mb-2">开启 MTProto 自动化</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  导入 TData 会话或绑定 4G 代理，立即启动批量采集、养号与群发任务。
                </p>
              </div>
            </div>
          </section>

          {/* ── 系统要求 ── */}
          <section className="mb-16">
            <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-6 text-center">
              系统与硬件要求
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

        </div>
      </main>

      <Footer locale="cn" />
    </div>
  );
}
