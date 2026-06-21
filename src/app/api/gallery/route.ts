import { and, desc, eq, sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { db, runs } from "@/lib/db";
import { logger } from "@/lib/logger";

export async function GET(request: NextRequest) {
  const search = request.nextUrl.searchParams.get("search") || "";

  try {
    const conditions = [eq(runs.isPublic, true), eq(runs.status, "completed")];
    if (search) {
      conditions.push(sql`${runs.query} ILIKE ${`%${search}%`}`);
    }

    const rows = await db
      .select({
        id: runs.id,
        query: runs.query,
        topic: runs.topic,
        playerUrl: runs.playerUrl,
        thumbnailUrl: runs.thumbnailUrl,
        summary: runs.summary,
        events: runs.events,
        selectedVideo: runs.selectedVideo,
        createdAt: runs.createdAt,
      })
      .from(runs)
      .where(and(...conditions))
      .orderBy(desc(runs.createdAt))
      .limit(50);

    const result = {
      runs: rows.map((row) => ({
        id: row.id,
        query: row.query,
        topic: row.topic,
        player_url: row.playerUrl,
        thumbnail_url: row.thumbnailUrl,
        summary: row.summary,
        events: row.events,
        selected_video: row.selectedVideo,
        created_at: row.createdAt?.toISOString() ?? null,
      })),
      total: rows.length,
    };

    return NextResponse.json(result);
  } catch (error) {
    logger.error({ err: error }, "Gallery API error");
    return NextResponse.json({ runs: [], total: 0 }, { status: 500 });
  }
}
