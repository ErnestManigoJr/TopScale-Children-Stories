"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { createProjectRequest } from "@/lib/api-client";
import { SAMPLE_STORY_INPUT } from "@/lib/providers/mock/shared";

const STACK_STEPS = [
  "Story brain expands your idea into a full script",
  "Character bible + visual style keep everyone consistent",
  "Kling animates the scenes, HeyGen handles the talking parts",
  "FFmpeg edits it together, Topaz polishes the final cut",
];

export default function HomePage() {
  const router = useRouter();
  const [input, setInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate() {
    if (!input.trim() || isSubmitting) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const project = await createProjectRequest(input.trim());
      router.push(`/projects/${project.id}/generating`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col items-center gap-8 px-6 py-16 text-center">
      <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
        Turn a rough children&apos;s story into a{" "}
        <span className="text-orange-500">2-minute animated cartoon</span>.
      </h1>
      <p className="max-w-xl text-lg text-muted-foreground">
        Paste a rough idea. Soup Stack automatically writes the script, designs the characters, animates every
        scene, and hands you a finished cartoon short.
      </p>

      <Card className="w-full rounded-2xl shadow-sm">
        <CardContent className="flex flex-col gap-4 p-6">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Paste your story idea here…"
            className="min-h-32 resize-none text-base"
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Button
              variant="ghost"
              type="button"
              onClick={() => setInput(SAMPLE_STORY_INPUT)}
              disabled={isSubmitting}
            >
              Try sample story
            </Button>
            <Button size="lg" className="w-full sm:w-auto" onClick={handleCreate} disabled={!input.trim() || isSubmitting}>
              {isSubmitting ? "Starting..." : "Create Cartoon"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <p className="text-sm text-muted-foreground">
        🛡️ Every cartoon is automatically adapted for child-safe storytelling.
      </p>

      <div className="grid w-full gap-3 sm:grid-cols-2">
        {STACK_STEPS.map((step) => (
          <Card key={step} className="rounded-xl border-orange-100 bg-orange-50/50 text-left">
            <CardContent className="p-4 text-sm text-muted-foreground">{step}</CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
