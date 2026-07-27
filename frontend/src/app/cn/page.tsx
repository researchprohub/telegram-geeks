import Link from "next/link";
import { Navbar } from "@/components/marketing/Navbar";
import { Footer } from "@/components/marketing/Footer";
import { PartnerLogos } from "@/components/marketing/PartnerLogos";
import { ReviewsSection } from "@/components/marketing/ReviewsSection";
import { FaqSection } from "@/components/marketing/FaqSection";
import ModuleExplorer from "@/components/marketing/ModuleExplorer";
import AnimatedSection from "@/components/marketing/AnimatedSection";
import { ArrowRight, Gift, Users, Globe, MessageCircle, Search, Hash, FileJson, UserPlus, Plus, FileText, Send, Zap, Target, Shield, BookOpen, Settings } from "lucide-react";

const topFeatures = [
  { icon: Gift, title: "6年以上", desc: "行业经验" },
  { icon: MessageCircle, title: "私密社群", desc: "专属社区" },
  { icon: Globe, title: "10000+客户", desc: "遍布全球" },
  { icon: MessageCircle, title: "技术支持", desc: "24/7" },
];

const featureGroups: { icon: any; label: string; desc: string }[][] = [
  [
    { icon: Search, label: "搜索群组和频道", desc: "按关键词查找任何群组或频道" },
    { icon: Globe, label: "网络账户", desc: "通过浏览器访问账户" },
    { icon: FileJson, label: "JSON生成器", desc: "生成注册所需的设备参数" },
    { icon: UserPlus, label: "批量订阅和取消订阅", desc: "批量管理频道订阅" },
    { icon: Hash, label: "创建群组和频道", desc: "大规模创建群组、超级群组和频道" },
  ],
  [
    { icon: Zap, label: "创建机器人", desc: "自动注册和配置Telegram机器人" },
    { icon: FileText, label: "创建帖子 (PostBot)", desc: "设计带按钮和媒体的交互帖子" },
    { icon: Users, label: "收集受众", desc: "从群组和频道中提取成员" },
    { icon: MessageCircle, label: "收集群成员", desc: "从任何聊天中提取成员列表" },
    { icon: FileText, label: "从账户收集", desc: "从账户收集联系人和对话" },
    { icon: Search, label: "链接检测", desc: "大规模验证链接有效性" },
  ],
  [
    { icon: MessageCircle, label: "从评论收集", desc: "提取频道帖子的评论者" },
    { icon: Globe, label: "全局搜索", desc: "搜索整个Telegram用户和频道数据库" },
    { icon: FileJson, label: "合并数据库", desc: "合并多个用户数据库" },
    { icon: FileJson, label: "排除数据库", desc: "去重和过滤受众" },
    { icon: Users, label: "性别检测", desc: "从Telegram资料中识别性别" },
    { icon: UserPlus, label: "邀请受众", desc: "邀请收集的用户加入群组" },
  ],
  [
    { icon: UserPlus, label: "按ID邀请", desc: "通过Telegram ID添加用户" },
    { icon: UserPlus, label: "按手机号邀请", desc: "通过手机号邀请用户" },
    { icon: UserPlus, label: "按联系人邀请", desc: "从手机联系人邀请" },
    { icon: Send, label: "短信群发 (GPT)", desc: "通过AI生成内容发送短信" },
    { icon: MessageCircle, label: "频道评论", desc: "从多个账户发布评论" },
    { icon: Send, label: "按ID发送", desc: "通过Telegram ID发送私信" },
  ],
];

const plans = [
  { name: "演示版", price: "免费", period: "", popular: false, features: ["24小时访问", "基础功能", "账户数量有限", "学习资料"] },
  { name: "1个月", price: "$120", period: "/月", popular: false, features: ["30天访问", "所有基础模块", "账户商店", "客户聊天", "在线支持", "免费更新"] },
  { name: "1年", price: "$550", period: "/年", popular: true, features: ["365天访问", "所有基础模块", "账户商店", "客户聊天 (3000+)", "优先支持", "免费更新", "最佳性价比"] },
  { name: "2年", price: "$1,050", period: "/2年", popular: false, features: ["730天访问", "所有基础模块", "账户商店", "客户聊天 (3000+)", "优先支持", "免费更新", "节省20%"] },
  { name: "3年", price: "$1,350", period: "/3年", popular: false, features: ["1095天访问", "所有基础模块", "账户商店", "专属支持", "免费更新", "Pro模块折扣", "节省38%"] },
];

export default function CNPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar locale="cn" />
      <main>
        {/* ── Hero ── */}
        <section className="relative min-h-[100dvh] flex items-center overflow-hidden pt-20">
          <div className="absolute inset-0 pointer-events-none">
            <img src="/assets/theme/back-gradients/main-header.svg" alt="" className="w-full h-full object-cover opacity-30" />
          </div>
          <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px]" />
          <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[100px]" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full relative z-10">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <a href="https://www.youtube.com/watch?v=9Vf4twPRhUI" target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-accent text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors mb-6">
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                  视频介绍
                </a>
                <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tighter leading-none mb-6 text-foreground">
                  Telegram Geeks
                </h1>
                <p className="text-base sm:text-lg text-muted-foreground max-w-xl leading-relaxed mb-8">
                  全面的Telegram推广工具集：从注册、群发、邀请到账户预热、聊天管理和精准会话操作
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Link href="/#price" className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors">
                    购买 <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link href="/demo" className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-colors text-sm">
                    演示访问
                  </Link>
                </div>
              </div>
              <div className="hidden lg:block">
                <div className="relative">
                  <div className="absolute -inset-4 bg-gradient-to-tr from-primary/10 via-transparent to-transparent rounded-2xl blur-xl" />
                  <div className="relative rounded-2xl border border-border bg-gradient-to-br from-card to-transparent overflow-hidden">
                    <img
                      src="/assets/hero/screenshot.png"
                      alt="Telegram Geeks 界面"
                      className="w-full h-auto object-cover"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <PartnerLogos />

        {/* ── Top Features ── */}
        <section className="py-10 border-b border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {topFeatures.map((feat) => (
                <div key={feat.title} className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center shrink-0">
                    <feat.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-foreground">{feat.title}</div>
                    <div className="text-xs text-muted-foreground">{feat.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Welcome ── */}
        <section className="py-16 lg:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <AnimatedSection>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="rounded-xl border border-border bg-muted p-8 lg:p-10">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-5">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="hsl(var(--primary))" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 2L11 13" /><path d="M22 2L15 22L11 13L2 9L22 2Z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-foreground mb-4">欢迎！</h2>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                  如今，几乎所有在 <strong className="text-foreground/80">Telegram</strong> 上推广项目或服务的人都听说过我们，许多人已经加入了我们的社区。
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  批量消息、刷量、群组邀请以及其他获取流量的方式，都可以通过 <strong className="text-foreground/80">Telegram Geeks</strong> 实现！
                </p>
              </div>
              <div className="rounded-xl border border-border bg-muted p-8 lg:p-10">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center">
                    <MessageCircle className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider">品牌</div>
                    <div className="text-sm font-semibold text-foreground">Sphere.Chat</div>
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-foreground mb-4">我们是 BLB Team</h2>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                  我们提供的不仅仅是软件，而是进入专业人士私密社区、知识库和真实Telegram自动化案例的通道。
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed mb-5">
                  我们的用户可以访问加密通讯软件 <strong className="text-foreground/80">Sphere.chat</strong>，该平台拥有5000+用户，每个人都在使用 <strong className="text-foreground/80">Telegram Geeks</strong>！
                </p>
                <a href="https://sphere.chat/" target="_blank" rel="nofollow noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors">
                  注册 <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            </div>
            </AnimatedSection>
          </div>
        </section>

        <ModuleExplorer locale="cn" />

        {/* ── Modules Showcase ── */}
        <section className="border-t border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-tr from-primary/5 via-primary/[0.02] to-transparent rounded-3xl blur-2xl pointer-events-none" />
              <img
                src="/assets/landing/modules-showcase.jpg"
                alt="Telegram Geeks 模块界面"
                className="relative w-full h-auto rounded-2xl border border-border shadow-2xl"
              />
            </div>
          </div>
        </section>

        {/* ── Pricing ── */}
        <section id="price" className="py-16 lg:py-20 border-t border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <AnimatedSection>
            <div className="text-center max-w-2xl mx-auto mb-14">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-4">购买许可证</h2>
            </div>
            </AnimatedSection>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              {plans.map((plan) => (
                <div key={plan.name} className={`relative rounded-xl border p-6 flex flex-col ${plan.popular ? "border-primary/40 bg-primary/5 shadow-lg shadow-primary/5" : "border-border bg-muted"}`}>
                  {plan.popular && <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-primary text-xs font-semibold text-primary-foreground whitespace-nowrap">最佳性价比</div>}
                  <div className="mb-5">
                    <h3 className="font-semibold text-base text-foreground mb-1">{plan.name}</h3>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-bold text-foreground">{plan.price}</span>
                      {plan.period && <span className="text-xs text-muted-foreground">{plan.period}</span>}
                    </div>
                  </div>
                  <ul className="space-y-2 mb-6 flex-1">
                    {plan.features.map((feat) => (
                      <li key={feat} className="flex items-start gap-2 text-xs text-muted-foreground">
                        <svg className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                        {feat}
                      </li>
                    ))}
                  </ul>
                  <Link href={plan.price === "免费" ? "/demo" : "/register"}
                    className={`flex items-center justify-center gap-2 w-full py-2.5 rounded-lg text-sm font-medium transition-colors ${plan.popular ? "bg-primary text-primary-foreground hover:bg-primary/90" : "border border-border text-muted-foreground hover:text-foreground hover:bg-accent"}`}>
                    {plan.price === "免费" ? "获取" : "购买"} <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        <ReviewsSection locale="cn" />

        {/* ── Demo CTA ── */}
        <AnimatedSection>
        <section className="py-16 lg:py-20 border-t border-border relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-transparent pointer-events-none" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
            <div className="max-w-2xl mx-auto text-center">
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground mb-4">
                试用演示版 &mdash; 确认这款软件适合您！
              </h2>
              <p className="text-muted-foreground mb-8">立即开始使用，亲眼见证效果</p>
              <Link href="/demo" className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors">
                提交申请 <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>
        </AnimatedSection>

        <FaqSection locale="cn" />
      </main>
      <Footer locale="cn" />
    </div>
  );
}
