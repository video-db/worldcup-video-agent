"use client";

import Link from "next/link";
import { CalendarIcon, ArrowRightIcon } from "@/components/Icons";

export function MySchedules() {
  return (
    <section className="pt-12 text-center">
      <Link
        href="/schedules"
        className="inline-flex items-center gap-1.5 rounded-full border border-[var(--c-border)] bg-[var(--c-surface)] px-4 py-2 text-[13px] text-[var(--c-text-muted)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#F24E1E] hover:text-[var(--c-text)] hover:shadow-[0_4px_14px_rgba(242,78,30,0.18)] active:translate-y-0"
      >
        <CalendarIcon className="size-[15px]" /> Manage Schedules <ArrowRightIcon className="size-3.5" />
      </Link>
    </section>
  );
}
