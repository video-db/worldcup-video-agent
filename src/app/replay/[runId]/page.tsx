"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import ReactMarkdown from "react-markdown";

type BriefingEvent = {
  label?: string;
  query?: string;
  timestamp?: string;
};

type RunDetail = {
  runId: string;
  query: string;
  topic?: string;
  status: string;
  selectedVideo?: { title?: string; url?: string; videoType?: string; duration?: string; match?: string };
  events?: BriefingEvent[];
  statusHistory?: Array<{ ts: string; msg: string }>;
};

type TimelineEvent = {
  type: string;
  text?: string;
  toolCall?: {
    name: string;
    status: string;
    summary: string;
    details?: unknown;
  };
};

type ReplayItem = {
  event: TimelineEvent;
  delayMs: number;
};

function buildReplayItems(run: RunDetail | null): ReplayItem[] {
  const query = run?.query || "World Cup briefing";
  const topic = run?.topic || query;
  const sourceTitle = run?.selectedVideo?.title || "Best matching source video";
  const sourceUrl = run?.selectedVideo?.url || "#";
  const events = run?.events || [];
  const eventText = events.length
    ? events.slice(0, 4).map((event) => `${event.label || "Moment"}${event.timestamp ? ` (${event.timestamp})` : ""}`).join(", ")
    : "the strongest matching moments";

  return [
    {
      event: {
        type: "tool",
        toolCall: {
          name: "TinyFish research",
          status: "done",
          summary: `Researching: "${query}"`,
          details: {
            results: [{ title: sourceTitle, url: sourceUrl }],
          },
        },
      },
      delayMs: 3000,
    },
    {
      event: {
        type: "tool",
        toolCall: {
          name: "TinyFish search",
          status: "done",
          summary: "Returned candidate football videos.",
          details: {
            results: [{ title: sourceTitle, url: sourceUrl }],
          },
        },
      },
      delayMs: 3000,
    },
    {
      event: {
        type: "text-delta",
        text: `Great, I found strong match context and source footage for **${query}**. I’m choosing the best video candidate for the reel now.`,
      },
      delayMs: 2000,
    },
    {
      event: {
        type: "text-delta",
        text: `Selected **${sourceTitle}**. Now handing it to VideoDB to upload, index visual scenes, and search for match moments.`,
      },
      delayMs: 2000,
    },
    {
      event: {
        type: "tool",
        toolCall: {
          name: "VideoDB reel",
          status: "running",
          summary: "Building your reel...",
        },
      },
      delayMs: 3000,
    },
    {
      event: {
        type: "tool",
        toolCall: {
          name: "VideoDB reel",
          status: "running",
          summary: "Uploading video to VideoDB...",
        },
      },
      delayMs: 5000,
    },
    {
      event: {
        type: "tool",
        toolCall: {
          name: "VideoDB reel",
          status: "running",
          summary: "Building scene index...",
        },
      },
      delayMs: 5000,
    },
    {
      event: {
        type: "tool",
        toolCall: {
          name: "VideoDB reel",
          status: "running",
          summary: "Searching for key moments...",
        },
      },
      delayMs: 3000,
    },
    {
      event: {
        type: "tool",
        toolCall: {
          name: "VideoDB reel",
          status: "running",
          summary: "Compiling reel...",
        },
      },
      delayMs: 3000,
    },
    {
      event: {
        type: "tool",
        toolCall: {
          name: "VideoDB reel",
          status: "done",
          summary: `Compiled ${events.length || "multiple"} moments into a playable reel.`,
        },
      },
      delayMs: 3000,
    },
    {
      event: {
        type: "text-delta",
        text: `VideoDB scene search matched ${eventText}. The reel for **${topic}** is ready.`,
      },
      delayMs: 2000,
    },
  ];
}

export default function ReplayPage() {
  const params = useParams();
  const router = useRouter();
  const runId = params.runId as string;
  const [run, setRun] = useState<RunDetail | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [visibleCount, setVisibleCount] = useState(0);
  const redirectedRef = useRef(false);

  const replayItems = useMemo(() => buildReplayItems(run), [run]);
  const timeline = useMemo(() => replayItems.slice(0, visibleCount).map((item) => item.event), [replayItems, visibleCount]);

  useEffect(() => {
    let cancelled = false;

    async function loadRun() {
      try {
        const res = await fetch(`/api/run-status/${runId}`);
        if (res.status === 404) {
          if (!cancelled) setNotFound(true);
          return;
        }
        const data = await res.json();
        if (!cancelled) setRun(data);
      } catch {
        if (!cancelled) setNotFound(true);
      }
    }

    loadRun();
    return () => { cancelled = true; };
  }, [runId]);

  useEffect(() => {
    if (notFound) return;
    if (visibleCount >= replayItems.length) return;

    const delay = visibleCount === 0 ? 450 : replayItems[visibleCount - 1].delayMs;
    const timer = setTimeout(() => {
      setVisibleCount((current) => Math.min(current + 1, replayItems.length));
    }, delay);
    return () => clearTimeout(timer);
  }, [notFound, replayItems, visibleCount]);

  useEffect(() => {
    if (notFound || redirectedRef.current) return;
    if (visibleCount >= replayItems.length) {
      redirectedRef.current = true;
      const timer = setTimeout(() => router.push(`/b/${runId}`), 3000);
      return () => clearTimeout(timer);
    }
  }, [notFound, replayItems.length, router, runId, visibleCount]);

  if (notFound) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 py-20">
        <p className="text-[15px] text-[#625d55]">Briefing not found.</p>
        <Link href="/" className="rounded-full bg-[#FF6700] px-4 py-2 text-[13px] font-bold text-white hover:bg-[#e35c00]">
          Go home
        </Link>
      </div>
    );
  }

  const query = run?.query || "Preparing your briefing...";
  const shortId = runId.slice(0, 8);

  return (
    <div className="flex-1">
      <div className="mx-auto max-w-[1060px] px-[22px] pt-5 pb-24">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-[7px] rounded-full border border-[#ece9e1] bg-white px-[13px] py-[7px] text-[13px] font-semibold text-[#5c574e] hover:border-[#fecb8b]"
          >
            ← Briefings
          </Link>
          <button
            type="button"
            onClick={() => router.push(`/b/${runId}`)}
            className="inline-flex items-center gap-[6px] rounded-full border border-[#ece9e1] bg-white px-[13px] py-[7px] text-[13px] font-semibold text-[#5c574e] hover:border-[#fecb8b]"
          >
            Skip replay →
          </button>
        </div>

        <div className="mt-[18px] flex items-center gap-3">
          <span className="inline-flex items-center gap-[7px] rounded-full border border-[#ecdcc0] bg-[#f6ecdd] px-[13px] py-1.5">
            <span className="status-dot-running size-2 rounded-full bg-[#b9772a]" />
            <span className="text-[12px] font-bold tracking-[0.02em] text-[#9a6320]">PROCESSING</span>
          </span>
          <span className="font-mono text-[12px] text-[#a8a399]">run {shortId}</span>
        </div>
        <h1 className="mt-[14px] max-w-[720px] text-[25px] font-extrabold leading-[1.2] tracking-[-0.02em] text-[#1f1f1e]">{query}</h1>

        <div className="mx-auto mt-[26px] max-w-[720px] space-y-4">
          <div className="flex justify-end">
            <div className="max-w-[80%] rounded-[18px_18px_6px_18px] bg-[#e9e9dc] px-4 py-[11px] text-[14.5px] text-[#2a2822]">{query}</div>
          </div>
          <div className="space-y-[13px]">
            <TimelineView events={timeline} />
          </div>
        </div>
      </div>
    </div>
  );
}

function TimelineView({ events }: { events: TimelineEvent[] }) {
  const items: Array<{ type: "text"; text: string } | { type: "tool"; tc: TimelineEvent["toolCall"] }> = [];
  let textBuf = "";

  for (const ev of events) {
    if (ev.type === "text-delta" && ev.text) {
      textBuf += ev.text;
    } else {
      if (textBuf.trim()) { items.push({ type: "text", text: textBuf.trim() }); textBuf = ""; }
      if (ev.type === "tool" && ev.toolCall) {
        items.push({ type: "tool", tc: ev.toolCall });
      }
    }
  }
  if (textBuf.trim()) items.push({ type: "text", text: textBuf.trim() });
  const lastVideoDbIndex = items.findLastIndex(
    (item) => item.type === "tool" && item.tc?.name.includes("VideoDB"),
  );
  const activeVideoDbIndex =
    lastVideoDbIndex >= 0 &&
    items[lastVideoDbIndex].type === "tool" &&
    items[lastVideoDbIndex].tc?.status !== "done"
      ? lastVideoDbIndex
      : -1;

  return (
    <div className="space-y-[13px]">
      {items.map((item, i) => {
        if (item.type === "text") {
          return (
            <div key={i} className="flex items-start gap-[10px]">
              <div className="text-[14px] leading-relaxed text-[#2a2822] prose-sm prose-p:my-1 prose-strong:text-[#1f1f1e] prose-em:text-[#5c574e] [&_p]:mb-1.5 [&_ol]:my-2 [&_ol]:pl-5 [&_li]:mb-1 [&_li]:pl-0.5">
                <ReactMarkdown>{item.text}</ReactMarkdown>
              </div>
            </div>
          );
        }
        const tc = item.tc!;
        const isTinyFish = tc.name.includes("TinyFish");
        const isActiveVideoDb = !isTinyFish && i === activeVideoDbIndex;
        return (
          <div key={i} className="rounded-[14px] border border-[#ece9e1] bg-white overflow-hidden">
            {isTinyFish ? (
              <>
                <div className="flex items-center gap-[10px] border-b border-[#f0ede5] px-4 py-[13px]">
                  <Image src="/brand/icon-tinyfish.png" alt="" width={18} height={18} className="size-[18px] rounded-[4px] flex-none" />
                  <span className="text-[13.5px] font-bold text-[#1f1f1e]">TinyFish · {tc.summary}</span>
                </div>
                {tc.details && (tc.details as { results?: Array<{ title: string; url: string }> }).results?.[0] ? (
                  <div className="px-4 py-[13px]">
                    <p className="text-[11px] font-bold tracking-[0.06em] text-[#bdb6a9]">SELECTED SOURCE</p>
                    <a
                      href={(tc.details as { results?: Array<{ title: string; url: string }> }).results?.[0]?.url || "#"}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1.5 inline-block text-[14px] font-semibold text-[#ff6700] hover:underline"
                    >
                      {(tc.details as { results?: Array<{ title: string }> }).results?.[0]?.title}
                    </a>
                  </div>
                ) : null}
              </>
            ) : (
              <div className="flex items-center gap-[10px] px-4 py-[13px]">
                {isActiveVideoDb ? (
                  <span className="size-[18px] rounded-full border-2 border-[#f0e6d2] border-t-[#b9772a] animate-spin" />
                ) : (
                  <Image src="/brand/icon-videodb.png" alt="" width={18} height={18} className="size-[18px] rounded-[4px] flex-none" />
                )}
                <span className="text-[13.5px] font-bold text-[#1f1f1e]">VideoDB · {tc.summary}</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
