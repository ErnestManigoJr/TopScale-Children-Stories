// Tiny in-memory job registry shared by the video/lip-sync/topaz providers
// (mock and real alike) so getRenderStatus()/getEnhancementStatus() calls
// have somewhere to read from. Resets on server restart - a hosted provider
// would query the vendor's own job API instead.

import { randomUUID } from "node:crypto";
import type { RenderStatus } from "@/lib/types";

interface JobRecord {
  status: RenderStatus;
  outputUrl?: string;
  error?: string;
  progress: number;
}

const jobs = new Map<string, JobRecord>();

export function registerJob(prefix: string, record: JobRecord): string {
  const jobId = `${prefix}_${randomUUID().slice(0, 8)}`;
  jobs.set(jobId, record);
  return jobId;
}

export function readJob(jobId: string): JobRecord | undefined {
  return jobs.get(jobId);
}

export function updateJob(jobId: string, patch: Partial<JobRecord>) {
  const current = jobs.get(jobId);
  if (!current) return;
  jobs.set(jobId, { ...current, ...patch });
}
