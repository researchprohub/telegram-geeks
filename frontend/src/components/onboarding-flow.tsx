"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Users, Zap, Bot, ArrowRight, CheckCircle2, Sparkles } from "lucide-react";

const STEPS = [
  {
    title: "Welcome to TelegramGeeks Pro",
    desc: "Your all-in-one Telegram engagement platform. Manage accounts, run campaigns, and automate growth.",
    icon: Sparkles,
    color: "from-blue-500 to-violet-500",
  },
  {
    title: "Add Accounts",
    desc: "Upload your Telegram session files or create new accounts. We'll handle health checks and warm-up.",
    icon: Users,
    color: "from-green-500 to-emerald-500",
  },
  {
    title: "Create Campaigns",
    desc: "Launch engagement campaigns, invite users, or send messages — all with human-like behavior patterns.",
    icon: Zap,
    color: "from-amber-500 to-orange-500",
  },
  {
    title: "Explore Modules",
    desc: "Access 45+ automation tools: autoresponder, audience collector, content generation, and more.",
    icon: Bot,
    color: "from-purple-500 to-pink-500",
  },
];

export default function OnboardingFlow() {
  const router = useRouter();
  const [show, setShow] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const done = localStorage.getItem("onboarding_done");
    if (!done) setShow(true);
  }, []);

  function finish() {
    localStorage.setItem("onboarding_done", "true");
    setShow(false);
  }

  function dismiss() {
    localStorage.setItem("onboarding_done", "1");
    setShow(false);
  }

  function handleNav(target: string) {
    finish();
    router.push(target);
  }

  if (!show) return null;

  const s = STEPS[step];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Progress */}
        <div className="flex gap-1 px-6 pt-6">
          {STEPS.map((_, i) => (
            <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${i <= step ? "bg-primary" : "bg-secondary"}`} />
          ))}
        </div>

        <div className="px-6 py-6 text-center">
          <div className={`inline-flex h-16 w-16 rounded-2xl bg-gradient-to-br ${s.color} items-center justify-center mb-4`}>
            <s.icon className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">{s.title}</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
        </div>

        <div className="px-6 pb-6 space-y-2">
          {step < STEPS.length - 1 ? (
            <Button className="w-full" onClick={() => setStep(step + 1)}>
              Next
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <div className="space-y-2">
              <Button className="w-full" onClick={() => handleNav("/dashboard/accounts/upload")}>
                <Users className="h-4 w-4 mr-1" />
                Add My First Accounts
              </Button>
              <Button className="w-full" variant="outline" onClick={finish}>
                <CheckCircle2 className="h-4 w-4 mr-1" />
                Go to Dashboard
              </Button>
            </div>
          )}
          <button onClick={dismiss} className="w-full text-xs text-muted-foreground hover:text-foreground py-1 transition-colors">
            Skip tutorial
          </button>
        </div>
      </div>
    </div>
  );
}
