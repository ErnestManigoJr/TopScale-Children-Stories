// Domain types for Soup Stack. These are the "parsed" shapes the app works
// with in memory; Prisma models store list/object fields as JSON strings
// (see lib/serializers.ts for the conversion in both directions).

export type ProjectStatus =
  | "draft"
  | "queued"
  | "processing"
  | "completed"
  | "failed"
  | "needs_review";

export type StageStatus = "pending" | "processing" | "completed" | "failed" | "needs_review";

export const PIPELINE_STAGE_KEYS = [
  "reading_story",
  "child_safety",
  "story_expansion",
  "character_bible",
  "style_guide",
  "shot_list",
  "storyboard",
  "character_references",
  "kling_render",
  "heygen_render",
  "assembly",
  "topaz_cleanup",
  "quality_check",
  "export",
] as const;

export type StageKey = (typeof PIPELINE_STAGE_KEYS)[number];

export const STAGE_LABELS: Record<StageKey, string> = {
  reading_story: "Reading story idea",
  child_safety: "Making it child-safe",
  story_expansion: "Expanding story",
  character_bible: "Creating characters",
  style_guide: "Locking visual style",
  shot_list: "Building shot list",
  storyboard: "Creating storyboard",
  character_references: "Generating character references",
  kling_render: "Rendering animated scenes",
  heygen_render: "Rendering speaking scenes",
  assembly: "Assembling cartoon",
  topaz_cleanup: "Cleaning and polishing final cartoon",
  quality_check: "Checking consistency and glitches",
  export: "Exporting final video",
};

export interface PipelineStage {
  key: StageKey;
  label: string;
  status: StageStatus;
  startedAt?: string;
  completedAt?: string;
  message?: string;
}

export interface Project {
  id: string;
  title: string;
  originalUserInput: string;
  safeStoryIdea: string;
  ageRange: string;
  lesson: string;
  status: ProjectStatus;
  runtimeTarget: string;
  createdAt: string;
  updatedAt: string;
  pipelineStatus: PipelineStage[];
  finalVideoUrl: string | null;
  thumbnailUrl: string | null;
  errorLog: string[];

  story?: Story | null;
  characters?: Character[];
  styleGuide?: StyleGuide | null;
  shots?: Shot[];
  storyboardPanels?: StoryboardPanel[];
  renderJobs?: RenderJob[];
  finalRender?: FinalRender | null;
}

export interface Story {
  id: string;
  projectId: string;
  title: string;
  logline: string;
  fullScript: string;
  narration: string;
  dialogue: string;
  moral: string;
  runtimeEstimate: string;
  safetyNotes: string[];
}

export interface CharacterReferencePrompts {
  front: string;
  side: string;
  expressionSheet: string;
  fullBody: string;
  lineup: string;
}

export interface Character {
  id: string;
  projectId: string;
  name: string;
  role: string;
  personality: string;
  visualDescription: string;
  colorPalette: string[];
  clothing: string;
  faceShape: string;
  expressions: string[];
  movementStyle: string;
  voiceStyle: string;
  catchphrase: string;
  referenceImagePrompts: CharacterReferencePrompts;
  referenceImageUrl: string | null;
}

export interface StyleGuide {
  id: string;
  projectId: string;
  artDirection: string;
  colorPalette: string[];
  lighting: string;
  cameraStyle: string;
  texture: string;
  backgroundRules: string;
  characterRules: string;
  consistencyRules: string;
  negativeStyleRules: string;
}

export type RenderStatus = "pending" | "queued" | "processing" | "completed" | "failed";
export type QualityStatus = "pending" | "passed" | "flagged";

export interface Shot {
  id: string;
  projectId: string;
  shotNumber: number;
  timestampStart: string;
  timestampEnd: string;
  duration: string;
  sceneDescription: string;
  characters: string[];
  action: string;
  cameraMovement: string;
  dialogue: string | null;
  narration: string | null;
  needsLipSync: boolean;
  imagePrompt: string;
  videoPrompt: string;
  negativePrompt: string;
  referenceImageUrls: string[];
  renderedClipUrl: string | null;
  renderStatus: RenderStatus;
  qualityStatus: QualityStatus;
  qualityNotes: string[];
}

export interface StoryboardPanel {
  id: string;
  projectId: string;
  panelNumber: number;
  shotId: string;
  framing: string;
  background: string;
  characterPlacement: string;
  action: string;
  expression: string;
  notes: string;
  imageUrl: string | null;
}

export interface RenderJob {
  id: string;
  projectId: string;
  shotId: string | null;
  provider: "kling" | "heygen" | "topaz" | "editor";
  status: RenderStatus | "queued";
  inputPayload: Record<string, unknown>;
  outputUrl: string | null;
  error: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface QualityReport {
  runtimeOk: boolean;
  allShotsRendered: boolean;
  characterConsistencyOk: boolean;
  noMissingClips: boolean;
  contentSafetyOk: boolean;
  dialogueMatchesScript: boolean;
  lipSyncScenesMarked: boolean;
  noPromptLeakage: boolean;
  noUnintendedTextArtifacts: boolean;
  timelineOrderOk: boolean;
  finalVideoExists: boolean;
  issues: string[];
}

export interface FinalRender {
  id: string;
  projectId: string;
  videoUrl: string;
  duration: string;
  resolution: string;
  fps: number;
  status: "processing" | "completed" | "failed";
  qualityReport: QualityReport | Record<string, never>;
  createdAt: string;
}

// ---- Topaz Video AI (final cleanup/upscale stage) ----

export interface TopazEnhancementInput {
  projectId: string;
  videoUrl: string;
  targetResolution: "1080p" | "4K";
  targetFps: 24 | 30 | 60;
  upscale: boolean;
  denoise: boolean;
  stabilize: boolean;
  deFlicker: boolean;
  sharpen: "none" | "light" | "medium";
  frameInterpolation: "none" | "light" | "standard";
  preserveCartoonTexture: boolean;
}

export interface TopazAnalysisReport {
  videoUrl: string;
  resolution: string;
  fps: number;
  duration: number;
  detectedIssues: string[];
  recommendedSettings: TopazEnhancementInput;
}

export interface TopazEnhancementJob {
  jobId: string;
  status: "queued" | "processing" | "completed" | "failed";
  inputVideoUrl: string;
  estimatedOutputResolution: string;
}

export interface TopazEnhancementStatus {
  jobId: string;
  status: "queued" | "processing" | "completed" | "failed";
  progress: number;
  message: string;
}

export interface TopazEnhancedVideo {
  jobId: string;
  enhancedVideoUrl: string;
  resolution: string;
  fps: number;
  notes: string[];
}
