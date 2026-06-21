"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import BriefingCard from "@/components/BriefingCard";
import { Pagination } from "@/components/Pagination";

type RunItem = {
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

function MyBriefingsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [runs, setRuns] = useState<RunItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasKeys, setHasKeys] = useState(false);
  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const searchParam = searchParams.get("search") ?? "";

  const pushSearch = useCallback(
    (text: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (text) {
        params.set("search", text);
      } else {
        params.delete("search");
      }
      const query = params.toString();
      router.push(query ? `/me?${query}` : "/me", { scroll: false });
    },
    [router, searchParams],
  );

  function onSearch(text: string) {
    setSearch(text);
    setPage(1);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => pushSearch(text), 300);
  }

  useEffect(() => {
    const token = localStorage.getItem("session_token");
    if (token) setHasKeys(true);
  }, []);

  useEffect(() => {
    if (!hasKeys) {
      setLoading(false);
      return;
    }
    let cancelled = false;

    async function fetchRuns() {
      const sessionToken = localStorage.getItem("session_token");
      if (!sessionToken) return;
      const url = new URL("/api/my-runs", window.location.origin);
      if (searchParam) url.searchParams.set("search", searchParam);
      url.searchParams.set("page", String(page));
      url.searchParams.set("limit", "15");
      const res = await fetch(url.toString(), {
        headers: { "x-session-token": sessionToken },
      });
      const data = await res.json();
      if (cancelled) return;
      const next = (data.runs || []) as RunItem[];
      setRuns(next);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 0);

      if (next.some((r) => r.status === "processing")) {
        if (!pollRef.current) {
          pollRef.current = setInterval(fetchRuns, 10000);
        }
      } else if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    }

    async function initialLoad() {
      setLoading(true);
      try {
        await fetchRuns();
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    initialLoad();
    return () => {
      cancelled = true;
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [hasKeys, searchParam, page]);

  const handlePageChange = useCallback((p: number) => {
    setPage(p);
  }, []);

  if (!hasKeys) {
    return (
      <div className="flex-1">
        <div className="mx-auto max-w-[1080px] px-[22px] pt-5 pb-24">
          <Link
            href="/"
            className="inline-flex items-center gap-[7px] rounded-full border border-[#ece9e1] bg-white px-[13px] py-[7px] text-[13px] font-semibold text-[#5c574e] hover:border-[#fecb8b]"
          >
            ← Home
          </Link>
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-[15px] text-[#625d55]">Add your API keys to see your briefings.</p>
            <p className="mt-1 text-[13px] text-[#a8a399]">
              Use the &ldquo;Add API keys&rdquo; button in the header.
            </p>
          </div>
        </div>
      </div>
    );
  }

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
            <h1 className="text-[27px] font-extrabold tracking-[-0.02em] text-[#1f1f1e]">My briefings</h1>
            {!loading ? (
              <p className="mt-1.5 text-[14px] text-[#a8a399]">
                Every reel you&apos;ve generated · {total} {searchParam ? "matched" : "total"}
              </p>
            ) : null}
          </div>
          <div className="flex items-center gap-[9px]">
            <div className="flex items-center gap-[9px] rounded-full border border-[#ece9e1] bg-white px-[14px] py-[9px] shadow-[0_1px_2px_rgba(31,31,30,0.04)]">
              <span className="text-[14px] text-[#bdb6a9]">⌕</span>
              <input
                type="text"
                value={search}
                onChange={(e) => onSearch(e.target.value)}
                placeholder="Search your briefings…"
                className="w-[180px] border-none bg-transparent text-[14px] text-[#1f1f1e] outline-none placeholder:text-[#a8a399]"
              />
            </div>
            <Link
              href="/"
              className="flex items-center gap-1.5 rounded-full bg-[#FF6700] px-4 py-2.5 text-[13px] font-bold text-white shadow-[0_2px_10px_rgba(255,103,0,0.24)] hover:bg-[#e35c00]"
            >
              + New briefing
            </Link>
          </div>
        </div>

        {loading ? (
          <div
            className="mt-[22px] grid gap-[18px]"
            style={{ gridTemplateColumns: "repeat(auto-fill, minmax(248px, 1fr))" }}
          >
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="animate-pulse rounded-[16px] border border-[#ece9e1] bg-white"
              >
                <div className="aspect-video rounded-t-[15px] bg-[#e9e9dc]" />
                <div className="p-4 space-y-3">
                  <div className="h-4 w-3/4 rounded bg-[#e9e9dc]" />
                  <div className="h-3 w-full rounded bg-[#e9e9dc]" />
                  <div className="h-3 w-1/3 rounded bg-[#e9e9dc]" />
                </div>
              </div>
            ))}
          </div>
        ) : runs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-[15px] text-[#625d55]">
              {searchParam ? "No briefings match your search." : "No briefings yet."}
            </p>
            <Link href="/" className="mt-3 text-[13px] font-bold text-[#ff6700] hover:underline">
              Create your first briefing →
            </Link>
          </div>
        ) : (
          <>
            <div
              className="mt-[22px] grid gap-[18px]"
              style={{ gridTemplateColumns: "repeat(auto-fill, minmax(248px, 1fr))" }}
            >
              {runs.map((run) => (
                <BriefingCard key={run.id} run={run} />
              ))}
            </div>
            <Pagination page={page} totalPages={totalPages} onPageChange={handlePageChange} />
          </>
        )}
      </div>
    </div>
  );
}

export default function MyBriefings() {
  return (
    <Suspense fallback={
      <div className="flex-1">
        <div className="mx-auto max-w-[1080px] px-[22px] pt-5 pb-24">
          <div className="mt-[22px] grid gap-[18px]" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(248px, 1fr))" }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="animate-pulse rounded-[16px] border border-[#ece9e1] bg-white">
                <div className="aspect-video rounded-t-[15px] bg-[#e9e9dc]" />
                <div className="p-4 space-y-3">
                  <div className="h-4 w-3/4 rounded bg-[#e9e9dc]" />
                  <div className="h-3 w-full rounded bg-[#e9e9dc]" />
                  <div className="h-3 w-1/3 rounded bg-[#e9e9dc]" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    }>
      <MyBriefingsContent />
    </Suspense>
  );
}
