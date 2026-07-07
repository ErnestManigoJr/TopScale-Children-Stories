import type { Project } from "@/lib/types";

export function buildProductionPacketMarkdown(project: Project): string {
  const lines: string[] = [];
  const push = (line = "") => lines.push(line);

  push(`# ${project.title}`);
  push();
  push(`**Status:** ${project.status} | **Runtime target:** ${project.runtimeTarget} | **Age range:** ${project.ageRange}`);
  push();
  if (project.story) {
    push(`## Story`);
    push(`**Logline:** ${project.story.logline}`);
    push();
    push(`**Moral:** ${project.story.moral}`);
    push();
    push("**Full script:**");
    push();
    push("```");
    push(project.story.fullScript);
    push("```");
    push();
  }

  if (project.characters?.length) {
    push(`## Character Bible`);
    for (const c of project.characters) {
      push(`### ${c.name} - ${c.role}`);
      push(`- Personality: ${c.personality}`);
      push(`- Visual description: ${c.visualDescription}`);
      push(`- Outfit: ${c.clothing}`);
      push(`- Color palette: ${c.colorPalette.join(", ")}`);
      push(`- Movement style: ${c.movementStyle}`);
      push(`- Voice style: ${c.voiceStyle}`);
      push(`- Catchphrase: "${c.catchphrase}"`);
      if (c.referenceImageUrl) push(`- Reference image: ${c.referenceImageUrl}`);
      push();
      push("**Reference prompts:**");
      push(`- Front: ${c.referenceImagePrompts.front}`);
      push(`- Side: ${c.referenceImagePrompts.side}`);
      push(`- Expression sheet: ${c.referenceImagePrompts.expressionSheet}`);
      push(`- Full body: ${c.referenceImagePrompts.fullBody}`);
      push(`- Lineup: ${c.referenceImagePrompts.lineup}`);
      push();
    }
  }

  if (project.styleGuide) {
    const sg = project.styleGuide;
    push(`## Visual Style Guide`);
    push(`- Art direction: ${sg.artDirection}`);
    push(`- Color palette: ${sg.colorPalette.join(", ")}`);
    push(`- Lighting: ${sg.lighting}`);
    push(`- Camera style: ${sg.cameraStyle}`);
    push(`- Texture: ${sg.texture}`);
    push(`- Background rules: ${sg.backgroundRules}`);
    push(`- Character rules: ${sg.characterRules}`);
    push(`- Consistency rules: ${sg.consistencyRules}`);
    push(`- Negative style rules: ${sg.negativeStyleRules}`);
    push();
  }

  if (project.shots?.length) {
    push(`## Shot List`);
    for (const shot of project.shots) {
      push(`### Shot ${shot.shotNumber} (${shot.timestampStart}-${shot.timestampEnd})`);
      push(`- Camera: ${shot.cameraMovement}`);
      push(`- Action: ${shot.action}`);
      if (shot.dialogue) push(`- Dialogue: ${shot.dialogue}`);
      if (shot.narration) push(`- Narration: ${shot.narration}`);
      push(`- Needs lip-sync: ${shot.needsLipSync ? "Yes (HeyGen)" : "No (Kling)"}`);
      push(`- Render status: ${shot.renderStatus} | Quality: ${shot.qualityStatus}`);
      push();
      push(`**Kling animation prompt:** ${shot.videoPrompt}`);
      push();
      push(`**Negative prompt:** ${shot.negativePrompt}`);
      push();
    }
  }

  const editorJob = project.renderJobs?.find((j) => j.provider === "editor");
  if (editorJob) {
    const payload = editorJob.inputPayload as { ffmpegCommand?: string; edlPlan?: string };
    push(`## Editing Plan`);
    if (payload.ffmpegCommand) {
      push("**FFmpeg assembly command:**");
      push("```");
      push(payload.ffmpegCommand);
      push("```");
      push();
    }
    if (payload.edlPlan) {
      push("**DaVinci Resolve EDL export plan:**");
      push("```");
      push(payload.edlPlan);
      push("```");
      push();
    }
  }

  const topazJob = project.renderJobs?.find((j) => j.provider === "topaz");
  if (topazJob) {
    push(`## Topaz Video AI Cleanup`);
    push(`- Enhanced video: ${topazJob.outputUrl ?? "pending"}`);
    push();
  }

  if (project.finalRender) {
    push(`## Final Render`);
    push(`- Video: ${project.finalRender.videoUrl}`);
    push(`- Duration: ${project.finalRender.duration}`);
    push(`- Resolution: ${project.finalRender.resolution} @ ${project.finalRender.fps}fps`);
    push();
    const report = project.finalRender.qualityReport as Record<string, unknown>;
    if (report && "issues" in report) {
      push("**Quality report:**");
      push("```json");
      push(JSON.stringify(report, null, 2));
      push("```");
    }
  }

  return lines.join("\n");
}
