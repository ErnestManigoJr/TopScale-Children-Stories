"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { fetchProjects } from "@/lib/api-client";
import type { Project } from "@/lib/types";

const STATUS_BADGE: Record<Project["status"], string> = {
  draft: "bg-muted text-muted-foreground",
  queued: "bg-blue-100 text-blue-700",
  processing: "bg-blue-100 text-blue-700",
  completed: "bg-green-100 text-green-700",
  failed: "bg-red-100 text-red-700",
  needs_review: "bg-amber-100 text-amber-700",
};

function projectHref(project: Project): string {
  if (project.status === "draft" || project.status === "queued" || project.status === "processing") {
    return `/projects/${project.id}/generating`;
  }
  return `/projects/${project.id}`;
}

export default function LibraryPage() {
  const [projects, setProjects] = useState<Project[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProjects()
      .then(setProjects)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load projects"));
  }, []);

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="mb-6 text-2xl font-semibold">Your cartoons</h1>

      {error && <p className="text-sm text-destructive">{error}</p>}
      {!error && projects === null && <p className="text-sm text-muted-foreground">Loading…</p>}
      {projects?.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No cartoons yet. <Link href="/" className="underline">Create your first one.</Link>
        </p>
      )}

      <div className="flex flex-col gap-3">
        {projects?.map((project) => (
          <Link key={project.id} href={projectHref(project)}>
            <Card className="rounded-xl transition-shadow hover:shadow-md">
              <CardContent className="flex items-center justify-between gap-4 p-4">
                <div>
                  <p className="font-medium">{project.title}</p>
                  <p className="text-xs text-muted-foreground">
                    Runtime: {project.finalRender?.duration ?? project.runtimeTarget} · Updated{" "}
                    {new Date(project.updatedAt).toLocaleString()}
                  </p>
                </div>
                <Badge className={STATUS_BADGE[project.status]}>{project.status.replace("_", " ")}</Badge>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
