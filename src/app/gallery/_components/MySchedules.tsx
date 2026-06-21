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
        className="rounded-full border border-[#e5e1d8] bg-white px-4 py-2 text-[13px] text-[#625d55] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#FECB8B] hover:text-[#20201f] hover:shadow-[0_4px_14px_rgba(255,103,0,0.12)] active:translate-y-0 inline-block"
      >
        📅 Manage Schedules → 
      </Link>
    </section>
  );
}
