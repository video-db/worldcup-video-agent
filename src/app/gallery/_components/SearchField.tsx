"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

export function SearchField({ initialSearch }: { initialSearch: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(initialSearch);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const pushSearch = useCallback(
    (text: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("page");
      if (text) {
        params.set("search", text);
      } else {
        params.delete("search");
      }
      const query = params.toString();
      router.push(query ? `/gallery?${query}` : "/gallery", { scroll: false });
    },
    [router, searchParams],
  );

  useEffect(() => {
    setValue(searchParams.get("search") ?? "");
  }, [searchParams]);

  function onChange(text: string) {
    setValue(text);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => pushSearch(text), 300);
  }

  return (
    <div className="w-[280px]">
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search briefings…"
        className="w-full rounded-full border border-white/10 bg-[#161616] px-5 py-3 text-[15px] text-white outline-none transition-all duration-200 placeholder:text-white/55 focus:border-[#F24E1E] focus:shadow-[0_1px_2px_rgba(0,0,0,0.4),0_8px_24px_rgba(242,78,30,0.12)]"
      />
    </div>
  );
}
