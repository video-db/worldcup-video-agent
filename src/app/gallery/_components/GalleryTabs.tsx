"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useRef, useState } from "react";
import type { GalleryRun } from "../page";
import GalleryGrid from "./GalleryGrid";

export function GalleryTabs({
  publicRuns,
}: {
  publicRuns: GalleryRun[];
}) {
  const [tab, setTab] = useState<"public" | "mine">("public");
  const [myRuns, setMyRuns] = useState<GalleryRun[]>([]);
  const [myRunsLoading, setMyRunsLoading] = useState(false);
  const [myRunsError, setMyRunsError] = useState("");
  const [noKeys, setNoKeys] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (tab !== "mine" || myRuns.length > 0) return;

    const token = localStorage.getItem("session_token");
    if (!token) {
      setNoKeys(true);
      return;
    }
    const sessionToken = token;

    setMyRunsLoading(true);
    setMyRunsError("");

    async function fetchMyRuns() {
      try {
        const res = await fetch("/api/my-runs", {
          headers: { "x-session-token": sessionToken },
        });
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
        setMyRuns(runs);

        if (runs.some((r: GalleryRun) => r.status === "processing")) {
          if (!pollRef.current) {
            pollRef.current = setInterval(fetchMyRuns, 10000);
          }
        } else if (pollRef.current) {
          clearInterval(pollRef.current);
          pollRef.current = null;
        }
      } catch (error) {
        setMyRunsError(error instanceof Error ? error.message : "Failed to load runs");
      }
    }

    fetchMyRuns().finally(() => {
      setMyRunsLoading(false);
    });

    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [tab, myRuns.length]);

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
        <GalleryGrid runs={publicRuns} />
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
        <GalleryGrid runs={myRuns} />
      )}
    </div>
  );
}
