"use client";

import { useRouter } from "next/navigation";
import type { GalleryRun } from "../page";

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function GalleryGrid({ runs }: { runs: GalleryRun[] }) {
  const router = useRouter();

  if (!runs.length) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-[15px] text-[#625d55]">No briefings found.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-[18px]" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(248px, 1fr))" }}>
      {runs.map((run) => {
        const title = run.topic || run.query;
        const eventCount = Array.isArray(run.events) ? run.events.length : 0;
        const momentsText = eventCount ? `${eventCount} moments` : "";
        return (
          <button
            key={run.id}
            type="button"
            onClick={(e) => {
              e.preventDefault();
              router.push(`/b/${run.id}`);
            }}
            className="group block w-full text-left rounded-[16px] border border-[#ece9e1] bg-white shadow-[0_1px_2px_rgba(31,31,30,0.04)] transition-all duration-[180ms] hover:-translate-y-[3px] hover:border-[#fecb8b] hover:shadow-[0_10px_26px_rgba(255,103,0,0.12)] overflow-hidden"
          >
            <div className="relative aspect-video bg-[#1f1f1e] overflow-hidden">
              {run.thumbnailUrl ? (
                <img
                  src={run.thumbnailUrl}
                  alt={title ?? ""}
                  className="absolute inset-0 size-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-[#2d5a1e] via-[#3a7a2a] to-[#2d5a1e]">
                  <svg viewBox="0 0 400 225" className="absolute inset-0 size-full opacity-20">
                    <rect x="0" y="0" width="400" height="225" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="2" />
                    <line x1="200" y1="0" x2="200" y2="225" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
                    <circle cx="200" cy="112.5" r="40" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
                  </svg>
                  <span className="relative z-10 text-center text-[13px] font-semibold text-white/70 max-w-[80%] truncate px-3">
                    {title}
                  </span>
                </div>
              )}
              {!run.status || run.status === "completed" ? (
                <span className="absolute top-[10px] left-[10px] inline-flex items-center gap-[5px] rounded-full bg-[rgba(27,112,100,0.92)] px-[9px] py-1 text-[10.5px] font-bold tracking-[0.03em] text-white backdrop-blur">
                  <span className="size-1.5 rounded-full bg-[#9fe6d6]" />READY
                </span>
              ) : run.status === "processing" ? (
                <span className="absolute top-[10px] left-[10px] inline-flex items-center gap-[5px] rounded-full bg-[rgba(180,140,30,0.92)] px-[9px] py-1 text-[10.5px] font-bold tracking-[0.03em] text-white backdrop-blur">
                  <span className="size-1.5 rounded-full bg-[#fde68a] animate-pulse" />PROCESSING
                </span>
              ) : (
                <span className="absolute top-[10px] left-[10px] inline-flex items-center rounded-full bg-[rgba(200,40,40,0.92)] px-[9px] py-1 text-[10.5px] font-bold tracking-[0.03em] text-white backdrop-blur">
                  FAILED
                </span>
              )}
              <span className="absolute bottom-[10px] right-[10px] rounded-[7px] bg-[rgba(20,20,19,0.78)] px-2 py-[3px] font-mono text-[11px] text-white">—</span>
            </div>
            <div className="px-[15px] pt-[13px] pb-[15px]">
              <p className="text-[14.5px] font-bold text-[#1f1f1e] line-clamp-1">{title}</p>
              <p className="mt-[5px] text-[13px] text-[#7a756b] line-clamp-2 leading-[1.4]">{run.query}</p>
              <div className="mt-[11px] flex items-center gap-2 text-[12px] text-[#a8a399]">
                {momentsText ? <span>{momentsText}</span> : null}
                {momentsText ? <span className="size-[3px] rounded-full bg-[#d8d3c8]" /> : null}
                <span>{relativeTime(run.createdAt)}</span>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
