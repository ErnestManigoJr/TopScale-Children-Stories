"use client";

import { useEffect, useRef, useState } from "react";
import { fetchProject } from "@/lib/api-client";
import type { Project } from "@/lib/types";

const ACTIVE_STATUSES = new Set(["draft", "queued", "processing"]);

export function useProject(id: string) {
  const [project, setProject] = useState<Project | null>(null);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      try {
        const next = await fetchProject(id);
        if (cancelled) return;
        setProject(next);
        setError(null);
        if (ACTIVE_STATUSES.has(next.status)) {
          timerRef.current = setTimeout(poll, 1000);
        }
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Failed to load project");
        timerRef.current = setTimeout(poll, 2000);
      }
    }

    poll();
    return () => {
      cancelled = true;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [id]);

  return { project, error, isLoading: !project && !error };
}
