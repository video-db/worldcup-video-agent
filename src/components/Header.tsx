"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import KeyModal from "@/components/KeyModal";

export default function Header() {
  const [tfKey, setTfKey] = useState("");
  const [vdbKey, setVdbKey] = useState("");
  const [sessionToken, setSessionToken] = useState("");
  const [keysLoaded, setKeysLoaded] = useState(false);
  const [keyPanelOpen, setKeyPanelOpen] = useState(false);
  const [keysValidating, setKeysValidating] = useState(false);
  const [keysError, setKeysError] = useState("");
  const [accountOpen, setAccountOpen] = useState(false);
  const accountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSessionToken(localStorage.getItem("session_token") || "");
    setKeysLoaded(true);
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (accountRef.current && !accountRef.current.contains(e.target as Node)) {
        setAccountOpen(false);
      }
    }
    if (accountOpen) {
      document.addEventListener("mousedown", handleClick);
      return () => document.removeEventListener("mousedown", handleClick);
    }
  }, [accountOpen]);

  const hasSession = Boolean(sessionToken);

  async function saveKeys() {
    if (!tfKey.trim() || !vdbKey.trim()) return;
    setKeysValidating(true);
    setKeysError("");
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tfApiKey: tfKey, vdbApiKey: vdbKey }),
      });
      const data = await res.json();
      if (!res.ok) {
        setKeysError(data.error || "Invalid keys");
        setKeysValidating(false);
        return;
      }
      localStorage.setItem("session_token", data.token);
      setSessionToken(data.token);
      window.dispatchEvent(new Event("session_changed"));
      setTfKey("");
      setVdbKey("");
      setKeysValidating(false);
      setKeyPanelOpen(false);
    } catch {
      setKeysError("Could not validate keys. Check your connection.");
      setKeysValidating(false);
    }
  }

  function clearKeys() {
    localStorage.removeItem("session_token");
    setSessionToken("");
    window.dispatchEvent(new Event("session_changed"));
    setAccountOpen(false);
  }

  if (!keysLoaded) return null;

  return (
    <>
      <header
        className="sticky top-0 z-40 flex items-center justify-between border-b border-[#ece9e1] px-[22px] h-[62px]"
        style={{ background: "rgba(251,251,247,0.82)", backdropFilter: "blur(12px)" }}
      >
        <Link href="/" className="flex items-center gap-[10px] select-none shrink-0 py-1.5">
          <img
            src="/brand/VideoDB_wordmark.png"
            alt="VideoDB"
            className="h-[18px] w-auto"
          />
          <span className="text-[20px] font-bold text-[#1f1f1e] mx-[5px]">×</span>
          <img
            src="/brand/TF_Horizontal.svg"
            alt="TinyFish"
            className="h-[21px] w-auto"
          />
          <span className="ml-1.5 block h-4 w-px bg-[#dfdcd2]" />
          <span className="text-[13px] font-medium text-[#8a857c]">Briefing</span>
        </Link>

        <div className="flex items-center gap-[10px]">
          {hasSession ? (
            <>
              <Link
                href="/schedules"
                className="flex items-center gap-1.5 rounded-full bg-[#FF6700] px-[15px] py-2 text-[13px] font-bold text-white shadow-[0_2px_8px_rgba(255,103,0,0.22)] transition-all duration-200 hover:bg-[#e35c00] active:scale-[0.98]"
              >
                <svg aria-hidden="true" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> Schedules
              </Link>
              <div ref={accountRef} className="relative">
                <button
                  type="button"
                  onClick={() => setAccountOpen(!accountOpen)}
                  aria-label="API keys active — click to manage"
                  className="flex items-center gap-1.5 rounded-full border border-[#ece9e1] bg-white px-[10px] py-[7px] text-[12.5px] font-semibold text-[#5c574e] whitespace-nowrap transition-all duration-200 hover:border-[#fecb8b] active:scale-[0.98]"
                >
                  <span className="size-2 rounded-full bg-[#1b7064] flex-none" />
                  API
                  <svg aria-hidden="true" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#a8a399]"><path d="m6 9 6 6 6-6"/></svg>
                </button>
                {accountOpen ? (
                  <div className="absolute right-0 top-full mt-1.5 w-[312px] rounded-[16px] border border-[#ece9e1] bg-white p-2 shadow-[0_12px_40px_rgba(31,31,30,0.16)] animate-rise">
                    <div className="px-3 py-2.5">
                      <p className="text-[13.5px] font-bold text-[#1f1f1e]">Your keys</p>
                      <p className="mt-1 text-[12px] text-[#a8a399]">Stored in your browser only.</p>
                    </div>
                    <div className="flex flex-col gap-1.5 px-1.5">
                      <div className="flex items-center justify-between rounded-[10px] bg-[#f7f5ef] px-[11px] py-[9px]">
                        <span className="text-[12.5px] font-semibold text-[#5c574e]">TinyFish</span>
                        <span className="text-[12px] text-[#8a857c]">Configured</span>
                      </div>
                      <div className="flex items-center justify-between rounded-[10px] bg-[#f7f5ef] px-[11px] py-[9px]">
                        <span className="text-[12.5px] font-semibold text-[#5c574e]">VideoDB</span>
                        <span className="text-[12px] text-[#8a857c]">Configured</span>
                      </div>
                    </div>
                    <div className="mx-1.5 my-2.5 h-px bg-[#f0ede5]" />
                    <Link
                      href="/me"
                      onClick={() => setAccountOpen(false)}
                      className="flex items-center justify-between rounded-[10px] px-3 py-[9px] text-[13px] font-semibold text-[#3f3a32] hover:bg-[#f3f1ea]"
                    >
                      My briefings<span className="text-[#c4bdb0]">→</span>
                    </Link>
                    <button
                      type="button"
                      onClick={clearKeys}
                      className="flex w-full items-center rounded-[10px] px-3 py-[9px] text-[13px] font-semibold text-[#b14a3e] hover:bg-[#fef2f2]"
                    >
                      Clear keys
                    </button>
                  </div>
                ) : null}
              </div>
            </>
          ) : (
            <>
              <Link
                href="/schedules"
                className="flex items-center gap-1.5 rounded-full border border-[#ece9e1] bg-white px-[13px] py-[7px] text-[13px] font-semibold text-[#5c574e] whitespace-nowrap transition-all duration-200 hover:border-[#fecb8b] hover:text-[#1f1f1e]"
              >
                <svg aria-hidden="true" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> Schedules
              </Link>
              <button
                type="button"
                data-header-add-keys
                onClick={() => setKeyPanelOpen(true)}
                className="flex items-center gap-1.5 rounded-full bg-[#FF6700] px-[15px] py-2 text-[13px] font-bold text-white shadow-[0_2px_8px_rgba(255,103,0,0.22)] transition-all duration-200 hover:bg-[#e35c00] active:scale-[0.98]"
              >
                Add API keys
              </button>
            </>
          )}
        </div>
      </header>

      {keyPanelOpen ? (
        <KeyModal
          tfKey={tfKey}
          vdbKey={vdbKey}
          onTfKeyChange={setTfKey}
          onVdbKeyChange={setVdbKey}
          onSave={saveKeys}
          validating={keysValidating}
          error={keysError}
          onClose={() => {
            setKeyPanelOpen(false);
            setKeysError("");
            setTfKey("");
            setVdbKey("");
          }}
        />
      ) : null}
    </>
  );
}
