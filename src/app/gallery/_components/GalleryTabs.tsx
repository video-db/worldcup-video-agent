"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { GalleryRun } from "../page";
import GalleryGrid from "./GalleryGrid";
import { Pagination } from "@/components/Pagination";

type MyRunsMeta = {
  runs: GalleryRun[];
  total: number;
  page: number;
  totalPages: number;
};

export function GalleryTabs({
  publicRuns,
  total: initialTotal,
  page: initialPage,
  totalPages: initialTotalPages,
}: {
  publicRuns: GalleryRun[];
  total: number;
  page: number;
  totalPages: number;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<"public" | "mine">("public");
  const [myData, setMyData] = useState<MyRunsMeta>({ runs: [], total: 0, page: 1, totalPages: 0 });
  const [myRunsLoading, setMyRunsLoading] = useState(false);
  const [myRunsError, setMyRunsError] = useState("");
  const [noKeys, setNoKeys] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const pushPublicPage = useCallback(
    (page: number) => {
      const params = new URLSearchParams(searchParams.toString());
      const search = params.get("search");
      params.forEach((_, key) => params.delete(key));
      if (search) params.set("search", search);
      if (page > 1) params.set("page", String(page));
      const q = params.toString();
      router.push(q ? `/gallery?${q}` : "/gallery", { scroll: false });
    },
    [router, searchParams],
  );

  const fetchMyRuns = useCallback(async (page: number, poll = false) => {
    const token = localStorage.getItem("session_token");
    if (!token) {
      if (!poll) setNoKeys(true);
      return;
    }
    const sessionToken = token;

    if (!poll) setMyRunsLoading(true);
    setMyRunsError("");

    try {
      const url = new URL("/api/my-runs", window.location.origin);
      url.searchParams.set("page", String(page));
      url.searchParams.set("limit", "15");
      const res = await fetch(url.toString(), { headers: { "x-session-token": sessionToken } });
      const data = await res.json();
      const runs = (data.runs || []).map(
        (row: Record<string, unknown>): GalleryRun => ({
          id: row.id as string,
          query: row.query as string,
          topic: (row.topic as string) ?? null,
          playerUrl: (row.player_url as string) ?? "",
          thumbnailUrl: (row.thumbnail_url as string) ?? null,
          summary: (row.summary as string) ?? null,
          events: (row.events ?? []) as GalleryRun["events"],
          selectedVideo: (row.selected_video ?? {}) as GalleryRun["selectedVideo"],
          createdAt: (row.created_at as string) ?? "",
          status: row.status as string | undefined,
        }),
      );
      setMyData({ runs, total: data.total || 0, page: data.page || 1, totalPages: data.totalPages || 0 });

      if (runs.some((r: GalleryRun) => r.status === "processing")) {
        if (!pollRef.current) {
          pollRef.current = setInterval(() => fetchMyRuns(myData.page, true), 10000);
        }
      } else if (pollRef.current && !poll) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    } catch (error) {
      if (!poll) setMyRunsError(error instanceof Error ? error.message : "Failed to load runs");
    } finally {
      if (!poll) setMyRunsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (tab !== "mine" || myData.runs.length > 0) return;

    const token = localStorage.getItem("session_token");
    if (!token) {
      setNoKeys(true);
      return;
    }
    fetchMyRuns(1);

    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [tab, myData.runs.length]);

  return (
    <div>
      <div className="mb-8 flex items-center justify-center gap-1 rounded-full border border-[#eceae3] bg-white p-1">
        <button
          type="button"
          onClick={() => setTab("public")}
          className={`rounded-full px-4 py-1.5 text-[13px] font-medium transition-all duration-200 ${
            tab === "public"
              ? "bg-[#FF6700] text-white shadow-[0_2px_8px_rgba(255,103,0,0.25)]"
              : "text-[#625d55] hover:text-[#20201f]"
          }`}
        >
          Public gallery
        </button>
        <button
          type="button"
          onClick={() => setTab("mine")}
          className={`rounded-full px-4 py-1.5 text-[13px] font-medium transition-all duration-200 ${
            tab === "mine"
              ? "bg-[#FF6700] text-white shadow-[0_2px_8px_rgba(255,103,0,0.25)]"
              : "text-[#625d55] hover:text-[#20201f]"
          }`}
        >
          My runs
        </button>
      </div>

      {tab === "public" ? (
        <>
          <GalleryGrid runs={publicRuns} />
          <Pagination page={initialPage} totalPages={initialTotalPages} onPageChange={pushPublicPage} />
        </>
      ) : noKeys ? (
        <div className="flex flex-col items-center justify-center py-24">
          <p className="text-[15px] text-[#8a857c]">Add your API keys to see your personal run history</p>
          <p className="mt-1 text-[13px] text-[#a8a399]">
            Save your keys on the main page, then come back here.
          </p>
        </div>
      ) : myRunsLoading ? (
        <div className="flex items-center justify-center py-24">
          <svg viewBox="0 0 16 16" className="size-5 shrink-0 animate-spin text-[#FF6700]" fill="none">
            <circle cx="8" cy="8" r="6" stroke="currentColor" strokeOpacity="0.25" strokeWidth="2" />
            <path d="M14 8a6 6 0 00-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
      ) : myRunsError ? (
        <div className="flex flex-col items-center justify-center py-24">
          <p className="text-[15px] text-[#8a857c]">{myRunsError}</p>
        </div>
      ) : (
        <>
          <GalleryGrid runs={myData.runs} />
          <Pagination page={myData.page} totalPages={myData.totalPages} onPageChange={(p) => fetchMyRuns(p)} />
        </>
      )}
    </div>
  );
}
