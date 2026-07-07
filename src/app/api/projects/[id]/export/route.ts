import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { serializeProject } from "@/lib/serializers";
import { buildProductionPacketMarkdown } from "@/lib/export";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const format = request.nextUrl.searchParams.get("format") === "markdown" ? "markdown" : "json";

  const row = await db.project.findUnique({
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
  if (!row) return NextResponse.json({ error: "Project not found" }, { status: 404 });

  const project = serializeProject(row);
  const filenameBase = project.title.replace(/[^a-z0-9]+/gi, "-").toLowerCase();

  if (format === "markdown") {
    return new NextResponse(buildProductionPacketMarkdown(project), {
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filenameBase}-production-packet.md"`,
      },
    });
  }

  return new NextResponse(JSON.stringify(project, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filenameBase}-production-packet.json"`,
    },
  });
}
