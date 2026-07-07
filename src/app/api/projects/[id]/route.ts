import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { serializeProject } from "@/lib/serializers";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = await db.project.findUnique({
    where: { id },
    include: {
      story: true,
      characters: true,
      styleGuide: true,
      shots: true,
      storyboardPanels: true,
      renderJobs: { orderBy: { createdAt: "asc" } },
      finalRender: true,
    },
  });

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  return NextResponse.json({ project: serializeProject(project) });
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await db.project.delete({ where: { id } }).catch(() => null);
  return NextResponse.json({ ok: true });
}
