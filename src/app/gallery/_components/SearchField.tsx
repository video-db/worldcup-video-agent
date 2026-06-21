"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export function SearchField({ initialSearch }: { initialSearch: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(initialSearch);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    setValue(searchParams.get("search") ?? "");
  }, [searchParams]);

  function onChange(text: string) {
    setValue(text);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (text) {
        params.set("search", text);
      } else {
        params.delete("search");
      }
      const query = params.toString();
      router.push(query ? `/gallery?${query}` : "/gallery", { scroll: false });
    }, 300);
  }

  return (
    <div className="mx-auto max-w-lg">
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search briefings…"
        className="w-full rounded-full border border-[#e8e4db] bg-white px-5 py-3 text-[15px] outline-none transition-all duration-200 placeholder:text-[#a8a399] focus:border-[#FECB8B] focus:shadow-[0_1px_2px_rgba(32,32,31,0.05),0_8px_24px_rgba(255,103,0,0.08)]"
      />
    </div>
  );
}
