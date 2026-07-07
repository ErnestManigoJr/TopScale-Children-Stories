import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createProject } from "@/lib/pipeline/runner";
import { serializeProject } from "@/lib/serializers";

export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const original = await db.project.findUnique({ where: { id } });
  if (!original) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }
  const project = await createProject(original.originalUserInput);
  return NextResponse.json({ project: serializeProject(project) }, { status: 201 });
}
