import { PIPELINE_STAGE_KEYS, STAGE_LABELS, type PipelineStage } from "@/lib/types";

export function initialPipelineStatus(): PipelineStage[] {
  return PIPELINE_STAGE_KEYS.map((key) => ({ key, label: STAGE_LABELS[key], status: "pending" as const }));
}
