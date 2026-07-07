import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { fixGlitches } from "@/lib/pipeline/runner";

export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const flaggedCount = await db.shot.count({
    where: { projectId: id, OR: [{ qualityStatus: "flagged" }, { renderStatus: "failed" }] },
  });
  if (flaggedCount === 0) {
    return NextResponse.json({ started: false, fixedShotCount: 0 });
  }

  // Flip status to "processing" before responding so a client that
  // immediately navigates to the generating page never sees a stale
  // completed/needs_review status and bounces back prematurely.
  await db.project.update({ where: { id }, data: { status: "processing" } });

  // Fire-and-forget the rest so the client can watch stages re-run live.
  void fixGlitches(id).catch((err) => {
    console.error(`Fix Glitches failed for project ${id}:`, err);
  });

  return NextResponse.json({ started: true });
}
