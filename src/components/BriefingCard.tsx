"use client";

import React from "react";
import { useRouter } from "next/navigation";

type BriefingCardRun = {
  id: string;
  query?: string;
  topic?: string;
  status?: string;
  player_url?: string;
  thumbnail_url?: string;
  summary?: string;
  events?: unknown[];
  created_at?: string;
};

function relativeTime(iso: string | undefined): string {
  if (!iso) return "";
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

function StatusBadge({ status }: { status?: string }) {
  if (!status || status === "completed") {
    return (
      <span className="inline-flex items-center gap-[5px] rounded-full bg-[rgba(27,112,100,0.92)] px-[9px] py-1 text-[10.5px] font-bold tracking-[0.03em] text-white backdrop-blur">
        <span className="size-1.5 rounded-full bg-[#9fe6d6]" />
        READY
      </span>
    );
  }
  if (status === "processing") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-[rgba(185,119,42,0.92)] px-[9px] py-1 text-[10.5px] font-bold tracking-[0.03em] text-white">
        <span className="status-dot-running size-1.5 rounded-full bg-[#f6d9aa]" />
        PROCESSING
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-[5px] rounded-full bg-[rgba(177,74,62,0.92)] px-[9px] py-1 text-[10.5px] font-bold tracking-[0.03em] text-white">
      FAILED
    </span>
  );
}

function FallbackThumbnail({ label }: { label: string }) {
  const colors = [
    "from-[#1b2838] via-[#1e3048] to-[#162230]",
    "from-[#4a1e2a] via-[#5a2633] to-[#3d1822]",
    "from-[#1e3a2a] via-[#264d35] to-[#182e21]",
    "from-[#2d1a3a] via-[#3a224a] to-[#24142e]",
    "from-[#1a2e33] via-[#223d45] to-[#14252a]",
    "from-[#3a2a1e] via-[#4d3828] to-[#2e1e14]",
  ];
  let hash = 0;
  for (let i = 0; i < label.length; i += 1) { hash = ((hash << 5) - hash) + label.charCodeAt(i); hash |= 0; }
  const h = Math.abs(hash);
  const bg = colors[h % colors.length];
  const pattern = ["stripes-h", "circles", "stripes-v", "dots", "crosshatch"][(h >> 3) % 5];
  const accent = patterns[pattern].accent;

  return (
    <div className={`absolute inset-0 flex items-center justify-center bg-gradient-to-b ${bg}`}>
      <svg viewBox="0 0 400 225" className="absolute inset-0 size-full">
        {patterns[pattern].draw()}
      </svg>
      <span className="relative z-10 text-center text-[13px] font-semibold text-white/60 max-w-[80%] truncate px-3">
        {label}
      </span>
    </div>
  );
}

const patterns: Record<string, { accent: string; draw: () => React.ReactElement[] }> = {
  "stripes-h": {
    accent: "rgba(255,255,255,0.08)",
    draw: () => Array.from({ length: 8 }).map((_, i) => (
      <line key={i} x1="0" y1={i * 32 + 8} x2="400" y2={i * 32 + 8} stroke="rgba(255,255,255,0.08)" strokeWidth="12" />
    )),
  },
  circles: {
    accent: "rgba(255,255,255,0.08)",
    draw: () => {
      const els: React.ReactElement[] = [];
      for (let row = 0; row < 5; row++) for (let col = 0; col < 6; col++) els.push(<circle key={`${row}-${col}`} cx={40 + col * 72} cy={20 + row * 56} r="18" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8" />);
      return els;
    },
  },
  "stripes-v": {
    accent: "rgba(255,255,255,0.08)",
    draw: () => Array.from({ length: 10 }).map((_, i) => (
      <line key={i} x1={i * 44 + 10} y1="0" x2={i * 44 + 10} y2="225" stroke="rgba(255,255,255,0.08)" strokeWidth="12" />
    )),
  },
  dots: {
    accent: "rgba(255,255,255,0.08)",
    draw: () => {
      const els: React.ReactElement[] = [];
      for (let row = 0; row < 5; row++) for (let col = 0; col < 8; col++) els.push(<circle key={`${row}-${col}`} cx={30 + col * 50} cy={20 + row * 52} r="6" fill="rgba(255,255,255,0.08)" />);
      return els;
    },
  },
  crosshatch: {
    accent: "rgba(255,255,255,0.08)",
    draw: () => Array.from({ length: 10 }).map((_, i) => (
      <line key={i} x1={i * 48} y1="0" x2={i * 48 + 225} y2="225" stroke="rgba(255,255,255,0.08)" strokeWidth="5" />
    )),
  },
};

export default function BriefingCard({ run }: { run: BriefingCardRun }) {
  const router = useRouter();
  const title = run.topic || run.query || "Untitled briefing";
  const subtitle = run.summary || run.query || "";
  const eventCount = Array.isArray(run.events) ? run.events.length : 0;
  const momentsText = eventCount ? `${eventCount} moments` : "";

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        router.push(`/b/${run.id}`);
      }}
      className="group block w-full text-left rounded-[16px] border border-[#ece9e1] bg-white shadow-[0_1px_2px_rgba(31,31,30,0.04)] transition-all duration-[180ms] hover:-translate-y-[3px] hover:border-[#fecb8b] hover:shadow-[0_10px_26px_rgba(255,103,0,0.12)] overflow-hidden"
    >
      <div className="relative aspect-video bg-[#1f1f1e] overflow-hidden">
        {run.thumbnail_url ? (
          <img
            src={run.thumbnail_url}
            alt={title}
            className="absolute inset-0 size-full object-cover"
            loading="lazy"
          />
        ) : (
          <FallbackThumbnail label={title} />
        )}
        <div className="absolute top-[10px] left-[10px]">
          <StatusBadge status={run.status} />
        </div>
      </div>
      <div className="px-[15px] pt-[13px] pb-[15px]">
        <p className="text-[14.5px] font-bold text-[#1f1f1e] line-clamp-1">{title}</p>
        <p className="mt-[5px] text-[13px] text-[#7a756b] line-clamp-2 leading-[1.4]">{subtitle}</p>
        <div className="mt-[11px] flex items-center gap-2 text-[12px] text-[#a8a399]">
          {momentsText ? <span>{momentsText}</span> : null}
          {momentsText ? <span className="size-[3px] rounded-full bg-[#d8d3c8]" /> : null}
          <span>{relativeTime(run.created_at)}</span>
        </div>
      </div>
    </button>
  );
}
