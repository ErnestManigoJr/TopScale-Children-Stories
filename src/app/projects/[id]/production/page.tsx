"use client";

import { use } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useProject } from "@/hooks/use-project";

export default function ProductionDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { project, error } = useProject(id);

  if (error) return <div className="mx-auto max-w-4xl px-6 py-16 text-destructive">{error}</div>;
  if (!project) return <div className="mx-auto max-w-4xl px-6 py-16 text-muted-foreground">Loading…</div>;

  const editorJob = project.renderJobs?.find((j) => j.provider === "editor");
  const topazJob = project.renderJobs?.find((j) => j.provider === "topaz");
  const editorPayload = (editorJob?.inputPayload ?? {}) as { ffmpegCommand?: string; edlPlan?: string };
  const qualityReport = project.finalRender?.qualityReport as
    | (Record<string, unknown> & { issues?: string[] })
    | undefined;

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 px-6 py-12">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{project.title} - production details</h1>
          <p className="text-sm text-muted-foreground">
            For review and troubleshooting. <Link href={`/projects/${id}`} className="underline">Back to final cartoon</Link>
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" render={<a href={`/api/projects/${id}/export?format=json`} download />}>
            Export packet (JSON)
          </Button>
          <Button variant="outline" size="sm" render={<a href={`/api/projects/${id}/export?format=markdown`} download />}>
            Export packet (Markdown)
          </Button>
        </div>
      </div>

      <Tabs defaultValue="story">
        <TabsList className="flex-wrap">
          <TabsTrigger value="story">Story</TabsTrigger>
          <TabsTrigger value="characters">Character Bible</TabsTrigger>
          <TabsTrigger value="style">Style Guide</TabsTrigger>
          <TabsTrigger value="shots">Shot List</TabsTrigger>
          <TabsTrigger value="storyboard">Storyboard</TabsTrigger>
          <TabsTrigger value="editing">Editing & Topaz</TabsTrigger>
          <TabsTrigger value="quality">Quality Report</TabsTrigger>
        </TabsList>

        <TabsContent value="story" className="mt-4">
          {project.story ? (
            <Card>
              <CardHeader>
                <CardTitle>{project.story.title}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3 text-sm">
                <p><strong>Logline:</strong> {project.story.logline}</p>
                <p><strong>Moral:</strong> {project.story.moral}</p>
                <p><strong>Runtime estimate:</strong> {project.story.runtimeEstimate}</p>
                <Separator />
                <pre className="whitespace-pre-wrap font-sans">{project.story.fullScript}</pre>
              </CardContent>
            </Card>
          ) : (
            <p className="text-sm text-muted-foreground">Story not generated yet.</p>
          )}
        </TabsContent>

        <TabsContent value="characters" className="mt-4 flex flex-col gap-4">
          {project.characters?.map((c) => (
            <Card key={c.id}>
              <CardHeader className="flex flex-row items-center gap-3">
                {c.referenceImageUrl && (
                  <img src={c.referenceImageUrl} alt={c.name} className="h-16 w-16 rounded-lg object-cover" />
                )}
                <div>
                  <CardTitle>{c.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">{c.role}</p>
                </div>
              </CardHeader>
              <CardContent className="grid gap-2 text-sm sm:grid-cols-2">
                <p><strong>Visual:</strong> {c.visualDescription}</p>
                <p><strong>Outfit:</strong> {c.clothing}</p>
                <p><strong>Palette:</strong> {c.colorPalette.join(", ")}</p>
                <p><strong>Movement:</strong> {c.movementStyle}</p>
                <p><strong>Voice:</strong> {c.voiceStyle}</p>
                <p><strong>Catchphrase:</strong> &ldquo;{c.catchphrase}&rdquo;</p>
                <div className="col-span-2">
                  <Separator className="my-2" />
                  <p className="mb-1 font-medium">Reference prompts</p>
                  <ul className="list-inside list-disc text-xs text-muted-foreground">
                    <li>Front: {c.referenceImagePrompts.front}</li>
                    <li>Side: {c.referenceImagePrompts.side}</li>
                    <li>Expression sheet: {c.referenceImagePrompts.expressionSheet}</li>
                    <li>Full body: {c.referenceImagePrompts.fullBody}</li>
                    <li>Lineup: {c.referenceImagePrompts.lineup}</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="style" className="mt-4">
          {project.styleGuide && (
            <Card>
              <CardContent className="grid gap-3 p-5 text-sm sm:grid-cols-2">
                <p className="sm:col-span-2"><strong>Art direction:</strong> {project.styleGuide.artDirection}</p>
                <p><strong>Palette:</strong> {project.styleGuide.colorPalette.join(", ")}</p>
                <p><strong>Lighting:</strong> {project.styleGuide.lighting}</p>
                <p><strong>Camera style:</strong> {project.styleGuide.cameraStyle}</p>
                <p><strong>Texture:</strong> {project.styleGuide.texture}</p>
                <p><strong>Background rules:</strong> {project.styleGuide.backgroundRules}</p>
                <p><strong>Character rules:</strong> {project.styleGuide.characterRules}</p>
                <p className="sm:col-span-2"><strong>Consistency rules:</strong> {project.styleGuide.consistencyRules}</p>
                <p className="sm:col-span-2"><strong>Negative style rules:</strong> {project.styleGuide.negativeStyleRules}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="shots" className="mt-4 flex flex-col gap-3">
          {project.shots?.map((shot) => (
            <Card key={shot.id}>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">
                  Shot {shot.shotNumber} · {shot.timestampStart}-{shot.timestampEnd}
                </CardTitle>
                <div className="flex gap-2">
                  <Badge variant="outline">{shot.needsLipSync ? "HeyGen" : "Kling"}</Badge>
                  <Badge variant="outline">{shot.renderStatus}</Badge>
                  <Badge variant="outline" className={shot.qualityStatus === "flagged" ? "bg-amber-100 text-amber-700" : ""}>
                    {shot.qualityStatus}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-2 text-sm">
                <p><strong>Camera:</strong> {shot.cameraMovement}</p>
                <p><strong>Action:</strong> {shot.action}</p>
                {shot.dialogue && <p><strong>Dialogue:</strong> {shot.dialogue}</p>}
                {shot.narration && <p><strong>Narration:</strong> {shot.narration}</p>}
                <p className="text-xs text-muted-foreground"><strong>Video prompt:</strong> {shot.videoPrompt}</p>
                <p className="text-xs text-muted-foreground"><strong>Negative prompt:</strong> {shot.negativePrompt}</p>
                {shot.qualityNotes.length > 0 && (
                  <p className="text-xs text-amber-700"><strong>Quality notes:</strong> {shot.qualityNotes.join(" ")}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="storyboard" className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {project.storyboardPanels
            ?.slice()
            .sort((a, b) => a.panelNumber - b.panelNumber)
            .map((panel) => (
              <Card key={panel.id}>
                {panel.imageUrl && <img src={panel.imageUrl} alt={`Panel ${panel.panelNumber}`} className="aspect-square w-full rounded-t-xl object-cover" />}
                <CardContent className="p-3 text-xs text-muted-foreground">
                  <p className="font-medium text-foreground">Panel {panel.panelNumber}</p>
                  <p>{panel.framing}</p>
                </CardContent>
              </Card>
            ))}
        </TabsContent>

        <TabsContent value="editing" className="mt-4 flex flex-col gap-4">
          <Card>
            <CardHeader><CardTitle>FFmpeg assembly</CardTitle></CardHeader>
            <CardContent>
              <pre className="overflow-x-auto rounded-lg bg-muted p-3 text-xs">{editorPayload.ffmpegCommand ?? "Not assembled yet."}</pre>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>DaVinci Resolve EDL export plan</CardTitle></CardHeader>
            <CardContent>
              <pre className="overflow-x-auto rounded-lg bg-muted p-3 text-xs">{editorPayload.edlPlan ?? "Not assembled yet."}</pre>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Topaz Video AI cleanup</CardTitle></CardHeader>
            <CardContent className="text-sm">
              {topazJob ? (
                <p>Enhanced video: {topazJob.outputUrl}</p>
              ) : (
                <p className="text-muted-foreground">Not run yet.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="quality" className="mt-4">
          <Card>
            <CardContent className="p-5 text-sm">
              {qualityReport ? (
                <pre className="whitespace-pre-wrap font-sans">{JSON.stringify(qualityReport, null, 2)}</pre>
              ) : (
                <p className="text-muted-foreground">Quality report not available yet.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
