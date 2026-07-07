"use client";

import { use, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PipelineStageList } from "@/components/pipeline-stage-list";
import { useProject } from "@/hooks/use-project";

export default function GeneratingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { project, error } = useProject(id);
  const router = useRouter();

  useEffect(() => {
    if (project && (project.status === "completed" || project.status === "needs_review")) {
      router.replace(`/projects/${id}`);
    }
  }, [project, id, router]);

  if (error) {
    return (
      <div className="mx-auto max-w-xl px-6 py-16 text-center text-destructive">
        Couldn&apos;t load this project: {error}
      </div>
    );
  }

  if (!project) {
    return <div className="mx-auto max-w-xl px-6 py-16 text-center text-muted-foreground">Loading…</div>;
  }

  const activeStage = project.pipelineStatus.find((s) => s.status === "processing");

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-8 px-6 py-12">
      <div className="text-center">
        <h1 className="text-2xl font-semibold">Making your cartoon…</h1>
        <p className="mt-2 text-muted-foreground">
          {activeStage ? activeStage.label + "…" : "Wrapping things up…"}
        </p>
      </div>

      {project.status === "failed" && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="flex flex-col gap-3 p-4 text-sm text-red-700">
            <p>Something went wrong while generating this cartoon. {project.errorLog[0]}</p>
            <Button
              size="sm"
              variant="outline"
              className="self-start"
              nativeButton={false}
              render={<Link href={`/projects/${id}`} />}
            >
              View details &amp; Regenerate
            </Button>
          </CardContent>
        </Card>
      )}

      <PipelineStageList stages={project.pipelineStatus} />

      {project.story && (
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="text-base">{project.story.title}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">{project.story.logline}</CardContent>
        </Card>
      )}

      {!!project.characters?.length && (
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="text-base">Characters</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {project.characters.map((c) => (
              <span key={c.id} className="rounded-full bg-orange-100 px-3 py-1 text-sm text-orange-800">
                {c.name}
              </span>
            ))}
          </CardContent>
        </Card>
      )}

      {!!project.shots?.length && (
        <p className="text-center text-sm text-muted-foreground">
          {project.shots.filter((s) => s.renderStatus === "completed").length} / {project.shots.length} scenes
          rendered
        </p>
      )}
    </div>
  );
}
