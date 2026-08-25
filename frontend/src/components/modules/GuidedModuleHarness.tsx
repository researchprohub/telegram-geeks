"use client";

import { useState } from "react";
import {
  HelpCircle, Shield, CheckCircle2, AlertTriangle, ArrowRight,
  ArrowLeft, Sparkles, BookOpen, Lightbulb, Compass, Sliders,
  Check, Info, Flame, Eye, Lock
} from "lucide-react";

export interface GuidedStep {
  title: string;
  description: string;
  component: React.ReactNode;
  isValid?: boolean;
}

export interface GuidedPreset {
  id: string;
  name: string;
  badge: string;
  description: string;
  delayRange: [number, number];
  dailyLimit: number;
  useSpintax: boolean;
  recommendedFor: string;
}

export interface GuidedModuleHarnessProps {
  moduleName: string;
  moduleCategory: string;
  moduleDescription: string;
  safetyLimits: {
    recommendedDailyPerAccount: number;
    hardMaxDailyPerAccount: number;
    recommendedDelaySeconds: number;
    cooldownPeriodMinutes: number;
    spintaxMandatory?: boolean;
  };
  keyTips: string[];
  steps: GuidedStep[];
  presets?: GuidedPreset[];
  activeStep: number;
  onStepChange: (step: number) => void;
  onApplyPreset?: (preset: GuidedPreset) => void;
  onLaunch: () => void;
  isLaunching?: boolean;
  expertView: React.ReactNode;
}

export function GuidedModuleHarness({
  moduleName,
  moduleCategory,
  moduleDescription,
  safetyLimits,
  keyTips,
  steps,
  presets,
  activeStep,
  onStepChange,
  onApplyPreset,
  onLaunch,
  isLaunching = false,
  expertView,
}: GuidedModuleHarnessProps) {
  const [viewMode, setViewMode] = useState<"guided" | "expert">("guided");
  const [selectedPresetId, setSelectedPresetId] = useState<string>("safe");
  const [showSafetyModal, setShowSafetyModal] = useState(false);

  const defaultPresets: GuidedPreset[] = presets || [
    {
      id: "safe",
      name: "🛡️ Safe Steady Growth",
      badge: "Beginner Recommended",
      description: "Lowest risk profile. Ideal for newer accounts (<30 days old).",
      delayRange: [25, 50],
      dailyLimit: safetyLimits.recommendedDailyPerAccount,
      useSpintax: true,
      recommendedFor: "New or warming accounts to avoid algorithmic bans.",
    },
    {
      id: "balanced",
      name: "⚡ Balanced Campaign",
      badge: "Standard",
      description: "Optimized throughput with randomized pauses for mature accounts.",
      delayRange: [15, 30],
      dailyLimit: Math.round(safetyLimits.recommendedDailyPerAccount * 1.5),
      useSpintax: true,
      recommendedFor: "Aged accounts (>60 days old) with established trust score.",
    },
    {
      id: "turbo",
      name: "🚀 Multi-Account Blast",
      badge: "Fleet Required",
      description: "Distributes high volume across multiple proxy-bound accounts.",
      delayRange: [10, 20],
      dailyLimit: safetyLimits.hardMaxDailyPerAccount,
      useSpintax: true,
      recommendedFor: "Large fleets of 10+ accounts rotating proxies.",
    },
  ];

  const handleSelectPreset = (preset: GuidedPreset) => {
    setSelectedPresetId(preset.id);
    if (onApplyPreset) {
      onApplyPreset(preset);
    }
  };

  return (
    <div className="space-y-4">
      {/* Mode & Strategy Switcher Header */}
      <div className="bg-card rounded-2xl border border-border p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0 shadow-xs">
            <Compass className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-foreground">{moduleName}</span>
              <span className="px-2 py-0.5 rounded-full bg-secondary text-primary font-mono text-[10px] font-bold border border-border">
                {moduleCategory}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">{moduleDescription}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Safety Guide Button */}
          <button
            type="button"
            onClick={() => setShowSafetyModal(!showSafetyModal)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-secondary hover:bg-secondary/80 border border-border text-xs font-bold text-muted-foreground hover:text-foreground transition-colors"
          >
            <Shield className="h-3.5 w-3.5 text-success" />
            Safety Limits
          </button>

          {/* Mode Switcher */}
          <div className="bg-secondary/60 p-1 rounded-xl border border-border flex items-center gap-1">
            <button
              type="button"
              onClick={() => setViewMode("guided")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                viewMode === "guided"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Sparkles className="h-3.5 w-3.5" />
              Guided Mode
            </button>
            <button
              type="button"
              onClick={() => setViewMode("expert")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                viewMode === "expert"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Sliders className="h-3.5 w-3.5" />
              Expert Mode
            </button>
          </div>
        </div>
      </div>

      {/* Safety Rules Explainer Drawer */}
      {showSafetyModal && (
        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 animate-in fade-in duration-150 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
                Telegram MTProto Anti-Ban Safety Blueprint
              </h4>
            </div>
            <button
              onClick={() => setShowSafetyModal(false)}
              className="text-muted-foreground hover:text-foreground text-xs"
            >
              ✕
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-card rounded-xl border border-border">
              <p className="text-[10px] font-bold text-muted-foreground uppercase">Safe Daily Cap</p>
              <p className="text-base font-mono font-bold text-success mt-0.5">
                {safetyLimits.recommendedDailyPerAccount}{" "}
                <span className="text-[10px] font-normal text-muted-foreground">/ acct</span>
              </p>
              <p className="text-[10px] text-muted-foreground mt-1">Recommended ceiling</p>
            </div>

            <div className="p-3 bg-card rounded-xl border border-border">
              <p className="text-[10px] font-bold text-muted-foreground uppercase">Delay Interval</p>
              <p className="text-base font-mono font-bold text-primary mt-0.5">
                {safetyLimits.recommendedDelaySeconds}s+
              </p>
              <p className="text-[10px] text-muted-foreground mt-1">Between operations</p>
            </div>

            <div className="p-3 bg-card rounded-xl border border-border">
              <p className="text-[10px] font-bold text-muted-foreground uppercase">Spintax Syntax</p>
              <p className="text-base font-mono font-bold text-amber-500 mt-0.5">
                {safetyLimits.spintaxMandatory ? "Mandatory" : "Recommended"}
              </p>
              <p className="text-[10px] text-muted-foreground mt-1">Prevents message hashes</p>
            </div>

            <div className="p-3 bg-card rounded-xl border border-border">
              <p className="text-[10px] font-bold text-muted-foreground uppercase">Cooldown</p>
              <p className="text-base font-mono font-bold text-foreground mt-0.5">
                {safetyLimits.cooldownPeriodMinutes} min
              </p>
              <p className="text-[10px] text-muted-foreground mt-1">Between batches</p>
            </div>
          </div>

          <div className="space-y-1">
            <p className="text-xs font-bold text-foreground">Key Operational Tips:</p>
            <ul className="text-xs text-muted-foreground space-y-1 list-disc pl-4">
              {keyTips.map((tip, idx) => (
                <li key={idx}>{tip}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* VIEW MODE: GUIDED STEPPER */}
      {viewMode === "guided" ? (
        <div className="space-y-4">
          {/* Step Progress Stepper Bar */}
          <div className="bg-card rounded-2xl border border-border p-4 shadow-xs">
            <div className="flex items-center justify-between gap-2 overflow-x-auto scrollbar-none">
              {steps.map((s, idx) => {
                const isCurrent = activeStep === idx;
                const isPassed = activeStep > idx;

                return (
                  <div
                    key={idx}
                    onClick={() => onStepChange(idx)}
                    className={`flex items-center gap-3 cursor-pointer p-2 rounded-xl transition-all shrink-0 ${
                      isCurrent
                        ? "bg-primary/10 text-primary font-bold"
                        : isPassed
                        ? "text-success font-medium hover:bg-secondary"
                        : "text-muted-foreground hover:text-foreground opacity-60"
                    }`}
                  >
                    <div
                      className={`h-7 w-7 rounded-lg flex items-center justify-center text-xs font-mono font-bold shadow-xs ${
                        isCurrent
                          ? "bg-primary text-primary-foreground"
                          : isPassed
                          ? "bg-success text-success-foreground"
                          : "bg-secondary text-muted-foreground"
                      }`}
                    >
                      {isPassed ? <Check className="h-3.5 w-3.5" /> : idx + 1}
                    </div>
                    <div>
                      <p className="text-xs font-bold leading-tight">{s.title}</p>
                      <p className="text-[10px] text-muted-foreground hidden sm:block">
                        {s.description}
                      </p>
                    </div>
                    {idx < steps.length - 1 && (
                      <div className="h-4 w-[1px] bg-border mx-1 hidden md:block" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Presets Bar in Step 1 or 2 */}
          {(activeStep === 0 || activeStep === 1) && (
            <div className="bg-card rounded-2xl border border-border p-4 space-y-2.5">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <h4 className="text-xs font-bold text-foreground">
                  Select Recommended Operational Profile
                </h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                {defaultPresets.map((p) => {
                  const isSelected = selectedPresetId === p.id;
                  return (
                    <div
                      key={p.id}
                      onClick={() => handleSelectPreset(p)}
                      className={`p-3 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? "bg-primary/10 border-primary shadow-xs ring-1 ring-primary"
                          : "bg-secondary/30 border-border/80 hover:bg-secondary/60"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-foreground">{p.name}</span>
                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-secondary text-primary font-bold">
                          {p.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground mb-2">{p.description}</p>
                      <div className="text-[10px] font-mono text-muted-foreground flex items-center gap-2">
                        <span>Delay: {p.delayRange[0]}-{p.delayRange[1]}s</span>
                        <span>·</span>
                        <span>Limit: {p.dailyLimit}/acct</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Active Step Content Container */}
          <div className="bg-card rounded-2xl border border-border p-5 shadow-xs">
            {steps[activeStep]?.component}

            {/* Stepper Navigation Buttons */}
            <div className="flex items-center justify-between pt-6 mt-6 border-t border-border gap-3">
              <button
                type="button"
                onClick={() => onStepChange(Math.max(0, activeStep - 1))}
                disabled={activeStep === 0}
                className="px-4 py-2 rounded-xl bg-secondary hover:bg-secondary/80 border border-border text-xs font-bold text-muted-foreground hover:text-foreground disabled:opacity-40 transition-colors flex items-center gap-1.5"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Previous Step
              </button>

              {activeStep < steps.length - 1 ? (
                <button
                  type="button"
                  onClick={() => onStepChange(activeStep + 1)}
                  className="px-5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:opacity-90 transition-opacity flex items-center gap-1.5 shadow-xs"
                >
                  Next: {steps[activeStep + 1]?.title}
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onLaunch}
                  disabled={isLaunching}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-primary to-accent text-white text-xs font-bold hover:opacity-90 shadow-md transition-opacity flex items-center gap-2"
                >
                  <Sparkles className="h-4 w-4" />
                  {isLaunching ? "Launching MTProto Operation..." : "Launch Operation Now"}
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* VIEW MODE: EXPERT STUDIO */
        <div className="animate-in fade-in duration-150">{expertView}</div>
      )}
    </div>
  );
}
