"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import type { BriefingEvent } from "@/lib/demo-data";

type TimelineEvent = { type: string; text?: string; toolCall?: { name: string; status: string; summary: string; details?: unknown }; error?: string; runId?: string };

type RunDetail = {
  runId: string;
  query: string;
  topic?: string;
  status: string;
  mode?: string;
  selectedVideo?: { title?: string; url?: string; videoType?: string; duration?: string; match?: string };
  playerUrl?: string;
  streamUrl?: string;
  thumbnailUrl?: string;
  events?: BriefingEvent[];
  timeline?: TimelineEvent[];
  summary?: string;
  statusMessage?: string;
  statusHistory?: Array<{ ts: string; msg: string }>;
  errorMessage?: string;
  createdAt?: string;
  completedAt?: string;
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
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function BriefingPage() {
  const params = useParams();
  const runId = params.runId as string;
  const [run, setRun] = useState<RunDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [copied, setCopied] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const prevStatusRef = useRef<string | undefined>(undefined);

  const fetchRun = useCallback(async () => {
    try {
      const headers: Record<string, string> = {};
      const sessionToken = localStorage.getItem("session_token");
      if (sessionToken) headers["x-session-token"] = sessionToken;
      const res = await fetch(`/api/run-status/${runId}`, { headers });
      if (res.status === 404) { setNotFound(true); setLoading(false); return; }
      const data = await res.json();
      setRun(data);
      setLoading(false);
      return data;
    } catch {
      setLoading(false);
    }
  }, [runId]);

  useEffect(() => {
    fetchRun().then((data) => {
      if (data?.status === "processing") {
        pollRef.current = setInterval(async () => {
          const updated = await fetchRun();
          if (updated && updated.status !== "processing" && pollRef.current) {
            clearInterval(pollRef.current);
          }
        }, 2000);
      }
    });
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [fetchRun]);

  useEffect(() => {
    if (!run) return;
    const prev = prevStatusRef.current;
    prevStatusRef.current = run.status;

    if (run.status === "processing") {
      if (scrollRef.current) {
        scrollRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
      }
    } else if (prev === "processing") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [run]);

  function copyUrl() {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  }

  function openPlayer() {
    if (!run?.playerUrl) {
      alert("Reel not available.");
      return;
    }
    window.open(run.playerUrl, "_blank");
  }

  const embedUrl = run?.streamUrl ? `https://console.videodb.io/player?url=${encodeURIComponent(run.streamUrl)}` : undefined;

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-[15px] text-[#a8a399]">Loading briefing...</div>
      </div>
    );
  }

  if (notFound || !run) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 py-20">
        <p className="text-[15px] text-[#625d55]">Briefing not found.</p>
        <Link href="/" className="rounded-full bg-[#FF6700] px-4 py-2 text-[13px] font-bold text-white hover:bg-[#e35c00]">
          Go home
        </Link>
      </div>
    );
  }

  const shortId = run.runId.slice(0, 8);

  return (
    <div className="flex-1">
      <div className="mx-auto max-w-[1060px] px-[22px] pt-5 pb-24">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-[7px] rounded-full border border-[#ece9e1] bg-white px-[13px] py-[7px] text-[13px] font-semibold text-[#5c574e] hover:border-[#fecb8b] active:scale-[0.98] transition-transform"
          >
            ← Briefings
          </Link>
          <div className="flex items-center gap-[9px]">
            {run.status === "completed" && run.playerUrl ? (
              <button
                type="button"
                onClick={openPlayer}
                className="inline-flex items-center gap-[6px] rounded-full border border-[#ece9e1] bg-white px-[13px] py-[7px] text-[13px] font-semibold text-[#5c574e] hover:border-[#fecb8b] active:scale-[0.98] transition-transform"
              >
                ↗ Open
              </button>
            ) : null}
            <button
              type="button"
              onClick={copyUrl}
              className="inline-flex items-center gap-[6px] rounded-full border border-[#ece9e1] bg-white px-[13px] py-[7px] text-[13px] font-semibold text-[#5c574e] hover:border-[#fecb8b] active:scale-[0.98] transition-transform"
            >
              <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg> {copied ? "Link copied ✓" : "Share"}
            </button>
          </div>
        </div>

        {run.status === "failed" ? (
          <>
            <div className="mt-[18px] flex items-center gap-[10px]">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#e8cfc9] bg-[#f3e3e0] px-3 py-[5px] text-[11.5px] font-bold tracking-[0.02em] text-[#b14a3e]">
                FAILED
              </span>
              <span className="font-mono text-[12px] text-[#a8a399]">run {shortId}</span>
            </div>
            <h1 className="mt-3 max-w-[640px] text-[24px] font-extrabold tracking-[-0.02em] text-[#1f1f1e]">{run.query}</h1>
            <div className="mt-[22px] max-w-[560px] rounded-[14px] border border-[#e8cfc9] bg-[#fbf0ee] p-[18px]">
              <p className="text-[14px] font-bold text-[#9a3d31]">We couldn&apos;t finish this reel</p>
              <p className="mt-1.5 text-[13px] leading-relaxed text-[#a86b61]">
                {run.errorMessage || "No usable match footage was found for this query. Try a different match or rephrase the moment you're after."}
              </p>
              <Link
                href="/"
                className="mt-[14px] inline-flex items-center rounded-[11px] bg-[#FF6700] px-4 py-2.5 text-[13px] font-bold text-white shadow-[0_2px_10px_rgba(255,103,0,0.24)] hover:bg-[#e35c00]"
              >
                Try another query
              </Link>
            </div>
          </>
        ) : run.status === "processing" ? (
          <>
            <div className="mt-[18px] flex items-center gap-3">
              <span className="inline-flex items-center gap-[7px] rounded-full border border-[#ecdcc0] bg-[#f6ecdd] px-[13px] py-1.5">
                <span className="status-dot-running size-2 rounded-full bg-[#b9772a]" />
                <span className="text-[12px] font-bold tracking-[0.02em] text-[#9a6320]">PROCESSING</span>
              </span>
              <span className="font-mono text-[12px] text-[#a8a399]">run {shortId}</span>
            </div>
            <h1 className="mt-[14px] max-w-[720px] text-[25px] font-extrabold leading-[1.2] tracking-[-0.02em] text-[#1f1f1e]">{run.query}</h1>
            <div className="mx-auto mt-[26px] max-w-[720px] space-y-4">
              <div className="flex justify-end">
                <div className="max-w-[80%] rounded-[18px_18px_6px_18px] bg-[#e9e9dc] px-4 py-[11px] text-[14.5px] text-[#2a2822]">{run.query}</div>
              </div>
              <div className="space-y-[13px]">
                {run.timeline && run.timeline.length > 0 ? (
                  <>
                    <TimelineView events={run.timeline} />
                    <StatusHistory cards={run.statusHistory} />
                  </>
                ) : (
                  <StatusHistory cards={run.statusHistory} fallback={run.statusMessage} />
                )}
                <div ref={scrollRef} />
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="mt-[18px] flex items-start justify-between gap-[18px] flex-wrap">
              <div className="min-w-[260px]">
                <div className="flex items-center gap-[10px]">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-[#d3e6e1] bg-[#e8f0ee] px-3 py-[5px]">
                    <span className="size-[7px] rounded-full bg-[#1b7064]" />
                    <span className="text-[11.5px] font-bold tracking-[0.02em] text-[#1b7064]">READY</span>
                  </span>
                  <span className="font-mono text-[12px] text-[#a8a399]">run {shortId}</span>
                </div>
                <h1 className="mt-3 text-[26px] font-extrabold tracking-[-0.02em] text-[#1f1f1e]">{run.topic || run.query}</h1>
                {run.topic && run.topic !== run.query ? (
                  <p className="mt-1.5 text-[14.5px] text-[#7a756b]">{run.query}</p>
                ) : null}
              </div>
            </div>

            <div className="relative mt-5 aspect-video overflow-hidden rounded-[18px] bg-[#141312] shadow-[0_1px_2px_rgba(31,31,30,0.06),0_18px_44px_rgba(31,31,30,0.16)]">
              {embedUrl ? (
                <iframe
                  src={embedUrl}
                  className="absolute inset-0 size-full"
                  allow="autoplay; fullscreen; picture-in-picture"
                  allowFullScreen
                  title="Briefing reel"
                />
              ) : (
                <div className="flex size-full items-center justify-center text-[14px] text-[#a8a399]">
                  Player not available
                </div>
              )}
            </div>

            {run.summary ? (
              <div className="mt-5 rounded-[14px] border border-[#ece9e1] bg-white p-5">
                <p className="mb-[9px] text-[11px] font-bold tracking-[0.06em] text-[#bdb6a9]">MATCH SUMMARY</p>
                <div className="text-[14px] leading-relaxed text-[#3f3a32] prose-sm prose-p:my-1.5 prose-strong:text-[#1f1f1e]">
                  <ReactMarkdown>{run.summary}</ReactMarkdown>
                </div>
              </div>
            ) : null}

            <div className="mt-[26px] grid items-start gap-6 grid-cols-1 md:grid-cols-[1fr_300px]">
              <div>
                <h3 className="mb-1 text-[16px] font-bold text-[#1f1f1e]">Moments</h3>
                {run.events && run.events.length > 0 ? (
                  <>
                    <p className="mb-3 text-[13px] text-[#a8a399]">{run.events.length} moments</p>
                    <div className="flex flex-col">
                      {run.events.map((ev, i) => (
                        <div
                          key={i}
                          className="grid grid-cols-[30px_70px_1fr] items-center gap-3 border-b border-[#f0ede5] px-3 py-3 rounded-[10px]"
                        >
                          <span className="font-mono text-[12px] text-[#c4bdb0]">{i + 1}</span>
                          <span className="font-mono text-[13px] font-medium text-[#ff6700]">{ev.timestamp || "—"}</span>
                          <span>
                            <span className="block text-[14px] font-semibold text-[#1f1f1e]">{ev.label || `Event ${i + 1}`}</span>
                            {ev.query ? (
                              <span className="mt-px block text-[12.5px] text-[#a8a399] line-clamp-1">{ev.query}</span>
                            ) : null}
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <p className="text-[13px] text-[#a8a399]">No moment timestamps available for this reel.</p>
                )}
              </div>

              <div className="flex flex-col gap-[14px]">
                {run.selectedVideo ? (
                  <div className="rounded-[14px] border border-[#ece9e1] bg-white p-4">
                    <p className="mb-[9px] text-[11px] font-bold tracking-[0.06em] text-[#bdb6a9]">SOURCE VIDEO</p>
                    <a
                      href={run.selectedVideo.url || "#"}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[13.5px] font-semibold leading-relaxed text-[#ff6700] no-underline hover:underline"
                    >
                      {run.selectedVideo.title || "Unknown video"} ↗
                    </a>
                  </div>
                ) : null}
                <div className="rounded-[14px] border border-[#ece9e1] bg-white p-4">
                  <p className="mb-[9px] text-[11px] font-bold tracking-[0.06em] text-[#bdb6a9]">RUN DETAILS</p>
                  <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between text-[12.5px]"><span className="text-[#a8a399]">Run ID</span><span className="font-mono text-[#5c574e]">{shortId}</span></div>
                    <div className="flex justify-between text-[12.5px]"><span className="text-[#a8a399]">Created</span><span className="text-[#5c574e]">{relativeTime(run.createdAt)}</span></div>
                    <div className="flex justify-between text-[12.5px]"><span className="text-[#a8a399]">Mode</span><span className="font-semibold text-[#1b7064]">{run.mode || "live"}</span></div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function StatusHistory({ cards, fallback }: { cards?: Array<{ ts: string; msg: string }>; fallback?: string }) {
  if (cards && cards.length > 0) {
    return (
      <>
        {cards.map((entry, i) => {
          const isLast = i === cards.length - 1;
          const isActive = isLast && i < cards.length;
          return (
            <div key={i} className="flex items-center gap-[10px] rounded-[14px] border border-[#ece9e1] bg-white p-[15px]">
              <div className="flex items-center gap-[10px] flex-1">
                {isActive ? (
                  <span className="size-[18px] flex-none rounded-full border-2 border-[#f0e6d2] border-t-[#b9772a] animate-spin" />
                ) : (
                  <Image src="/brand/icon-videodb.png" alt="" width={18} height={18} className="size-[18px] rounded-[4px] flex-none" />
                )}
                <span className="text-[13.5px] font-bold text-[#1f1f1e]">{entry.msg}</span>
              </div>
            </div>
          );
        })}
      </>
    );
  }
  return (
    <div className="flex items-center gap-[10px] rounded-[14px] border border-[#ece9e1] bg-white p-[15px]">
      <div className="flex items-center gap-[10px] flex-1">
        <span className="size-[18px] flex-none rounded-full border-2 border-[#f0e6d2] border-t-[#b9772a] animate-spin" />
        <span className="text-[13.5px] font-bold text-[#1f1f1e]">{fallback || "Creating your highlight..."}</span>
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
                {tc.status === "done" ? (
                  <Image src="/brand/icon-videodb.png" alt="" width={18} height={18} className="size-[18px] rounded-[4px] flex-none" />
                ) : (
                  <span className="size-[18px] rounded-full border-2 border-[#f0e6d2] border-t-[#b9772a] animate-spin" />
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
