import axios, { AxiosError } from "axios";
import { useAuth } from "./auth";
import type { ModuleListResponse, ModuleParamsResponse } from "../types";

export const BASE_URL = "http://127.0.0.1:8765";

export const api = axios.create({
  baseURL: `${BASE_URL}/api/v1`,
  timeout: 30000,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = useAuth.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (error: AxiosError) => {
    if (error.response?.status === 401 && !error.config?.url?.includes("/auth/")) {
      useAuth.getState().logout();
    }
    return Promise.reject(error);
  }
);

export function detail(err: unknown): string {
  const e = err as AxiosError<{ detail?: unknown; message?: string }>;
  const d = e.response?.data?.detail;
  if (typeof d === "string") return d;
  if (d && typeof d === "object") return JSON.stringify(d, null, 2);
  return e.response?.data?.message || e.message || String(err);
}

export const authApi = {
  login: (email: string, password: string) => api.post<{ access_token: string; token_type: string }>("/auth/login", { email, password }),
  register: (email: string, password: string, full_name?: string) => api.post("/auth/register", { email, password, full_name }),
};

export const meApi = {
  me: () => api.get<{ id: number; email: string; role: string; full_name?: string }>("/auth/me"),
};

export const accountsApi = {
  list: (page = 1, page_size = 200) => api.get<unknown>("/accounts/", { params: { page, page_size } }),
  create: (data: Record<string, unknown>) => api.post("/accounts/", data),
  delete: (id: number) => api.delete(`/accounts/${id}`),
  health: (id: number) => api.post(`/accounts/${id}/health`),
  warmup: (id: number) => api.post(`/accounts/${id}/warmup`),
  suspend: (id: number) => api.post(`/accounts/${id}/suspend`),
  unsuspend: (id: number) => api.post(`/accounts/${id}/unsuspend`),
};

export const campaignsApi = {
  list: (page = 1, page_size = 100) => api.get<unknown>("/campaigns/", { params: { page, page_size } }),
  create: (data: Record<string, unknown>) => api.post("/campaigns/", data),
  delete: (id: number) => api.delete(`/campaigns/${id}`),
  start: (id: number) => api.post(`/campaigns/${id}/start`),
  pause: (id: number) => api.post(`/campaigns/${id}/pause`),
  stop: (id: number) => api.post(`/campaigns/${id}/stop`),
  logs: (id: number) => api.get(`/campaigns/${id}/logs`),
};

export const personasApi = {
  list: (page = 1) => api.get<unknown>("/personas/", { params: { page, page_size: 100 } }),
  create: (data: Record<string, unknown>) => api.post("/personas/", data),
  update: (id: number, data: Record<string, unknown>) => api.put(`/personas/${id}`, data),
  delete: (id: number) => api.delete(`/personas/${id}`),
  chat: (persona_id: number, message: string) =>
    api.post<any>("/personas/chat", { persona_id, message }),
  emotions: (persona_id: number) =>
    api.get(`/personas/${persona_id}/emotions`),
};

export const groupsApi = {
  list: (page = 1) => api.get<unknown>("/groups/", { params: { page, page_size: 100 } }),
  create: (data: Record<string, unknown>) => api.post("/groups/", data),
  delete: (id: number) => api.delete(`/groups/${id}`),
  adminSearch: (keyword?: string) =>
    modulesApi.execute("admin_chat_search", "search_admin_chats", { keyword: keyword || "" }),
  massUnsubscribe: (account_ids: number[], options?: string[] | boolean) =>
    modulesApi.execute("mass_unsubscriber", "mass_leave", {
      account_ids,
      chat_ids: Array.isArray(options) ? options : [],
      leave_channels_only: typeof options === "boolean" ? options : true,
    }),
};

export const analyticsApi = {
  overview: () => api.get<unknown>("/advanced-analytics/engagement-summary"),
  engagement: (groupId: number) => api.get(`/analytics/engagement/${groupId}`),
  stats: () => api.get<unknown>("/admin/analytics/overview"),
};

export const paymentsApi = {
  plans: () => api.get<any[]>("/payments/plans"),
  subscription: () => api.get<any>("/payments/subscription"),
  orders: () => api.get<any[]>("/payments/orders"),
  modules: () => api.get<{ plans: any[]; active: string[] }>("/payments/modules"),
  manualWallets: () => api.get<any>("/payments/manual-wallets"),
  checkBlockchain: (order_id: string, params?: { tx_hash?: string; network?: string; amount?: number }) =>
    api.post<any>(`/payments/orders/${order_id}/check-blockchain`, null, { params }),
  createPayment: (data: { amount: number; currency?: string; pay_currency?: string; gateway?: string; metadata?: any }) =>
    api.post<any>("/payments/create", data),
  upgradePlan: (plan_id: string, billing_cycle = "monthly") =>
    api.post<any>("/payments/upgrade", null, { params: { plan_id, billing_cycle } }),
  subscribeModule: (module_id: string) =>
    api.post<any>(`/payments/module-subscribe?module_id=${module_id}`),
};

export const licensesApi = {
  generate: (data: {
    plan_tier: string;
    duration_days?: number;
    max_accounts?: number;
    max_campaigns?: number;
    team_seats?: number;
    allowed_modules?: string[];
    customer_email?: string;
    hwid?: string;
    notes?: string;
    batch_count?: number;
  }) => api.post<any>("/licenses/admin/generate", data),
  list: (params?: { search?: string; status?: string; plan_tier?: string; limit?: number }) =>
    api.get<any>("/licenses/admin/list", { params }),
  revoke: (key: string, reason?: string) =>
    api.post<any>(`/licenses/admin/${encodeURIComponent(key)}/revoke`, { reason }),
  extend: (key: string, extra_days: number) =>
    api.post<any>(`/licenses/admin/${encodeURIComponent(key)}/extend`, { extra_days }),
  unbindHwid: (key: string) =>
    api.post<any>(`/licenses/admin/${encodeURIComponent(key)}/unbind-hwid`),
  activate: (key: string, hwid?: string) =>
    api.post<any>("/licenses/activate", { key, hwid }),
  verify: (key: string, hwid?: string) =>
    api.post<any>("/licenses/verify", { key, hwid }),
};

export const adminApi = {
  overview: () => api.get<unknown>("/admin/analytics/overview"),
  users: (page = 1) => api.get<unknown>("/admin/users", { params: { page, page_size: 100 } }),
};

export const settingsApi = {
  get: () => api.get<unknown>("/admin/settings"),
  update: (data: Record<string, unknown>) => api.put("/admin/settings", data),
};

export const modulesApi = {
  list: (category?: string) => api.get<ModuleListResponse>("/modules/", { params: category ? { category } : {} }),
  params: (moduleId: string) => api.get<ModuleParamsResponse>(`/modules/${moduleId}/params`),
  execute: (moduleId: string, operation: string, params: Record<string, unknown>) =>
    api.post<{ status: string; data?: any; message?: string }>(`/modules/${moduleId}/execute`, { operation, params }),
};

export const proxiesApi = {
  listAll: () => api.get<any>("/proxies"),
  createProxy: (data: { host: string; port: number; proxy_type?: string; username?: string; password?: string; country?: string }) =>
    api.post<any>("/proxies", data),
  deleteProxy: (id: number) => api.delete<any>(`/proxies/${id}`),
  bulkImport: (proxies_text: string, proxy_type = "socks5") => api.post<any>("/proxies/bulk", { proxies_text, proxy_type }),
  stats: () => api.get<any>("/proxies/pool/stats"),
  providers: () => api.get<any>("/proxies/providers"),
  assign: (account_id: number, country?: string) => api.post(`/proxies/assign/${account_id}`, { country }),
  release: (account_id: number) => api.post(`/proxies/release/${account_id}`),
  healthCheck: () => api.post("/proxies/pool/health-check"),
  checkProxy: (proxy_id: number) => api.post(`/proxies/pool/check/${proxy_id}`),
};

export const smsApi = {
  listProviders: () => api.get<any>("/sms-providers/"),
  health: () => api.get<any>("/sms-providers/status/health"),
  getPhone: (data: { provider?: string; country?: string; operator?: string; service?: string; voice_verification?: boolean }) =>
    api.post<any>("/sms-providers/phone", data),
  getCode: (phone: string, provider?: string) => api.post<any>("/sms-providers/code", { phone, provider }),
  withdraw: (phone: string, provider?: string) => api.post<any>("/sms-providers/withdraw", { phone, provider }),
  configure: (provider_id: string, api_key: string) => api.post<any>(`/sms-providers/${provider_id}/configure`, { api_key }),
  register: (data: { sms_provider?: string; country?: string; operator?: string; voice_verification?: boolean; anti_safety?: boolean }) =>
    api.post<any>("/registrar/register", null, { params: data }),
  requestQr: (cloud_password?: string) => api.post<any>("/registrar/qr", null, { params: { cloud_password } }),
};

export const tdataApi = {
  single: (file: File, api_id: number, api_hash: string) => {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("api_id", String(api_id));
    fd.append("api_hash", api_hash);
    return api.post<any>("/single", fd, { headers: { "Content-Type": "multipart/form-data" } });
  },
  bulk: (files: File[], api_id: number, api_hash: string) => {
    const fd = new FormData();
    files.forEach((f) => fd.append("files", f));
    fd.append("api_id", String(api_id));
    fd.append("api_hash", api_hash);
    return api.post<any>("/bulk", fd, { headers: { "Content-Type": "multipart/form-data" } });
  },
};

export const globalConfigApi = {
  get: () => api.get<any>("/global-config"),
  update: (data: { section: string; key: string; value: any }) => api.put<any>("/global-config", data),
};

export const neuroTextApi = {
  generate: (data: { prompt: string; tone?: string; persona_context?: string; spin_count?: number }) =>
    api.post<any>("/neuro-text/generate", data),
};