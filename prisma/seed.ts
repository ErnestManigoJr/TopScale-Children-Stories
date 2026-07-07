import { db } from "../src/lib/db";
import { runPipeline } from "../src/lib/pipeline/runner";
import { toJson } from "../src/lib/serializers";
import { initialPipelineStatus } from "../src/lib/pipeline/stages";
import { SAMPLE_STORY_INPUT } from "../src/lib/providers/mock/shared";

async function main() {
  const existing = await db.project.findFirst({ where: { originalUserInput: SAMPLE_STORY_INPUT } });
  if (existing) {
    console.log("Sample project already exists:", existing.id);
    return;
  }

  const project = await db.project.create({
    data: {
      title: "The Little Soup Rocket",
      originalUserInput: SAMPLE_STORY_INPUT,
      safeStoryIdea: "",
      ageRange: "",
      lesson: "",
      status: "queued",
      pipelineStatus: toJson(initialPipelineStatus()),
    },
  });

  console.log("Running pipeline for sample project", project.id);
  await runPipeline(project.id);
  console.log("Sample project ready:", project.id);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
