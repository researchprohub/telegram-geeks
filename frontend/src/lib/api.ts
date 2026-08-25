// API client — httpOnly cookies are auto-sent by browser (same-origin proxy)

import axios from 'axios';

const api = axios.create({
  // In SSR, hit BACKEND_URL/api/v1. In browser, hit /api/v1 (or NEXT_PUBLIC_API_URL).
  baseURL: typeof window === "undefined" && process.env.BACKEND_URL
    ? `${process.env.BACKEND_URL}/api/v1`
    : (typeof window !== "undefined" && process.env.NEXT_PUBLIC_API_URL ? process.env.NEXT_PUBLIC_API_URL : '/api/v1'),
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Read csrf_token cookie and attach to mutating requests
function getCSRFToken(): string {
  if (typeof document === "undefined") return "";
  const match = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : "";
}

function getStoredToken(): string {
  if (typeof window === "undefined") return "";
  try {
    return localStorage.getItem("tg_token") || "";
  } catch {
    return "";
  }
}

api.interceptors.request.use((config) => {
  const authToken = getStoredToken();
  if (authToken && !config.headers["Authorization"]) {
    config.headers["Authorization"] = `Bearer ${authToken}`;
  }
  if (config.method && !["get", "head", "options"].includes(config.method)) {
    const token = getCSRFToken();
    if (token) config.headers["X-CSRF-Token"] = token;
  }
  return config;
});

// Redirect to login on 401 (session expired), except for auth routes (login
// failures surface their own error inline).
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== "undefined" && !error.config?.url?.includes("/auth/")) {
      try { localStorage.removeItem("tg_token"); } catch {}
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// Dedicated media client with extended timeout for MTProto relay downloads
// (avatars, photos, videos can take 30-60+ seconds to relay through Telegram servers)
export const mediaApi = axios.create({
  baseURL: typeof window === "undefined" && process.env.BACKEND_URL
    ? `${process.env.BACKEND_URL}/api/v1`
    : (typeof window !== "undefined" && process.env.NEXT_PUBLIC_API_URL ? process.env.NEXT_PUBLIC_API_URL : '/api/v1'),
  timeout: 120000,
});

mediaApi.interceptors.request.use((config) => {
  const authToken = getStoredToken();
  if (authToken && !config.headers["Authorization"]) {
    config.headers["Authorization"] = `Bearer ${authToken}`;
  }
  return config;
});

export default api;

/**
 * Persistently fetch and cache media blobs using the browser Cache API.
 * This prevents re-downloading heavy videos and images across sessions.
 */
export async function getCachedMedia(src: string): Promise<Blob> {
  if (typeof caches === "undefined" || typeof window === "undefined") {
    const res = await mediaApi.get(src, { responseType: "blob" });
    return res.data;
  }

  const cacheName = "telegram-media-cache-v1";
  const cache = await caches.open(cacheName);
  
  // Ensure the cache key is a valid URL by prepending the origin if it's a relative path
  const cacheKeyUrl = src.startsWith("http") ? src : `${window.location.origin}${src}`;
  
  try {
    const cachedResponse = await cache.match(cacheKeyUrl);
    if (cachedResponse) {
      return await cachedResponse.blob();
    }
  } catch (err) {
    console.warn("Cache match failed, falling back to network", err);
  }

  const res = await mediaApi.get(src, { responseType: "blob" });
  const blob = res.data as Blob;

  try {
    const responseToCache = new Response(blob, {
      status: 200,
      headers: {
        "Content-Type": blob.type || "application/octet-stream",
        "Cache-Control": "public, max-age=31536000",
      }
    });
    cache.put(cacheKeyUrl, responseToCache).catch(e => console.warn("Cache put error:", e));
  } catch (err) {
    console.warn("Could not cache media response", err);
  }

  return blob;
}

// ─── API Methods ───────────────────────────────────────────────

export const authApi = {
  login: async (email: string, password: string) => {
    const res = await api.post('/auth/login', { email, password });
    if (res.data?.access_token && typeof window !== "undefined") {
      try { localStorage.setItem("tg_token", res.data.access_token); } catch {}
    }
    return res;
  },
  register: async (email: string, password: string, full_name?: string, role?: string) => {
    const res = await api.post('/auth/register', { email, password, full_name, role });
    if (res.data?.access_token && typeof window !== "undefined") {
      try { localStorage.setItem("tg_token", res.data.access_token); } catch {}
    }
    return res;
  },
  getMe: () => api.get('/auth/me'),
  logout: async () => {
    try { localStorage.removeItem("tg_token"); } catch {}
    return api.post('/auth/logout');
  },
};

export const accountsApi = {
  list: (page = 1, pageSize = 20, status?: string) =>
    api.get('/accounts/', { params: { page, page_size: pageSize, status } }),
  create: (data: any) => api.post('/accounts/', data),
  get: (id: number) => api.get(`/accounts/${id}`),
  update: (id: number, data: any) => api.put(`/accounts/${id}`, data),
  delete: (id: number) => api.delete(`/accounts/${id}`),
  health: (id: number) => api.post(`/accounts/${id}/health`),
  warmup: (id: number) => api.post(`/accounts/${id}/warmup`),
  suspend: (id: number) => api.post(`/accounts/${id}/suspend`),
  unsuspend: (id: number) => api.post(`/accounts/${id}/unsuspend`),
};

export const personasApi = {
  list: (page = 1, pageSize = 20) =>
    api.get('/personas/', { params: { page, page_size: pageSize } }),
  create: (data: any) => api.post('/personas/', data),
  get: (id: number) => api.get(`/personas/${id}`),
  update: (id: number, data: any) => api.put(`/personas/${id}`, data),
  delete: (id: number) => api.delete(`/personas/${id}`),
  test: (id: number) => api.post(`/personas/${id}/test`),
  uploadImage: (id: number, file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    return api.post(`/personas/${id}/upload-image`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  assignAccount: (id: number, accountId: number) =>
    api.post(`/personas/${id}/assign-account`, { account_id: accountId }),
  unassignAccount: (id: number) =>
    api.delete(`/personas/${id}/assign-account`),
  getAssignedAccount: (id: number) =>
    api.get(`/personas/${id}/assigned-account`),
  setWebhook: (id: number, url: string, headers?: Record<string, string>) =>
    api.post(`/personas/${id}/webhook`, { url, headers: headers || {} }),
  setSheetsConfig: (id: number, config: any) =>
    api.post(`/personas/${id}/sheets-config`, config),
  assignGroups: (id: number, groupIds: number[]) =>
    api.post(`/personas/${id}/assign-groups`, { group_ids: groupIds }),
  getAssignedGroups: (id: number) =>
    api.get(`/personas/${id}/assigned-groups`),
  generateSoulPrompt: (id: number, data: any) =>
    api.post(`/personas/${id}/soul-prompt/generate`, data),
  getSoulPrompt: (id: number) =>
    api.get(`/personas/${id}/soul-prompt`),
};

export const campaignsApi = {
  list: (page = 1, pageSize = 20, status?: string) =>
    api.get('/campaigns/', { params: { page, page_size: pageSize, status } }),
  create: (data: any) => api.post('/campaigns/', data),
  get: (id: number) => api.get(`/campaigns/${id}`),
  update: (id: number, data: any) => api.put(`/campaigns/${id}`, data),
  delete: (id: number) => api.delete(`/campaigns/${id}`),
  start: (id: number) => api.post(`/campaigns/${id}/start`),
  pause: (id: number) => api.post(`/campaigns/${id}/pause`),
  stop: (id: number) => api.post(`/campaigns/${id}/stop`),
  conversations: (id: number, page = 1, pageSize = 50) =>
    api.get(`/campaigns/${id}/conversations`, { params: { page, page_size: pageSize } }),
};

export const groupsApi = {
  list: (page = 1, pageSize = 20, groupType?: string) =>
    api.get('/groups/', { params: { page, page_size: pageSize, group_type: groupType } }),
  create: (data: any) => api.post('/groups/', data),
  get: (id: number) => api.get(`/groups/${id}`),
  delete: (id: number) => api.delete(`/groups/${id}`),
  scrapeMembers: (id: number, limit = 100) =>
    api.post(`/groups/${id}/scrape-members`, null, { params: { limit } }),
  analyze: (id: number) => api.post(`/groups/${id}/analyze`),
};

export const analyticsApi = {
  summary: (campaignId: number) => api.get(`/analytics/summary/${campaignId}`),
  engagement: (groupId: number) => api.get(`/analytics/engagement/${groupId}`),
  funnel: (campaignId: number) => api.get(`/analytics/funnel/${campaignId}`),
  accountHealth: (accountId: number) => api.get(`/analytics/account-health/${accountId}`),
  export: (campaignId: number, format = 'json') =>
    api.get(`/analytics/export/${campaignId}`, { params: { format } }),
};

export const adminApi = {
  overview: () => api.get('/admin/analytics/overview'),
  users: (page = 1, pageSize = 20) => api.get('/admin/users', { params: { page, page_size: pageSize } }),
  banUser: (userId: number) => api.post(`/admin/users/${userId}/ban`),
  getSettings: () => api.get('/admin/settings'),
  updateSettings: (data: any) => api.put('/admin/settings', data),
};

export const accountsApiExtended = {
  statusCounts: () => api.get('/accounts/status-counts'),
  bulkHealthCheck: (accountIds?: number[]) =>
    api.post('/accounts/health-check/bulk', accountIds ? { account_ids: accountIds } : { select_all: true }),
  updateStatus: (id: number, status: string) =>
    api.patch(`/accounts/${id}/status`, { status }),
  bulkStatus: (accountIds: number[], status: string) =>
    api.post('/accounts/bulk-status', { account_ids: accountIds, status }),
};

export const toolsApi = {
  exportTData: (accountIds?: number[]) =>
    api.post('/tools/export-tdata', accountIds ? { account_ids: accountIds } : { select_all: true },
      { responseType: 'blob' }),
  exportSessionJson: (accountIds?: number[]) =>
    api.post('/tools/export-session-json', accountIds ? { account_ids: accountIds } : { select_all: true },
      { responseType: 'blob' }),
};

export const advancedAnalyticsApi = {
  engagementSummary: () => api.get('/advanced-analytics/engagement-summary'),
  accountHealth: (accountId: number) => api.get(`/advanced-analytics/account-health/${accountId}`),
  aiInsights: () => api.get('/advanced-analytics/ai-insights'),
  performanceTrend: (days = 30) => api.get('/advanced-analytics/performance-trend', { params: { days } }),
  roiCalculator: (params: any) => api.get('/advanced-analytics/roi-calculator', { params }),
  engagementScore: (params: any) => api.get('/advanced-analytics/engagement-score', { params }),
};

export const blogApi = {
  // public
  listCategories: () => api.get('/blog/categories'),
  listPosts: (params?: { category?: string; tag?: string; search?: string; page?: number; page_size?: number }) =>
    api.get('/blog/posts', { params }),
  getPost: (slug: string) => api.get(`/blog/posts/${slug}`),

  // writer
  listMyPosts: (status?: string) =>
    api.get('/blog/posts/author/all', { params: status ? { status } : {} }),
  getMyPost: (id: number) => api.get(`/blog/posts/detail/${id}`),
  createPost: (data: any) => api.post('/blog/posts', data),
  updatePost: (id: number, data: any) => api.put(`/blog/posts/${id}`, data),
  deletePost: (id: number) => api.delete(`/blog/posts/${id}`),
  createCategory: (data: any) => api.post('/blog/categories', data),

  // AI
  draft: (data: any) => api.post('/blog/ai/draft', data),
  seo: (data: any) => api.post('/blog/ai/seo', data),
  improve: (data: any) => api.post('/blog/ai/improve', data),

  // Media
  uploadImage: (file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    return api.post("/blog/media/upload", fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
};

export const partnersApi = {
  // public
  list: () => api.get('/partners'),

  // admin
  adminList: () => api.get('/admin/partners'),
  seed: () => api.post('/admin/partners/seed'),
  create: (data: { name: string; img: string; href?: string; category: string; sort_order?: number }) =>
    api.post('/admin/partners', data),
  update: (id: number, data: any) => api.put(`/admin/partners/${id}`, data),
  remove: (id: number) => api.delete(`/admin/partners/${id}`),
};
