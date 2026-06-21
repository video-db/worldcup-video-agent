"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import BriefingCard from "@/components/BriefingCard";

const suggestions = [
  "highlights of fouls from USA vs Paraguay",
  "all yellow cards from Brazil vs Morocco",
  "penalty moments from Mexico vs South Africa",
  "every goal from France vs Portugal",
];

type PreviewRun = {
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

export default function Home() {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [keysLoaded, setKeysLoaded] = useState(false);
  const [previewRuns, setPreviewRuns] = useState<PreviewRun[]>([]);
  const [previewType, setPreviewType] = useState<"personal" | "public">("public");
  const [previewLoading, setPreviewLoading] = useState(true);
  const [search, setSearch] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [trigger, setTrigger] = useState(0);

  useEffect(() => {
    setKeysLoaded(true);
  }, []);

  useEffect(() => {
    function onSessionChange() { setTrigger((t) => t + 1); }
    window.addEventListener("session_changed", onSessionChange);
    return () => window.removeEventListener("session_changed", onSessionChange);
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target as Node) &&
        e.target !== inputRef.current
      ) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    if (!keysLoaded) return;

    async function fetchMyRuns() {
      const sessionToken = localStorage.getItem("session_token");
      if (!sessionToken) return [];
      try {
        const res = await fetch("/api/my-runs?limit=6", { headers: { "x-session-token": sessionToken } });
        const data = await res.json();
        return (data.runs || []) as PreviewRun[];
      } catch {
        return [];
      }
    }

    async function loadPreview() {
      setPreviewLoading(true);

      const myRuns = await fetchMyRuns();
      if (myRuns.length > 0) {
        setPreviewRuns(myRuns.slice(0, 6));
        setPreviewType("personal");

        if (myRuns.some((r) => r.status === "processing")) {
          if (!pollRef.current) {
            pollRef.current = setInterval(async () => {
              const updated = await fetchMyRuns();
              setPreviewRuns(updated.slice(0, 6));
              setPreviewType("personal");
              if (!updated.some((r) => r.status === "processing") && pollRef.current) {
                clearInterval(pollRef.current);
                pollRef.current = null;
              }
            }, 10000);
          }
        }

        setPreviewLoading(false);
        return;
      }

      try {
        const res = await fetch("/api/gallery?limit=6");
        const data = await res.json();
        setPreviewRuns((data.runs || []).slice(0, 6));
        setPreviewType("public");
      } catch {} finally {
        setPreviewLoading(false);
      }
    }
    loadPreview();

    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [keysLoaded, trigger]);

  function handleSearch(text: string) {
    setSearch(text);
    clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      if (text.trim()) {
        router.push(previewType === "personal" ? `/me?search=${encodeURIComponent(text)}` : `/gallery?search=${encodeURIComponent(text)}`);
      }
    }, 400);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!prompt.trim() || isRunning) return;

    const sessionToken = localStorage.getItem("session_token");
    if (!sessionToken) {
      const addKeysBtn = document.querySelector<HTMLButtonElement>('[data-header-add-keys]');
      addKeysBtn?.click();
      return;
    }

    setIsRunning(true);
    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-session-token": sessionToken,
        },
        body: JSON.stringify({ prompt: prompt.trim() }),
      });

      if (!res.ok || !res.body) {
        setIsRunning(false);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      let found = false;
      while (!found) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";
        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const event = JSON.parse(line);
            if (event.type === "run_id" && event.runId) {
              found = true;
              reader.cancel();
              router.push(`/b/${event.runId}`);
              return;
            }
          } catch {}
        }
      }
      reader.cancel();
    } catch {
    } finally {
      setIsRunning(false);
    }
  }

  function selectSuggestion(text: string) {
    setPrompt(text);
    setShowSuggestions(false);
    inputRef.current?.focus();
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="mx-auto w-full max-w-[1080px] px-[22px] pb-24">
        <section className="pb-[30px] pt-16 text-center">
          <h1 className="mx-auto max-w-[640px] text-[40px] font-extrabold leading-[1.08] tracking-[-0.025em] text-[#1f1f1e]">
            What match moments do you want?
          </h1>
          <p className="mx-auto mt-4 max-w-[480px] text-[16px] leading-relaxed text-[#7a756b]">
            Ask for fouls, goals, cards, or penalties — get back a playable reel in a couple of minutes.
          </p>

          <div className="relative mx-auto mt-[30px] max-w-[640px]">
            <form onSubmit={handleSubmit} className="flex items-center gap-[10px] rounded-full border border-[#e7e3d9] bg-white py-2 pl-5 pr-2 shadow-[0_4px_18px_rgba(31,31,30,0.06)]">
              <input
                ref={inputRef}
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onFocus={() => setShowSuggestions(true)}
                placeholder="Ask for any match moment…"
                disabled={isRunning}
                className="flex-1 border-none bg-transparent py-2 text-[15.5px] text-[#1f1f1e] outline-none placeholder:text-[#a8a399] disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!prompt.trim() || isRunning}
                className="flex items-center gap-2 rounded-full bg-[#FF6700] px-5 py-[11px] text-[14px] font-bold text-white shadow-[0_2px_10px_rgba(255,103,0,0.26)] transition-all duration-200 hover:bg-[#e35c00] active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-[#E9E9DC] disabled:text-[#a8a399] disabled:shadow-none"
              >
                Run<span className="text-[14px]">↵</span>
              </button>
            </form>

            {showSuggestions ? (
              <div
                ref={suggestionsRef}
                className="absolute inset-x-0 top-16 z-20 rounded-[16px] border border-[#ece9e1] bg-white p-2 text-left shadow-[0_14px_40px_rgba(31,31,30,0.14)] animate-rise"
              >
                <p className="mx-3 mb-1.5 mt-2 text-[11px] font-bold tracking-[0.06em] text-[#bdb6a9]">
                  TRY ONE OF THESE
                </p>
                {suggestions.map((ex) => (
                  <button
                    key={ex}
                    type="button"
                    onMouseDown={() => selectSuggestion(ex)}
                    className="flex w-full items-center gap-[11px] rounded-[11px] px-3 py-2.5 text-left hover:bg-[#f3f1ea]"
                  >
                    <span className="flex size-6 flex-none items-center justify-center rounded-[7px] bg-[#f3f1ea] text-[12px] text-[#a8a399]">
                      ⌕
                    </span>
                    <span className="text-[14px] text-[#3f3a32]">{ex}</span>
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </section>

        <section className="mt-[34px]">
          <div className="flex items-end justify-between gap-4 flex-wrap">
            <div>
              <h2 className="text-[20px] font-bold tracking-[-0.01em] text-[#1f1f1e]">
                {previewType === "personal" ? "Your briefings" : "Public briefings"}
              </h2>
              <p className="mt-[5px] text-[13px] text-[#a8a399]">
                {previewType === "personal" ? "Reels you have generated" : "Curated World Cup match moments"}
              </p>
            </div>
            <div className="flex items-center gap-[10px]">
              <div className="flex items-center gap-2 rounded-full border border-[#ece9e1] bg-white px-[13px] py-2">
                <span className="text-[13px] text-[#bdb6a9]">⌕</span>
                <input
                  value={search}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="Search…"
                  className="w-[120px] border-none bg-transparent text-[13.5px] text-[#1f1f1e] outline-none placeholder:text-[#a8a399]"
                />
              </div>
              <Link
                href={previewType === "personal" ? "/me" : "/gallery"}
                className="rounded-full border border-[#ece9e1] bg-white px-[15px] py-[9px] text-[13px] font-semibold text-[#3f3a32] hover:border-[#fecb8b]"
              >
                View all →
              </Link>
            </div>
          </div>

          <div className="mt-5 grid gap-[18px]" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(248px, 1fr))" }}>
            {previewLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="animate-pulse rounded-[16px] border border-[#ece9e1] bg-white">
                  <div className="aspect-video rounded-t-[15px] bg-[#e9e9dc]" />
                  <div className="p-4 space-y-3">
                    <div className="h-4 w-3/4 rounded bg-[#e9e9dc]" />
                    <div className="h-3 w-full rounded bg-[#e9e9dc]" />
                    <div className="h-3 w-1/3 rounded bg-[#e9e9dc]" />
                  </div>
                </div>
              ))
            ) : previewRuns.length === 0 ? (
              <div className="rounded-[16px] border border-[#ece9e1] bg-white p-8 text-center col-span-full">
                <p className="text-[14px] text-[#625d55]">No briefings yet.</p>
                <p className="mt-1 text-[13px] text-[#a8a399]">Create one with the compose bar above.</p>
              </div>
            ) : (
              previewRuns.map((run) => (
                <BriefingCard key={run.id} run={run} />
              ))
            )}
          </div>

          {previewType === "personal" && !previewLoading ? (
            <Link
              href="/gallery"
              className="mt-[18px] flex w-full items-center justify-between rounded-[14px] border border-[#ece9e1] bg-[#f4f2ec] px-5 py-4 hover:border-[#fecb8b]"
            >
              <span className="flex items-center gap-3">
                <span className="inline-flex size-[34px] items-center justify-center rounded-[9px] border border-[#ece9e1] bg-white text-[#ff6700]">◎</span>
                <span>
                  <span className="block text-[14px] font-bold text-[#1f1f1e]">Explore the public gallery</span>
                  <span className="mt-px block text-[12.5px] text-[#a8a399]">Curated World Cup reels from the community</span>
                </span>
              </span>
              <span className="text-[#c4bdb0]">→</span>
            </Link>
          ) : null}
        </section>
      </div>
    </div>
  );
}
