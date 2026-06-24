"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import ConfirmModal from "@/components/ConfirmModal";
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
  const [clearConfirm, setClearConfirm] = useState(false);
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

  const [theme, setTheme] = useState<"dark" | "light">("dark");
  useEffect(() => {
    const stored = document.documentElement.classList.contains("theme-light") ? "light" : "dark";
    setTheme(stored);
  }, []);
  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("theme", next);
    document.documentElement.classList.remove("theme-dark", "theme-light");
    document.documentElement.classList.add(`theme-${next}`);
  }

  if (!keysLoaded) return null;

  return (
    <>
      <header className="ds-header-nav flex items-center justify-between px-[22px] h-[62px]">
        <Link href="/" className="flex items-center gap-[10px] select-none shrink-0 py-1.5">
          <img src="/brand/videodb-wordmark-dark.png" alt="VideoDB" className="show-on-dark h-[18px] w-auto" />
          <img src="/brand/videodb-wordmark-light.png" alt="VideoDB" className="show-on-light h-[18px] w-auto" />
          <span className="text-[20px] font-light text-[var(--c-text-faint)] mx-[5px]">×</span>
          <img src="/brand/TF_Horizontal_light.svg" alt="TinyFish" className="show-on-dark h-[21px] w-auto" />
          <img src="/brand/TF_Horizontal.svg" alt="TinyFish" className="show-on-light h-[21px] w-auto" />
          <span className="ml-1.5 block h-4 w-px bg-[var(--c-border-strong)]" />
          <span className="font-mono text-[11px] font-medium uppercase tracking-[0.16em] text-[var(--c-text-subtle)]">Briefing</span>
        </Link>

        <div className="flex items-center gap-[10px]">
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
            className="flex size-[34px] items-center justify-center rounded-full border border-[var(--c-border)] bg-[var(--c-hover)] text-[var(--c-text-muted)] transition-all duration-200 hover:border-[#F24E1E]/60 hover:text-[var(--c-text)] active:scale-[0.95]"
          >
            {theme === "dark" ? (
              <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
            ) : (
              <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>
            )}
          </button>
          {hasSession ? (
            <>
              <Link href="/schedules" className="ds-btn ds-btn--primary ds-btn--sm">
                <svg aria-hidden="true" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> Schedules
              </Link>
              <div ref={accountRef} className="relative">
                <button
                  type="button"
                  onClick={() => setAccountOpen(!accountOpen)}
                  aria-label="API keys active — click to manage"
                  className="flex items-center gap-1.5 rounded-full border border-[var(--c-border)] bg-[var(--c-hover)] px-[10px] py-[7px] text-[12.5px] font-semibold text-[var(--c-text-muted)] whitespace-nowrap transition-all duration-200 hover:border-[#F24E1E]/60 hover:text-[var(--c-text)] active:scale-[0.98]"
                >
                  <span className="size-2 rounded-full bg-[#F24E1E] flex-none" />
                  API
                  <svg aria-hidden="true" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--c-text-faint)]"><path d="m6 9 6 6 6-6"/></svg>
                </button>
                {accountOpen ? (
                  <div className="absolute right-0 top-full mt-1.5 w-[312px] rounded-[16px] border border-[var(--c-border)] bg-[var(--c-surface)] p-2 shadow-[0_12px_40px_rgba(0,0,0,0.5)] animate-rise">
                    <div className="px-3 py-2.5">
                      <p className="text-[13.5px] font-semibold text-[var(--c-text)]">Your keys</p>
                      <p className="mt-1 text-[12px] text-[var(--c-text-faint)]">Stored in your browser only.</p>
                    </div>
                    <div className="flex flex-col gap-1.5 px-1.5">
                      <div className="flex items-center justify-between rounded-[10px] bg-[var(--c-hover)] px-[11px] py-[9px]">
                        <span className="text-[12.5px] font-semibold text-[var(--c-text-muted)]">TinyFish</span>
                        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#F24E1E]">Configured</span>
                      </div>
                      <div className="flex items-center justify-between rounded-[10px] bg-[var(--c-hover)] px-[11px] py-[9px]">
                        <span className="text-[12.5px] font-semibold text-[var(--c-text-muted)]">VideoDB</span>
                        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#F24E1E]">Configured</span>
                      </div>
                    </div>
                    <div className="mx-1.5 my-2.5 h-px bg-[var(--c-border)]" />
                    <Link
                      href="/me"
                      onClick={() => setAccountOpen(false)}
                      className="flex items-center justify-between rounded-[10px] px-3 py-[9px] text-[13px] font-semibold text-[var(--c-text-muted)] hover:bg-[var(--c-hover)]"
                    >
                      My briefings<span className="text-[var(--c-text-faint)]">→</span>
                    </Link>
                    <button
                      type="button"
                      onClick={() => setClearConfirm(true)}
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
              <Link href="/schedules" className="ds-btn ds-btn--ghost-dark ds-btn--sm">
                <svg aria-hidden="true" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> Schedules
              </Link>
              <button
                type="button"
                data-header-add-keys
                onClick={() => setKeyPanelOpen(true)}
                className="ds-btn ds-btn--primary ds-btn--sm"
              >
                Add API keys
              </button>
            </>
          )}
        </div>
      </header>

      <ConfirmModal
        open={clearConfirm}
        title="Clear API keys?"
        confirmLabel="Clear keys"
        danger
        onConfirm={clearKeys}
        onClose={() => setClearConfirm(false)}
      >
        <p>This will remove your API keys from this browser. You will need to re-add them to access your schedules and briefings.</p>
      </ConfirmModal>

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
