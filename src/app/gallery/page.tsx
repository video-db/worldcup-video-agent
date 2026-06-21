import Link from "next/link";
import { and, desc, eq, or, sql, type SQL } from "drizzle-orm";
import { db, runs } from "@/lib/db";
import type { BriefingEvent, VideoCandidate } from "@/lib/demo-data";
import { SearchField } from "./_components/SearchField";

export type GalleryRun = {
  id: string;
  query: string;
  topic: string | null;
  playerUrl: string | null;
  thumbnailUrl: string | null;
  summary: string | null;
  events: BriefingEvent[];
  selectedVideo: VideoCandidate | null;
  createdAt: string;
  status?: string | null;
};

async function getGalleryRuns(search: string): Promise<GalleryRun[]> {
  const conditions: SQL[] = [eq(runs.isPublic, true), eq(runs.status, "completed")];
  if (search) {
    conditions.push(or(
      sql`${runs.query} ILIKE ${`%${search}%`}`,
      sql`${runs.topic} ILIKE ${`%${search}%`}`,
      sql`${runs.summary} ILIKE ${`%${search}%`}`,
    ) as SQL);
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

  return rows.map((row) => ({
    id: row.id,
    query: row.query,
    topic: row.topic,
    playerUrl: row.playerUrl,
    thumbnailUrl: row.thumbnailUrl,
    summary: row.summary,
    events: (row.events as BriefingEvent[]) ?? [],
    selectedVideo: row.selectedVideo as VideoCandidate,
    createdAt: row.createdAt?.toISOString() ?? "",
  }));
}

export default async function GalleryPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>;
}) {
  const params = await searchParams;
  const search = params.search ?? "";
  const runs = await getGalleryRuns(search);
  const GalleryClient = (await import("./_components/GalleryGrid")).default;

  return (
    <div className="flex-1">
      <div className="mx-auto max-w-[1080px] px-[22px] pt-5 pb-24">
        <Link
          href="/"
          className="inline-flex items-center gap-[7px] rounded-full border border-[#ece9e1] bg-white px-[13px] py-[7px] text-[13px] font-semibold text-[#5c574e] hover:border-[#fecb8b]"
        >
          ← Home
        </Link>

        <div className="mt-[18px] flex items-end justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-[27px] font-extrabold tracking-[-0.02em] text-[#1f1f1e]">Public gallery</h1>
            <p className="mt-1.5 text-[14px] text-[#a8a399]">Curated World Cup match moments · {runs.length} reels</p>
          </div>
          <SearchField initialSearch={search} />
        </div>

        <div className="mt-[22px]">
          <GalleryClient runs={runs} />
        </div>
      </div>
    </div>
  );
}
