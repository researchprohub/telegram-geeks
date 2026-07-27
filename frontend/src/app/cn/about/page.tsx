"use client";

import { motion } from "framer-motion";
import { Navbar } from "@/components/marketing/Navbar";
import { Footer } from "@/components/marketing/Footer";
import AnimatedSection from "@/components/marketing/AnimatedSection";
import {
  Info, Shield, Users, Feather, Zap, Globe, Search, MessageCircle,
  UserPlus, Bot, Send, Hash, FileJson, BarChart3, BookOpen
} from "lucide-react";

const features = [
  { icon: Shield, title: "安全可靠", desc: "为您的账户和数据提供高级保护" },
  { icon: Users, title: "专业团队", desc: "拥有多年Telegram营销经验的专业团队" },
  { icon: Feather, title: "稳定可靠", desc: "稳定运行，定期更新" },
  { icon: Zap, title: "高速高效", desc: "适用于任何任务的高性能模块" },
  { icon: Globe, title: "全球覆盖", desc: "全球客户信赖的Telegram推广工具" },
];

const moduleCategories = [
  { icon: Search, title: "受众收集", desc: "从群组、频道和评论中提取成员。按地理位置、语言和活动筛选。全局搜索整个Telegram。" },
  { icon: MessageCircle, title: "消息发送与自动化", desc: "支持spintax和变量的批量消息发送、自动回复、自动发布、转发器、拦截器、频道评论和GPT短信。" },
  { icon: UserPlus, title: "邀请系统", desc: "五种邀请方式 — 按ID、用户名、手机号、联系人或管理员权限。智能限速和封禁自动停止。" },
  { icon: Zap, title: "账户增长", desc: "浏览量提升、反应提升、账户预热（30天渐进计划）、批量订阅和机器人推荐。" },
  { icon: Bot, title: "注册与会话", desc: "通过短信服务自动批量注册、QR登录、会话导入/导出和设备参数生成。" },
  { icon: FileJson, title: "克隆与迁移", desc: "克隆整个聊天和频道及媒体内容。跨设备复制会话。支持词语替换的消息转发。" },
  { icon: Hash, title: "管理工具", desc: "批量检查、文件夹管理、代理检查器、机器人/聊天创建、管理员管理和控制台日志。" },
  { icon: BarChart3, title: "分析与报告", desc: "活动报告含成功率、错误追踪和跨账户性能比较。" },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar locale="cn" />
      <main>
        <section className="pt-28 pb-8 lg:pt-36 lg:pb-10 relative">
          <div className="absolute inset-0 pointer-events-none">
            <img src="/assets/theme/back-gradients/main-header.svg" alt="" className="w-full h-full object-cover opacity-20" />
          </div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="flex items-start gap-6">
              <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                <Info className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground mb-3">关于我们</h1>
                <p className="text-muted-foreground max-w-2xl">
                  我们是一支专业团队，致力于为Telegram营销和推广提供最佳工具
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="pb-16 lg:pb-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <AnimatedSection>
            <div className="max-w-3xl mx-auto space-y-6 text-muted-foreground leading-relaxed mb-14">
              <p>
                Telegram Geeks 是一款全方位的 Telegram 营销平台，提供自动化账户注册、高级受众定位、批量消息发送和全面的账户管理工具。
              </p>
              <p>
                我们的软件包含 <strong className="text-foreground/80">49个模块</strong>，覆盖8大类别 —
                从受众收集和批量消息发送到账户预热、频道克隆和活动分析。每个模块都专为真实Telegram自动化设计，受到全球营销专业人士的信赖。
              </p>
              <p>
                我们与合作伙伴已合作多年。客户积极使用我们的软件，并对质量和可靠性非常满意。功能覆盖所有需求，运行完美。
              </p>
            </div>
            </AnimatedSection>

            <AnimatedSection delay={0.1}>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-14">
              {features.map((f, i) => (
                <motion.div
                  key={f.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ delay: i * 0.08, duration: 0.35 }}
                  whileHover={{ y: -4 }}
                  className="rounded-xl border border-border bg-muted p-6 hover:border-primary/20 hover:bg-primary/5 transition-colors"
                >
                  <f.icon className="w-5 h-5 text-primary mb-3" />
                  <h3 className="font-semibold text-foreground mb-1">{f.title}</h3>
                  <p className="text-sm text-muted-foreground">{f.desc}</p>
                </motion.div>
              ))}
            </div>
            </AnimatedSection>

            <AnimatedSection delay={0.2}>
            <h2 className="text-2xl font-bold text-foreground mb-8 text-center">我们的产品</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {moduleCategories.map((cat, i) => (
                <motion.div
                  key={cat.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ delay: i * 0.06, duration: 0.35 }}
                  whileHover={{ y: -4, scale: 1.01 }}
                  className="rounded-xl border border-border bg-card p-6 hover:border-primary/20 transition-all"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                      <cat.icon className="w-4 h-4 text-primary" />
                    </div>
                    <h3 className="font-semibold text-foreground">{cat.title}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{cat.desc}</p>
                </motion.div>
              ))}
            </div>
            </AnimatedSection>
          </div>
        </section>
      </main>
      <Footer locale="cn" />
    </div>
  );
}
