"use client";

import Link from "next/link";

export function MySchedules() {
  if (typeof window !== "undefined" && !localStorage.getItem("session_token")) {
    return null;
  }

  return (
    <section className="pt-12 text-center">
      <Link
        href="/schedules"
        className="rounded-full border border-white/10 bg-[#161616] px-4 py-2 text-[13px] text-white/70 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#F24E1E] hover:text-white hover:shadow-[0_4px_14px_rgba(242,78,30,0.18)] active:translate-y-0 inline-block"
      >
        📅 Manage Schedules → 
      </Link>
    </section>
  );
}
