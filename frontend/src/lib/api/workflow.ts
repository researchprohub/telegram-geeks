/**
 * Telegram Geeks Workflow v2.0 API Client.
 * Supports standard REST endpoints and Server-Sent Events (SSE) live progress streaming.
 */

import api from "@/lib/api";

const BASE = "/workflow";

export interface StageOverview {
  version: string;
  pipeline_name: string;
  stages: Record<string, any>[];
  telemetry: {
    total_accounts: number;
    active_accounts: number;
    warming_accounts: number;
    banned_accounts: number;
    avg_trust_score: number;
    total_campaigns: number;
    running_campaigns: number;
    total_proxies: number;
    active_proxies: number;
    total_licenses: number;
    total_orders: number;
    active_pipelines: number;
    flooded_accounts: {
      account_id: string;
      lift_at: string;
      seconds_remaining: number;
    }[];
  };
}

export interface PipelineRun {
  id: string;
  stages: number[];
  triggered_by?: number | null;
  status: "pending" | "running" | "paused" | "completed" | "failed" | "cancelled";
  progress: number;
  logs: { ts: string; msg: string }[];
  current_step: string | null;
  result?: Record<string, any> | null;
  created_at: string;
  completed_at?: string | null;
}

export const workflowApi = {
  // ── READ ────────────────────────────────────────────────────────────────
  getOverview: async (): Promise<StageOverview> => {
    const res = await api.get(`${BASE}/overview`);
    return res.data;
  },

  getStages: async (): Promise<StageOverview> => {
    const res = await api.get(`${BASE}/stages`);
    return res.data;
  },

  getFloodStatus: async () => {
    const res = await api.get(`${BASE}/flood-status`);
    return res.data;
  },

  getPipelines: async (limit: number = 20): Promise<{ total: number; runs: PipelineRun[] }> => {
    const res = await api.get(`${BASE}/pipelines?limit=${limit}`);
    return res.data;
  },

  getPipeline: async (id: string): Promise<PipelineRun> => {
    const res = await api.get(`${BASE}/pipelines/${id}`);
    return res.data;
  },

  // ── ACTIONS ─────────────────────────────────────────────────────────────
  runStep: async (
    stage: number,
    step: string,
    operation?: string,
    params?: Record<string, any>
  ) => {
    const res = await api.post(`${BASE}/run-step`, {
      stage_number: stage,
      step_id: step,
      operation: operation,
      params: params || {},
    });
    return res.data;
  },

  executePipeline: async (
    stages: number[],
    name: string = "Master 9-Stage Operational Pipeline",
    config?: Record<string, any>
  ): Promise<PipelineRun> => {
    const res = await api.post(`${BASE}/execute-pipeline`, {
      name,
      stages,
      config: config || {},
    });
    return res.data;
  },

  cancelPipeline: async (id: string) => {
    const res = await api.post(`${BASE}/pipelines/${id}/cancel`);
    return res.data;
  },

  pausePipeline: async (id: string, action: "pause" | "resume" = "pause") => {
    const res = await api.post(`${BASE}/pipelines/${id}/pause?action=${action}`);
    return res.data;
  },

  // ── SSE STREAM ──────────────────────────────────────────────────────────
  streamPipeline: (
    pipelineId: string,
    onUpdate: (run: PipelineRun) => void,
    onDone: (run: PipelineRun) => void,
    onError: (err: Event) => void
  ): EventSource => {
    const baseURL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";
    const es = new EventSource(`${baseURL}/workflow/pipelines/${pipelineId}/stream`, {
      withCredentials: true,
    });

    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.event === "done") {
          onDone(data.run);
          es.close();
        } else if (data.error) {
          onError(new Event(data.error));
          es.close();
        } else {
          onUpdate(data);
        }
      } catch {
        // ignore parse error
      }
    };

    es.onerror = (e) => {
      onError(e);
      es.close();
    };

    return es;
  },
};
