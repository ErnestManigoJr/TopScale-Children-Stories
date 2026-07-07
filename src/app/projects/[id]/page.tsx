"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CartoonVideoPlayer } from "@/components/cartoon-video-player";
import { useProject } from "@/hooks/use-project";
import { fixGlitchesRequest, regenerateRequest } from "@/lib/api-client";

export default function FinalCartoonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { project, error } = useProject(id);
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => {
    if (project && (project.status === "draft" || project.status === "queued" || project.status === "processing")) {
      router.replace(`/projects/${id}/generating`);
    }
  }, [project, id, router]);

  if (error) {
    return <div className="mx-auto max-w-xl px-6 py-16 text-center text-destructive">Couldn&apos;t load this project: {error}</div>;
  }
  if (!project || project.status === "processing" || project.status === "queued" || project.status === "draft") {
    return <div className="mx-auto max-w-xl px-6 py-16 text-center text-muted-foreground">Loading…</div>;
  }

  const flaggedShots = project.shots?.filter((s) => s.qualityStatus === "flagged" || s.renderStatus === "failed") ?? [];

  async function handleFixGlitches() {
    setBusy("fix");
    setNote(null);
    try {
      const result = await fixGlitchesRequest(id);
      if (result.started) {
        router.push(`/projects/${id}/generating`);
      } else {
        setNote("Nothing to fix - every shot already passed quality checks.");
        setBusy(null);
      }
    } catch (err) {
      setNote(err instanceof Error ? err.message : "Failed to start Fix Glitches");
      setBusy(null);
    }
  }

  async function handleRegenerate() {
    setBusy("regenerate");
    try {
      const fresh = await regenerateRequest(id);
      router.push(`/projects/${fresh.id}/generating`);
    } catch (err) {
      setNote(err instanceof Error ? err.message : "Failed to regenerate");
      setBusy(null);
    }
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-12">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold">{project.title}</h1>
          <p className="text-sm text-muted-foreground">Runtime: {project.finalRender?.duration ?? project.runtimeTarget}</p>
        </div>
        {project.status === "failed" ? (
          <Badge className="bg-red-100 text-red-700">Generation failed</Badge>
        ) : project.status === "needs_review" ? (
          <Badge className="bg-amber-100 text-amber-700">Needs review</Badge>
        ) : (
          <Badge className="bg-green-100 text-green-700">Your cartoon is ready</Badge>
        )}
      </div>

      {project.status === "failed" && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4 text-sm text-red-700">
            This generation failed{project.errorLog[0] ? `: ${project.errorLog[0]}` : "."} Click Regenerate to try again.
          </CardContent>
        </Card>
      )}

      <CartoonVideoPlayer videoUrl={project.finalVideoUrl} thumbnailUrl={project.thumbnailUrl} title={project.title} />

      <Card className="rounded-2xl">
        <CardContent className="flex flex-col gap-3 p-5">
          <p className="text-sm">{project.story?.logline}</p>
          <div className="flex flex-wrap gap-2">
            {project.characters?.map((c) => (
              <span key={c.id} className="rounded-full bg-orange-100 px-3 py-1 text-xs text-orange-800">
                {c.name}
              </span>
            ))}
          </div>
        </CardContent>
      </Card>

      {note && <p className="text-sm text-muted-foreground">{note}</p>}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {project.finalVideoUrl && (
          <Button size="lg" nativeButton={false} render={<a href={project.finalVideoUrl} download />}>
            Download MP4
          </Button>
        )}
        <Button
          variant="outline"
          size="lg"
          nativeButton={false}
          render={<a href={`/api/projects/${id}/export?format=json`} download />}
        >
          Download production packet
        </Button>
        <Button
          variant="outline"
          size="lg"
          nativeButton={false}
          render={<a href={`/api/projects/${id}/export?format=markdown`} download />}
        >
          Export prompts
        </Button>
        <Button variant="outline" size="lg" onClick={handleRegenerate} disabled={busy !== null}>
          {busy === "regenerate" ? "Starting…" : "Regenerate"}
        </Button>
        {flaggedShots.length > 0 && (
          <Button variant="outline" size="lg" onClick={handleFixGlitches} disabled={busy !== null}>
            {busy === "fix" ? "Fixing…" : `Fix Glitches (${flaggedShots.length})`}
          </Button>
        )}
        <Button size="lg" variant="ghost" nativeButton={false} render={<Link href="/" />}>
          Create another cartoon
        </Button>
      </div>

      <Link href={`/projects/${id}/production`} className="text-center text-sm text-muted-foreground underline">
        View full production details
      </Link>
    </div>
  );
}
