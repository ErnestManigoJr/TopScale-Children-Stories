import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createProject } from "@/lib/pipeline/runner";
import { serializeProject } from "@/lib/serializers";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const originalUserInput = typeof body?.originalUserInput === "string" ? body.originalUserInput.trim() : "";

  if (!originalUserInput) {
    return NextResponse.json({ error: "originalUserInput is required" }, { status: 400 });
  }

  const project = await createProject(originalUserInput);
  return NextResponse.json({ project: serializeProject(project) }, { status: 201 });
}

export async function GET() {
  const projects = await db.project.findMany({
    orderBy: { updatedAt: "desc" },
    include: { finalRender: true },
  });
  return NextResponse.json({ projects: projects.map(serializeProject) });
}
