import { useState, useCallback, useRef, useEffect } from "react";
import { workflowApi, PipelineRun } from "@/lib/api/workflow";

export function useWorkflowPipeline() {
  const [run, setRun] = useState<PipelineRun | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const esRef = useRef<EventSource | null>(null);

  const cleanupStream = useCallback(() => {
    if (esRef.current) {
      esRef.current.close();
      esRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      cleanupStream();
    };
  }, [cleanupStream]);

  const launch = useCallback(
    async (stages: number[], name?: string, config?: Record<string, any>) => {
      setLoading(true);
      setError(null);
      cleanupStream();

      try {
        const initialRun = await workflowApi.executePipeline(
          stages,
          name || "Master 9-Stage Operational Pipeline",
          config
        );
        setRun(initialRun);

        // Fallback polling loop alongside SSE for resilience
        const pollInterval = setInterval(async () => {
          try {
            const updated = await workflowApi.getPipeline(initialRun.id);
            setRun(updated);
            if (["completed", "failed", "cancelled"].includes(updated.status)) {
              clearInterval(pollInterval);
              setLoading(false);
              cleanupStream();
            }
          } catch {
            // ignore
          }
        }, 1200);

        // Open SSE stream
        try {
          esRef.current = workflowApi.streamPipeline(
            initialRun.id,
            (updated) => {
              setRun(updated);
              if (["completed", "failed", "cancelled"].includes(updated.status)) {
                clearInterval(pollInterval);
                setLoading(false);
              }
            },
            (final) => {
              setRun(final);
              setLoading(false);
              clearInterval(pollInterval);
            },
            () => {
              // On SSE error, fallback polling handles it
            }
          );
        } catch {
          // SSE unsupported/fallback handled by polling
        }
      } catch (e: any) {
        setError(e.response?.data?.detail || e.message || "Failed to launch pipeline");
        setLoading(false);
      }
    },
    [cleanupStream]
  );

  const cancel = useCallback(async () => {
    if (!run?.id) return;
    cleanupStream();
    try {
      await workflowApi.cancelPipeline(run.id);
      setRun((r) => (r ? { ...r, status: "cancelled" } : r));
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [run?.id, cleanupStream]);

  const pause = useCallback(async () => {
    if (!run?.id) return;
    try {
      await workflowApi.pausePipeline(run.id, "pause");
      setRun((r) => (r ? { ...r, status: "paused" } : r));
    } catch {
      // ignore
    }
  }, [run?.id]);

  const resume = useCallback(async () => {
    if (!run?.id) return;
    try {
      await workflowApi.pausePipeline(run.id, "resume");
      setRun((r) => (r ? { ...r, status: "running" } : r));
    } catch {
      // ignore
    }
  }, [run?.id]);

  return { run, loading, error, launch, cancel, pause, resume, setRun };
}
