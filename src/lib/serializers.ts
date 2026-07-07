import type {
  Character as CharacterRow,
  FinalRender as FinalRenderRow,
  Project as ProjectRow,
  RenderJob as RenderJobRow,
  Shot as ShotRow,
  Story as StoryRow,
  StoryboardPanel as StoryboardPanelRow,
  StyleGuide as StyleGuideRow,
} from "@prisma/client";
import type {
  Character,
  FinalRender,
  Project,
  QualityReport,
  RenderJob,
  Shot,
  Story,
  StoryboardPanel,
  StyleGuide,
} from "@/lib/types";

function parseJson<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export function toJson(value: unknown): string {
  return JSON.stringify(value ?? null);
}

export function serializeStory(row: StoryRow): Story {
  return { ...row, safetyNotes: parseJson<string[]>(row.safetyNotes, []) };
}

export function serializeCharacter(row: CharacterRow): Character {
  return {
    ...row,
    colorPalette: parseJson<string[]>(row.colorPalette, []),
    expressions: parseJson<string[]>(row.expressions, []),
    referenceImagePrompts: parseJson(row.referenceImagePrompts, {
      front: "",
      side: "",
      expressionSheet: "",
      fullBody: "",
      lineup: "",
    }),
  };
}

export function serializeStyleGuide(row: StyleGuideRow): StyleGuide {
  return { ...row, colorPalette: parseJson<string[]>(row.colorPalette, []) };
}

export function serializeShot(row: ShotRow): Shot {
  return {
    ...row,
    characters: parseJson<string[]>(row.characters, []),
    referenceImageUrls: parseJson<string[]>(row.referenceImageUrls, []),
    qualityNotes: parseJson<string[]>(row.qualityNotes, []),
    renderStatus: row.renderStatus as Shot["renderStatus"],
    qualityStatus: row.qualityStatus as Shot["qualityStatus"],
  };
}

export function serializeStoryboardPanel(row: StoryboardPanelRow): StoryboardPanel {
  return { ...row };
}

export function serializeRenderJob(row: RenderJobRow): RenderJob {
  return {
    ...row,
    provider: row.provider as RenderJob["provider"],
    status: row.status as RenderJob["status"],
    inputPayload: parseJson<Record<string, unknown>>(row.inputPayload, {}),
    createdAt: row.createdAt.toString(),
    updatedAt: row.updatedAt.toString(),
  };
}

export function serializeFinalRender(row: FinalRenderRow): FinalRender {
  return {
    ...row,
    status: row.status as FinalRender["status"],
    qualityReport: parseJson<QualityReport | Record<string, never>>(row.qualityReport, {}),
    createdAt: row.createdAt.toString(),
  };
}

type ProjectWithRelations = ProjectRow & {
  story?: StoryRow | null;
  characters?: CharacterRow[];
  styleGuide?: StyleGuideRow | null;
  shots?: ShotRow[];
  storyboardPanels?: StoryboardPanelRow[];
  renderJobs?: RenderJobRow[];
  finalRender?: FinalRenderRow | null;
};

export function serializeProject(row: ProjectWithRelations): Project {
  return {
    ...row,
    createdAt: row.createdAt.toString(),
    updatedAt: row.updatedAt.toString(),
    status: row.status as Project["status"],
    pipelineStatus: parseJson(row.pipelineStatus, []),
    errorLog: parseJson<string[]>(row.errorLog, []),
    story: row.story ? serializeStory(row.story) : row.story ?? undefined,
    characters: row.characters?.map(serializeCharacter),
    styleGuide: row.styleGuide ? serializeStyleGuide(row.styleGuide) : row.styleGuide ?? undefined,
    shots: row.shots?.map(serializeShot).sort((a, b) => a.shotNumber - b.shotNumber),
    storyboardPanels: row.storyboardPanels?.map(serializeStoryboardPanel),
    renderJobs: row.renderJobs?.map(serializeRenderJob),
    finalRender: row.finalRender ? serializeFinalRender(row.finalRender) : row.finalRender ?? undefined,
  };
}
