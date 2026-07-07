-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "originalUserInput" TEXT NOT NULL,
    "safeStoryIdea" TEXT NOT NULL,
    "ageRange" TEXT NOT NULL,
    "lesson" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "runtimeTarget" TEXT NOT NULL DEFAULT '1-2 min',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "pipelineStatus" TEXT NOT NULL DEFAULT '[]',
    "finalVideoUrl" TEXT,
    "thumbnailUrl" TEXT,
    "errorLog" TEXT NOT NULL DEFAULT '[]'
);

-- CreateTable
CREATE TABLE "Story" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "logline" TEXT NOT NULL,
    "fullScript" TEXT NOT NULL,
    "narration" TEXT NOT NULL,
    "dialogue" TEXT NOT NULL,
    "moral" TEXT NOT NULL,
    "runtimeEstimate" TEXT NOT NULL,
    "safetyNotes" TEXT NOT NULL DEFAULT '[]',
    CONSTRAINT "Story_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Character" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "personality" TEXT NOT NULL,
    "visualDescription" TEXT NOT NULL,
    "colorPalette" TEXT NOT NULL DEFAULT '[]',
    "clothing" TEXT NOT NULL,
    "faceShape" TEXT NOT NULL,
    "expressions" TEXT NOT NULL DEFAULT '[]',
    "movementStyle" TEXT NOT NULL,
    "voiceStyle" TEXT NOT NULL,
    "catchphrase" TEXT NOT NULL,
    "referenceImagePrompts" TEXT NOT NULL DEFAULT '{}',
    "referenceImageUrl" TEXT,
    CONSTRAINT "Character_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "StyleGuide" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "artDirection" TEXT NOT NULL,
    "colorPalette" TEXT NOT NULL DEFAULT '[]',
    "lighting" TEXT NOT NULL,
    "cameraStyle" TEXT NOT NULL,
    "texture" TEXT NOT NULL,
    "backgroundRules" TEXT NOT NULL,
    "characterRules" TEXT NOT NULL,
    "consistencyRules" TEXT NOT NULL,
    "negativeStyleRules" TEXT NOT NULL,
    CONSTRAINT "StyleGuide_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Shot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "shotNumber" INTEGER NOT NULL,
    "timestampStart" TEXT NOT NULL,
    "timestampEnd" TEXT NOT NULL,
    "duration" TEXT NOT NULL,
    "sceneDescription" TEXT NOT NULL,
    "characters" TEXT NOT NULL DEFAULT '[]',
    "action" TEXT NOT NULL,
    "cameraMovement" TEXT NOT NULL,
    "dialogue" TEXT,
    "narration" TEXT,
    "needsLipSync" BOOLEAN NOT NULL DEFAULT false,
    "imagePrompt" TEXT NOT NULL,
    "videoPrompt" TEXT NOT NULL,
    "negativePrompt" TEXT NOT NULL,
    "referenceImageUrls" TEXT NOT NULL DEFAULT '[]',
    "renderedClipUrl" TEXT,
    "renderStatus" TEXT NOT NULL DEFAULT 'pending',
    "qualityStatus" TEXT NOT NULL DEFAULT 'pending',
    "qualityNotes" TEXT NOT NULL DEFAULT '[]',
    CONSTRAINT "Shot_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "StoryboardPanel" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "panelNumber" INTEGER NOT NULL,
    "shotId" TEXT NOT NULL,
    "framing" TEXT NOT NULL,
    "background" TEXT NOT NULL,
    "characterPlacement" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "expression" TEXT NOT NULL,
    "notes" TEXT NOT NULL,
    "imageUrl" TEXT,
    CONSTRAINT "StoryboardPanel_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "StoryboardPanel_shotId_fkey" FOREIGN KEY ("shotId") REFERENCES "Shot" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RenderJob" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "shotId" TEXT,
    "provider" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'queued',
    "inputPayload" TEXT NOT NULL DEFAULT '{}',
    "outputUrl" TEXT,
    "error" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "RenderJob_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "RenderJob_shotId_fkey" FOREIGN KEY ("shotId") REFERENCES "Shot" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FinalRender" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "videoUrl" TEXT NOT NULL,
    "duration" TEXT NOT NULL,
    "resolution" TEXT NOT NULL,
    "fps" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'processing',
    "qualityReport" TEXT NOT NULL DEFAULT '{}',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FinalRender_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Story_projectId_key" ON "Story"("projectId");

-- CreateIndex
CREATE INDEX "Character_projectId_idx" ON "Character"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "StyleGuide_projectId_key" ON "StyleGuide"("projectId");

-- CreateIndex
CREATE INDEX "Shot_projectId_idx" ON "Shot"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "StoryboardPanel_shotId_key" ON "StoryboardPanel"("shotId");

-- CreateIndex
CREATE INDEX "StoryboardPanel_projectId_idx" ON "StoryboardPanel"("projectId");

-- CreateIndex
CREATE INDEX "RenderJob_projectId_idx" ON "RenderJob"("projectId");

-- CreateIndex
CREATE INDEX "RenderJob_shotId_idx" ON "RenderJob"("shotId");

-- CreateIndex
CREATE UNIQUE INDEX "FinalRender_projectId_key" ON "FinalRender"("projectId");
