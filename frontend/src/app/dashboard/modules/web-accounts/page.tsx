"use client";

import { useState, useEffect } from "react";
import {
  Globe, ArrowLeft, Loader2, ExternalLink, Monitor, Users,
  CheckCircle2, RefreshCw, Smartphone
} from "lucide-react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import TelegramWebClient from "@/components/telegram-web/TelegramWebClient";
import { CrossLinkFooter } from "@/components/modules/CrossLinkFooter";
import { ModuleFooter } from "@/components/modules/ModuleFooter";

export default function WebAccountsPage() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    try {
      setLoading(true);
      const res = await api.get("/accounts/", { params: { pageSize: 100 } });
      const items = res.data?.items || res.data || [];
      setAccounts(items);
      if (items.length > 0 && !selectedAccountId) {
        setSelectedAccountId(items[0].id);
      }
    } catch (e) {
      console.error("Failed to load accounts", e);
    } finally {
      setLoading(false);
    }
  };

  const currentAccount = accounts.find((a) => a.id === selectedAccountId);

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-card border-b border-border px-4 py-3 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/dashboard/modules")}
              className="p-2 rounded-xl hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-xs">
              <Globe className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-foreground">Telegram Web Workstation</h1>
                <span className="px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold">
                  Interactive MTProto
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                View joined channels, groups, chats and send live messages across your connected accounts
              </p>
            </div>
          </div>

          {/* Account Selector Bar */}
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-1">
            <span className="text-xs font-bold text-muted-foreground shrink-0 flex items-center gap-1">
              <Smartphone className="h-3.5 w-3.5" />
              Active Account:
            </span>
            <div className="flex items-center gap-1.5">
              {loading ? (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-secondary text-xs text-muted-foreground">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                  Loading...
                </div>
              ) : accounts.length === 0 ? (
                <button
                  onClick={() => router.push("/dashboard/accounts/upload")}
                  className="px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold"
                >
                  + Add Account First
                </button>
              ) : (
                accounts.map((a) => {
                  const isSelected = a.id === selectedAccountId;
                  return (
                    <button
                      key={a.id}
                      onClick={() => setSelectedAccountId(a.id)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-colors ${
                        isSelected
                          ? "bg-primary text-primary-foreground shadow-xs"
                          : "bg-secondary hover:bg-secondary/80 border border-border text-foreground"
                      }`}
                    >
                      <span className="h-2 w-2 rounded-full bg-success shrink-0" />
                      <span>{a.first_name || a.username || a.phone_number || a.phone}</span>
                    </button>
                  );
                })
              )}
            </div>
            <button
              onClick={loadAccounts}
              className="p-1.5 rounded-xl bg-secondary hover:bg-secondary/80 border border-border text-muted-foreground hover:text-foreground"
              title="Refresh Account List"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4 max-w-7xl mx-auto">
        {selectedAccountId && currentAccount ? (
          <TelegramWebClient
            key={selectedAccountId}
            accountId={selectedAccountId}
            accountPhone={currentAccount.phone_number || currentAccount.phone}
            accountName={currentAccount.first_name || currentAccount.username}
          />
        ) : (
          <div className="bg-card rounded-2xl border border-border p-12 text-center space-y-3">
            <div className="h-14 w-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
              <Globe className="h-7 w-7" />
            </div>
            <h3 className="text-base font-bold text-foreground">No Account Connected</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              You need at least one connected Telegram account to view joined groups, channels, chats, and messages.
            </p>
            <button
              onClick={() => router.push("/dashboard/accounts/upload")}
              className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:opacity-90 transition-opacity"
            >
              Connect Account via QR Code
            </button>
          </div>
        )}

        <CrossLinkFooter
          links={[
            { label: "Accounts Hub", href: "/dashboard/accounts" },
            { label: "Import Accounts", href: "/dashboard/accounts/upload" },
            { label: "Audience Collector", href: "/dashboard/modules/audience-collector" },
            { label: "Mass Messaging", href: "/dashboard/modules/mass-messaging" },
          ]}
        />

        <ModuleFooter manualSlug="web-accounts" />
      </div>
    </div>
  );
}