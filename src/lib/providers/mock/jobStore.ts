// Tiny in-memory job registry shared by the mock video/lip-sync/topaz
// providers, so getRenderStatus()/getEnhancementStatus() calls have somewhere
// real to read from. Resets on server restart - fine for an MVP mock; a real
// provider would query the vendor's job API instead.

import type { RenderStatus } from "@/lib/types";
import { mockId } from "@/lib/providers/mock/shared";

interface MockJobRecord {
  status: RenderStatus;
  outputUrl?: string;
  error?: string;
  progress: number;
}

const jobs = new Map<string, MockJobRecord>();

export function registerJob(prefix: string, record: MockJobRecord): string {
  const jobId = mockId(prefix);
  jobs.set(jobId, record);
  return jobId;
}

export function readJob(jobId: string): MockJobRecord | undefined {
  return jobs.get(jobId);
}

export function updateJob(jobId: string, patch: Partial<MockJobRecord>) {
  const current = jobs.get(jobId);
  if (!current) return;
  jobs.set(jobId, { ...current, ...patch });
}
