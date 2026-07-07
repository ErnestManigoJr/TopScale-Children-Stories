import { Badge } from "@/components/ui/badge";
import type { PipelineStage } from "@/lib/types";
import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<PipelineStage["status"], string> = {
  pending: "bg-muted text-muted-foreground",
  processing: "bg-blue-100 text-blue-700",
  completed: "bg-green-100 text-green-700",
  failed: "bg-red-100 text-red-700",
  needs_review: "bg-amber-100 text-amber-700",
};

const STATUS_ICON: Record<PipelineStage["status"], string> = {
  pending: "○",
  processing: "◐",
  completed: "✓",
  failed: "✕",
  needs_review: "!",
};

export function PipelineStageList({ stages }: { stages: PipelineStage[] }) {
  return (
    <ol className="flex flex-col gap-2">
      {stages.map((stage, index) => (
        <li
          key={stage.key}
          className={cn(
            "flex items-center justify-between rounded-xl border bg-white px-4 py-3 transition-colors",
            stage.status === "processing" && "border-blue-300 shadow-sm"
          )}
        >
          <div className="flex items-center gap-3">
            <span
              className={cn(
                "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                STATUS_STYLES[stage.status]
              )}
            >
              {stage.status === "processing" ? (
                <span className="animate-pulse">{STATUS_ICON[stage.status]}</span>
              ) : (
                STATUS_ICON[stage.status]
              )}
            </span>
            <div>
              <p className="text-sm font-medium">
                {index + 1}. {stage.label}
              </p>
              {stage.message && <p className="text-xs text-muted-foreground">{stage.message}</p>}
            </div>
          </div>
          <Badge variant="outline" className={cn("capitalize", STATUS_STYLES[stage.status])}>
            {stage.status.replace("_", " ")}
          </Badge>
        </li>
      ))}
    </ol>
  );
}
