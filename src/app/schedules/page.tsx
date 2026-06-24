"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useState } from "react";

import Link from "next/link";
import { getCommonTimezones } from "@/lib/timezone";
import ConfirmModal from "@/components/ConfirmModal";
import ChannelIcon from "@/components/ChannelIcon";
import ModalShell from "@/components/ModalShell";
import LowCreditsBanner from "@/components/LowCreditsBanner";
import { ArrowLeftIcon, ArrowRightIcon, CloseIcon } from "@/components/Icons";
import { DeliveryLoopIllustration, SchedulerStepStrip, PanelAskOnce, PanelPickTime, PanelAgentWorks, PanelDelivered } from "@/components/scheduler-illustrations";

type ChannelItem = { id: string; name: string; type: string; isValidated: boolean };
type ScheduleItem = {
  id: string; query: string; runTime: string; timezone: string; channel: string;
  channelConfig: { channelIds?: string[] }; isActive: boolean;
  nextRunAt: string | null; lastRunAt: string | null; createdAt: string | null;
};

function formatHourMinute(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const hour = h % 12 || 12;
  const ampm = h < 12 ? "AM" : "PM";
  return `${hour}:${m.toString().padStart(2, "0")} ${ampm}`;
}

function relativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);
  if (diffMs < 0) return "now";
  if (diffDay > 0) return diffDay === 1 ? "in 1 day" : `in ${diffDay} days`;
  if (diffHr > 0) return diffHr === 1 ? "in 1 hour" : `in ${diffHr} hours`;
  if (diffMin > 0) return diffMin === 1 ? "in 1 minute" : `in ${diffMin} minutes`;
  return "in less than a minute";
}

export default function SchedulesPage() {
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [channels, setChannels] = useState<ChannelItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleteChannelId, setDeleteChannelId] = useState<string | null>(null);
  const [deleteScheduleId, setDeleteScheduleId] = useState<string | null>(null);
  const [deleteAffected, setDeleteAffected] = useState<string[]>([]);
  const [confirmToggle, setConfirmToggle] = useState<ScheduleItem | null>(null);

  // New channel form
  const [addPanel, setAddPanel] = useState(false);
  const [addName, setAddName] = useState("");
  const [addType, setAddType] = useState<"telegram" | "discord">("telegram");
  const [addTgToken, setAddTgToken] = useState("");
  const [addTgChatId, setAddTgChatId] = useState("");
  const [addDcWebhook, setAddDcWebhook] = useState("");
  const [addTesting, setAddTesting] = useState(false);
  const [addError, setAddError] = useState("");

  // New schedule form
  const [schedulePanel, setSchedulePanel] = useState(false);
  const [scheduleStep, setScheduleStep] = useState(1);
  const [scheduleQuery, setScheduleQuery] = useState("");
  const [scheduleTime, setScheduleTime] = useState("09:00");
  const [scheduleTimeConfirmed, setScheduleTimeConfirmed] = useState(false);
  const [scheduleTimezone, setScheduleTimezone] = useState("UTC");
  const [selectedChannelIds, setSelectedChannelIds] = useState<string[]>([]);
  const [scheduleSubmitting, setScheduleSubmitting] = useState(false);
  const [scheduleError, setScheduleError] = useState("");
  const [scheduleOk, setScheduleOk] = useState(false);
  const [scheduleEditingId, setScheduleEditingId] = useState<string | null>(null);

  const timezones = getCommonTimezones();
  const tzLabel = timezones.find((tz) => tz.value === scheduleTimezone)?.label || scheduleTimezone;
  const isBusy = scheduleSubmitting;

  async function fetchData(opts?: { openChannelIfEmpty?: boolean }) {
    const sessionToken = localStorage.getItem("session_token");
    if (!sessionToken) { setError("Add API keys first"); setLoading(false); return; }
    setError("");
    const [sRes, cRes] = await Promise.all([
      fetch("/api/schedules", { headers: { "x-session-token": sessionToken } }),
      fetch("/api/channels", { headers: { "x-session-token": sessionToken } }),
    ]);
    const sData = await sRes.json();
    const cData = await cRes.json();
    const nextChannels = cData.channels || [];
    setSchedules(sData.schedules || []);
    setChannels(nextChannels);
    setLoading(false);
    if (opts?.openChannelIfEmpty && nextChannels.length === 0) {
      setAddPanel(true);
      setAddError("");
    }
  }

  useEffect(() => {
    function onSessionChange() {
      if (localStorage.getItem("session_token")) {
        setLoading(true);
        fetchData({ openChannelIfEmpty: true });
      } else {
        setError("Add API keys first");
        setChannels([]);
        setSchedules([]);
      }
    }
    window.addEventListener("session_changed", onSessionChange);
    return () => window.removeEventListener("session_changed", onSessionChange);
  }, []);

  useEffect(() => {
    fetchData();
    const editingRaw = localStorage.getItem("editing_schedule");
    if (editingRaw) {
      try {
        const editing = JSON.parse(editingRaw);
        localStorage.removeItem("editing_schedule");
        setScheduleEditingId(editing.id || null);
        setScheduleQuery(editing.query || "");
        setScheduleTime(editing.runTime || "09:00");
        setScheduleTimeConfirmed(true);
        setScheduleTimezone(editing.timezone || "UTC");
        const cfg = (editing.channelConfig || {}) as { channelIds?: string[] };
        setSelectedChannelIds(Array.isArray(cfg.channelIds) ? cfg.channelIds : []);
        setSchedulePanel(true);
        setScheduleStep(1);
        setScheduleOk(false);
        setScheduleError("");
      } catch {}
    }
  }, []);

  async function toggleSchedule(id: string, active: boolean) {
    const sessionToken = localStorage.getItem("session_token"); if (!sessionToken) return;
    const res = await fetch(`/api/schedules/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json", "x-session-token": sessionToken },
      body: JSON.stringify({ isActive: !active }),
    });
    if (res.ok) setSchedules((prev) => prev.map((s) => s.id === id ? { ...s, isActive: !active } : s));
  }

  async function deleteSchedule(id: string) {
    const sessionToken = localStorage.getItem("session_token"); if (!sessionToken) return;
    const res = await fetch(`/api/schedules/${id}`, { method: "DELETE", headers: { "x-session-token": sessionToken } });
    if (res.ok) setSchedules((prev) => prev.filter((s) => s.id !== id));
    setDeleteScheduleId(null);
  }

  async function deleteChannel(id: string) {
    const sessionToken = localStorage.getItem("session_token"); if (!sessionToken) return;
    const res = await fetch(`/api/channels/${id}`, { method: "DELETE", headers: { "x-session-token": sessionToken } });
    if (res.ok) {
      setChannels((prev) => prev.filter((c) => c.id !== id));
    }
    setDeleteChannelId(null);
  }

  async function handleDeleteChannelClick(id: string) {
    const sessionToken = localStorage.getItem("session_token"); if (!sessionToken) return;
    const res = await fetch(`/api/channels/${id}`, { method: "DELETE", headers: { "x-session-token": sessionToken } });
    const data = await res.json();
    if (data.affectedScheduleIds?.length > 0) {
      setDeleteAffected(data.affectedScheduleIds);
      setDeleteChannelId(id);
    } else {
      setChannels((prev) => prev.filter((c) => c.id !== id));
    }
  }

  function closeAddPanel() {
    setAddPanel(false);
    setAddName("");
    setAddType("telegram");
    setAddTgToken("");
    setAddTgChatId("");
    setAddDcWebhook("");
    setAddError("");
  }

  async function handleAddChannel() {
    if (!addName.trim()) return;
    setAddTesting(true); setAddError("");
    const sessionToken = localStorage.getItem("session_token"); if (!sessionToken) return;
    const credentials: Record<string, string> = addType === "telegram"
      ? { botToken: addTgToken, chatId: addTgChatId, _name: addName }
      : { webhookUrl: addDcWebhook, _name: addName };

    const validateBody: Record<string, unknown> = { [addType]: credentials };
    const vRes = await fetch("/api/validate-channels", { method: "POST", headers: { "Content-Type": "application/json", "x-session-token": sessionToken }, body: JSON.stringify(validateBody) });
    const vData = await vRes.json();
    const valid = vData[addType]?.valid;
    if (!valid) {
      setAddError(vData[addType]?.error || "Validation failed");
      setAddTesting(false); return;
    }

    const res = await fetch("/api/channels", {
      method: "POST", headers: { "Content-Type": "application/json", "x-session-token": sessionToken },
      body: JSON.stringify({ name: addName, type: addType, credentials, isValidated: true }),
    });
    if (res.ok) {
      closeAddPanel();
      setAddTesting(false);
      fetchData();
    } else {
      const d = await res.json();
      setAddError(d.error || "Failed");
      setAddTesting(false);
    }
  }

  async function handleCreateSchedule() {
    setScheduleSubmitting(true); setScheduleError("");
    const sessionToken = localStorage.getItem("session_token"); if (!sessionToken) return;
    const isEdit = Boolean(scheduleEditingId);

    if (isEdit) {
      const res = await fetch(`/api/schedules/${scheduleEditingId}`, {
        method: "PATCH", headers: { "Content-Type": "application/json", "x-session-token": sessionToken },
        body: JSON.stringify({ query: scheduleQuery, runTime: scheduleTime, timezone: scheduleTimezone, channelIds: selectedChannelIds }),
      });
      const data = await res.json();
      if (res.ok) { setScheduleOk(true); setScheduleEditingId(null); fetchData(); }
      else setScheduleError(data.error || "Failed");
    } else {
      const res = await fetch("/api/schedules", {
        method: "POST", headers: { "Content-Type": "application/json", "x-session-token": sessionToken },
        body: JSON.stringify({ query: scheduleQuery, runTime: scheduleTime, timezone: scheduleTimezone, channelIds: selectedChannelIds }),
      });
      const data = await res.json();
      if (res.ok) { setScheduleOk(true); fetchData(); }
      else setScheduleError(data.error || "Failed");
    }
    setScheduleSubmitting(false);
  }

  function openNewSchedule() {
    // Can't schedule without a delivery channel — guide the user to add one first.
    if (channels.length === 0) { setAddPanel(true); setAddError(""); return; }
    setSchedulePanel(true); setScheduleStep(1); setScheduleOk(false);
    setScheduleQuery(""); setScheduleTime("09:00"); setScheduleTimeConfirmed(false);
    setScheduleTimezone("UTC"); setSelectedChannelIds([]);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[var(--c-bg)] flex items-center justify-center">
        <svg viewBox="0 0 16 16" className="size-5 animate-spin text-[#F24E1E]" fill="none">
          <circle cx="8" cy="8" r="6" stroke="currentColor" strokeOpacity="0.25" strokeWidth="2" />
          <path d="M14 8a6 6 0 00-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--c-bg)] text-[var(--c-text)]">
      <div className="mx-auto w-full max-w-6xl px-4 pb-24">
        <header className="sticky top-0 z-20 -mx-4 flex h-14 items-center justify-between bg-[var(--c-bg)]/85 px-4 backdrop-blur-md">
          <Link href="/" className="ds-btn ds-btn--ghost-dark ds-btn--sm">
            <ArrowLeftIcon className="size-4" /> Back
          </Link>
        </header>

        {error ? (
          <div className="flex flex-col items-center justify-center py-16 max-w-[760px] mx-auto text-center">
            <div className="w-[180px] text-[var(--c-text)]">
              <DeliveryLoopIllustration className="h-auto w-full" />
            </div>
            <span className="ds-eyebrow ds-eyebrow--orange mt-2 block">The game-changer</span>
            <h1 className="mt-4 text-[26px] font-medium tracking-[-0.02em] text-[var(--c-text)]">
              An agent that delivers — while you do nothing
            </h1>
            <p className="mt-3 text-[14px] leading-relaxed text-[var(--c-text-muted)] max-w-[440px]">
              Set a match query, a time and an inbox <span className="font-semibold text-[var(--c-text)]">once</span>. Every day the agent
              finds the match, cuts your reel and drops it straight into Telegram or Discord. No app to open.
            </p>

            <SchedulerStepStrip
              steps={[
                { Panel: PanelAskOnce, title: "Add API keys", desc: "Connect TinyFish + VideoDB to power the agent." },
                { Panel: PanelPickTime, title: "Pick time & inbox", desc: "Choose when it runs and where it lands." },
                { Panel: PanelAgentWorks, title: "It works alone", desc: "Finds, watches, cuts and captions the reel." },
                { Panel: PanelDelivered, title: "Delivered daily", desc: "A ready reel arrives in your chat." },
              ]}
            />

            <button
              type="button"
              onClick={() => {
                const btn = document.querySelector<HTMLButtonElement>("[data-header-add-keys]");
                btn?.click();
              }}
              className="ds-btn ds-btn--primary mt-9"
            >
              Add API keys to start <ArrowRightIcon className="size-4" />
            </button>
          </div>
        ) : (
          <>
            {schedules.some((s) => s.isActive) ? <LowCreditsBanner /> : null}

            <section className="pt-10 pb-8">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl tracking-tight text-[var(--c-text)]">Your Schedules</h1>
                  <p className="mt-1 text-[14px] text-[var(--c-text-subtle)]">Manage daily briefings and notification inboxes</p>
                </div>
                <button
                  type="button"
                  onClick={openNewSchedule}
                  className="ds-btn ds-btn--primary ds-btn--sm"
                  title={channels.length === 0 ? "Add an inbox first" : "Create a new schedule"}
                >
                  + New Schedule
                </button>
              </div>
            </section>

            {!loading && schedules.length === 0 ? (
              <section className="mb-10 max-w-[760px] mx-auto text-center">
                <div className="mx-auto w-[150px] text-[var(--c-text)]">
                  <DeliveryLoopIllustration className="h-auto w-full" />
                </div>
                <span className="ds-eyebrow ds-eyebrow--orange mt-2 block">Set it once</span>
                <h2 className="mt-4 text-[22px] font-medium tracking-[-0.02em] text-[var(--c-text)]">
                  Your keys are ready. Now teach the agent your routine.
                </h2>
                <p className="mt-2 text-[14px] leading-relaxed text-[var(--c-text-muted)] max-w-[480px] mx-auto">
                  Add an inbox, then create a schedule. From then on the reel comes to you — every day, automatically.
                </p>

                <SchedulerStepStrip
                  steps={[
                    { Panel: PanelPickTime, title: "Add an inbox", desc: "Connect Telegram or Discord where reels get delivered." },
                    { Panel: PanelAgentWorks, title: "Create a schedule", desc: "Pick a match query and a daily run time." },
                    { Panel: PanelDelivered, title: "Get daily reels", desc: "Curated moment reels land in your inbox." },
                  ]}
                />

                {channels.length === 0 ? (
                  <button
                    type="button"
                    onClick={() => { setAddPanel(true); setAddError(""); }}
                    className="ds-btn ds-btn--primary mt-7"
                  >
                    Add an inbox first <ArrowRightIcon className="size-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={openNewSchedule}
                    className="ds-btn ds-btn--primary mt-7"
                  >
                    Create your first schedule <ArrowRightIcon className="size-4" />
                  </button>
                )}
              </section>
            ) : null}

            {/* Channels Section */}
            <section className="mb-10">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-[14px] font-medium text-[var(--c-text-muted)]">Inboxes ({channels.length})</h2>
                <button
                  type="button"
                  onClick={() => { setAddPanel(true); setAddError(""); }}
                  className="ds-btn ds-btn--ghost-dark ds-btn--sm"
                >
                  + Add Inbox
                </button>
              </div>
              {channels.length === 0 ? (
                <div className="ds-card ds-card--dark p-6 text-center">
                  <p className="text-[14px] text-[var(--c-text-subtle)]">No inboxes yet. Add one to start scheduling.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {channels.map((ch) => (
                    <div key={ch.id} className="ds-card ds-card--dark p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex min-w-0 flex-1 items-center gap-3">
                          <span className="flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-[var(--c-hover-2)]">
                            <ChannelIcon type={ch.type} size={18} />
                          </span>
                          <div className="min-w-0">
                            <p className="text-[14px] font-medium text-[var(--c-text)] truncate">{ch.name}</p>
                            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--c-text-subtle)]">
                              {ch.type}{ch.isValidated ? "" : " · not tested"}
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          aria-label="Delete inbox"
                          onClick={() => handleDeleteChannelClick(ch.id)}
                          className="flex size-11 items-center justify-center rounded-full text-[var(--c-text-subtle)] transition-colors hover:bg-[#E5484D]/10 hover:text-[#E5484D]"
                        >
                          <CloseIcon className="size-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Schedules List */}
            <section>
              <h2 className="text-[14px] font-medium text-[var(--c-text-muted)] mb-4">Schedules ({schedules.length})</h2>
              {schedules.length === 0 ? (
                <div className="ds-card ds-card--dark p-6 text-center">
                  <p className="text-[14px] text-[var(--c-text-subtle)]">No schedules yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {schedules.map((s) => (
                    <div
                      key={s.id}
                      className="ds-card ds-card--dark p-4"
                    >
                      <div className="flex items-start justify-between">
                        <div className="min-w-0 flex-1">
                          <Link href={`/schedules/${s.id}`} className="text-[15px] font-medium text-[var(--c-text)] line-clamp-2 hover:text-[#F24E1E]">
                            {s.query}
                          </Link>
                          <p className="mt-1 text-[13px] text-[var(--c-text-subtle)]">
                            Daily at {formatHourMinute(s.runTime)} {s.timezone}
                          </p>
                          <p className="mt-0.5 text-[12px] text-[var(--c-text-subtle)]">
                            via {s.channel.split(",").map((c: string) => c.charAt(0).toUpperCase() + c.slice(1)).join(" & ")}
                            {s.nextRunAt ? ` · ${relativeTime(s.nextRunAt)}` : ""}
                          </p>
                        </div>
                        <div className="ml-3 flex shrink-0 items-center gap-1.5">
                          <button
                            type="button"
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setConfirmToggle(s); }}
                            aria-pressed={s.isActive}
                            className={s.isActive ? "ds-pill-status ds-pill-status--orange" : "ds-pill-status ds-pill-status--muted-dark"}
                          >
                            {s.isActive ? "Active" : "Paused"}
                          </button>
                          <button
                            type="button"
                            aria-label="Delete schedule"
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setDeleteScheduleId(s.id); }}
                            className="flex size-11 items-center justify-center rounded-full text-[var(--c-text-subtle)] transition-colors hover:bg-[#E5484D]/10 hover:text-[#E5484D]"
                          >
                            <CloseIcon className="size-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}

        {/* Add Channel Panel */}
        {addPanel ? (
          <ModalShell
            labelledBy="add-channel-title"
            onClose={closeAddPanel}
            closeOnBackdrop={!addTesting}
            className="animate-rise w-full max-w-md rounded-t-2xl border border-[var(--c-border)] bg-[var(--c-surface)] px-6 pt-6 pb-8 shadow-[0_-1px_48px_rgba(0,0,0,0.5)] sm:rounded-2xl sm:pb-6 sm:shadow-[0_20px_48px_rgba(0,0,0,0.5)]"
          >
              <div className="mb-5 flex items-center justify-between">
                <h2 id="add-channel-title" className="text-[16px] font-semibold text-[var(--c-text)]">Add Inbox</h2>
                <button type="button" aria-label="Close" onClick={() => { if (!addTesting) closeAddPanel(); }} disabled={addTesting} className="rounded-full p-1 text-[var(--c-text-subtle)] transition-colors hover:bg-[var(--c-hover-2)] hover:text-[var(--c-text-muted)] disabled:opacity-50">
                  <CloseIcon className="size-4" />
                </button>
              </div>
              {addError ? (
                <div role="alert" className="mb-5 rounded-xl border border-[#E5484D]/40 bg-[#E5484D]/10 px-4 py-3 text-[13px] text-[#E5484D]">{addError}</div>
              ) : null}
              <div className="space-y-4">
                <div>
                  <label htmlFor="channel-name" className="ds-field-label ds-field-label--on-dark mb-1.5 block">Inbox name</label>
                   <input id="channel-name" type="text" value={addName} onChange={(e) => setAddName(e.target.value)} placeholder={addType === "telegram" ? "Personal Telegram" : "My Discord server"} disabled={addTesting} className="ds-input ds-input--dark w-full disabled:opacity-50" />
                </div>
                <div>
                  <label className="ds-field-label ds-field-label--on-dark mb-1.5 block">Type</label>
                  <div className="flex gap-1 rounded-full border border-[var(--c-border)] bg-[var(--c-hover)] p-1">
                    <button type="button" onClick={() => { setAddType("telegram"); setAddTgToken(""); setAddTgChatId(""); setAddError(""); }} className={`flex flex-1 items-center justify-center gap-1.5 rounded-full px-4 py-1.5 text-[13px] font-medium transition-all duration-200 ${addType === "telegram" ? "bg-[#F24E1E] text-white" : "text-[var(--c-text-subtle)] hover:text-[var(--c-text)]"}`}><ChannelIcon type="telegram" size={15} mono={addType === "telegram"} />Telegram</button>
                    <button type="button" onClick={() => { setAddType("discord"); setAddDcWebhook(""); setAddError(""); }} className={`flex flex-1 items-center justify-center gap-1.5 rounded-full px-4 py-1.5 text-[13px] font-medium transition-all duration-200 ${addType === "discord" ? "bg-[#F24E1E] text-white" : "text-[var(--c-text-subtle)] hover:text-[var(--c-text)]"}`}><ChannelIcon type="discord" size={15} mono={addType === "discord"} />Discord</button>
                  </div>
                </div>
                {addType === "telegram" ? (
                  <>
                    <div className="mb-2 flex items-center justify-between">
                      <label className="ds-field-label ds-field-label--on-dark">Credentials</label>
                      <a
                        href="https://core.telegram.org/bots/tutorial"
                        target="_blank"
                        rel="noreferrer"
                        className="text-[12px] font-semibold text-[#F24E1E] no-underline hover:underline"
                      >
                        Get credentials →
                      </a>
                    </div>
                    <div>
                      <label htmlFor="tg-token" className="ds-field-label ds-field-label--on-dark mb-1.5 block">Bot Token</label>
                      <input id="tg-token" type="password" value={addTgToken} onChange={(e) => setAddTgToken(e.target.value)} placeholder="0000000000:XXXXX..." disabled={addTesting} className="ds-input ds-input--dark w-full disabled:opacity-50" />
                    </div>
                    <div>
                      <label htmlFor="tg-chat-id" className="ds-field-label ds-field-label--on-dark mb-1.5 block">Chat ID</label>
                      <input id="tg-chat-id" type="text" value={addTgChatId} onChange={(e) => setAddTgChatId(e.target.value)} placeholder="123456789" disabled={addTesting} className="ds-input ds-input--dark w-full disabled:opacity-50" />
                    </div>
                  </>
                ) : (
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <label className="ds-field-label ds-field-label--on-dark">Webhook URL</label>
                      <a
                        href="https://support.discord.com/hc/en-us/articles/228383668-Intro-to-Webhooks"
                        target="_blank"
                        rel="noreferrer"
                        className="text-[12px] font-semibold text-[#F24E1E] no-underline hover:underline"
                      >
                        Get webhook URL →
                      </a>
                    </div>
                    <input type="text" value={addDcWebhook} onChange={(e) => setAddDcWebhook(e.target.value)} placeholder="https://discord.com/api/webhooks/..." disabled={addTesting} className="ds-input ds-input--dark w-full disabled:opacity-50" />
                  </div>
                )}
              </div>
              <div className="mt-6 flex items-center gap-3">
                <button type="button" onClick={() => { closeAddPanel(); }} disabled={addTesting} className="ds-btn ds-btn--ghost-dark ds-btn--sm disabled:opacity-50">Cancel</button>
                <button type="button" onClick={handleAddChannel} disabled={addTesting || !addName.trim() || (addType === "telegram" ? !addTgToken.trim() || !addTgChatId.trim() : !addDcWebhook.trim())} className="ds-btn ds-btn--primary ds-btn--sm flex-1">
                  {addTesting ? "Testing..." : "Add & Test"}
                </button>
              </div>
          </ModalShell>
        ) : null}

        {/* New Schedule Panel */}
        {schedulePanel ? (
          scheduleOk ? (
            <ModalShell
              labelledBy="schedule-ok-title"
              onClose={() => setSchedulePanel(false)}
              className="animate-rise w-full max-w-md rounded-t-2xl border border-[var(--c-border)] bg-[var(--c-surface)] px-6 pt-6 pb-8 shadow-[0_-1px_48px_rgba(0,0,0,0.5)] sm:rounded-2xl sm:pb-6 sm:shadow-[0_20px_48px_rgba(0,0,0,0.5)]"
            >
                <h2 id="schedule-ok-title" className="text-[16px] font-semibold text-[var(--c-text)] mb-4">{scheduleEditingId ? "Schedule Updated" : "Schedule Created"}</h2>
                <p className="text-[14px] text-[var(--c-text-muted)]">{scheduleEditingId ? "Your daily briefing has been updated." : "Your daily briefing has been scheduled."}</p>
                <div className="mt-5">
                  <button type="button" onClick={() => setSchedulePanel(false)} className="ds-btn ds-btn--primary ds-btn--sm w-full">Done</button>
                </div>
            </ModalShell>
          ) : (
            <ModalShell
              labelledBy="schedule-panel-title"
              onClose={() => setSchedulePanel(false)}
              closeOnBackdrop={!isBusy}
              className="animate-rise w-full max-w-md rounded-t-2xl border border-[var(--c-border)] bg-[var(--c-surface)] px-6 pt-6 pb-8 shadow-[0_-1px_48px_rgba(0,0,0,0.5)] sm:rounded-2xl sm:pb-6 sm:shadow-[0_20px_48px_rgba(0,0,0,0.5)]"
            >
                <div className="mb-5 flex items-center justify-between">
                  <h2 id="schedule-panel-title" className="text-[16px] font-semibold text-[var(--c-text)]">{scheduleEditingId ? "Edit Schedule" : "New Schedule"}</h2>
                  <button type="button" aria-label="Close" onClick={() => { setSchedulePanel(false); setScheduleEditingId(null); }} disabled={isBusy} className="rounded-full p-1 text-[var(--c-text-subtle)] transition-colors hover:bg-[var(--c-hover-2)] hover:text-[var(--c-text-muted)] disabled:opacity-50">
                    <CloseIcon className="size-4" />
                  </button>
                </div>
                <div className="mb-5 flex items-center gap-1 rounded-full border border-[var(--c-border)] bg-[var(--c-hover)] p-1">
                  {["Query & Time", "Inbox", "Confirm"].map((label, i) => (
                    <button key={label} disabled={isBusy} className={`flex-1 rounded-full px-2 py-1 text-[12px] font-medium transition-all duration-200 ${scheduleStep === i + 1 ? "bg-[#F24E1E] text-white" : "text-[var(--c-text-subtle)]"}`}>{label}</button>
                  ))}
                </div>
                {scheduleError ? (
                  <div role="alert" className="animate-rise mb-5 rounded-xl border border-[#E5484D]/40 bg-[#E5484D]/10 px-4 py-3 text-[13px] text-[#E5484D]">{scheduleError}</div>
                ) : null}
                {scheduleStep === 1 ? (
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="schedule-query" className="ds-field-label ds-field-label--on-dark mb-1.5 block">Search query</label>
                      <input id="schedule-query" type="text" value={scheduleQuery} onChange={(e) => setScheduleQuery(e.target.value)} placeholder="e.g. highlights of fouls from USA vs Paraguay" disabled={isBusy} className="ds-input ds-input--dark w-full disabled:opacity-50" />
                    </div>
                    <div className="flex gap-3">
                      <div className="flex-1">
                        <label className="ds-field-label ds-field-label--on-dark mb-1.5 block">Time</label>
                        {scheduleTimeConfirmed ? (
                          <div className="flex items-center gap-2">
                            <span className="rounded-xl border border-[var(--c-border)] bg-[var(--c-hover)] px-4 py-2.5 text-[14px] text-[var(--c-text)] flex-1">{formatHourMinute(scheduleTime)}</span>
                            <button type="button" onClick={() => setScheduleTimeConfirmed(false)} disabled={isBusy} className="text-[12px] text-[var(--c-text-subtle)] underline-offset-2 hover:text-[var(--c-text-muted)] hover:underline shrink-0">Edit</button>
                          </div>
                        ) : (
                          (() => {
                            const [h, m] = scheduleTime.split(":").map(Number);
                            const h12 = h % 12 || 12;
                            const ampm = h < 12 ? "AM" : "PM";
                            const setTime = (hour12: number, min: number, ap: string) => {
                              let h24 = hour12;
                              if (ap === "PM" && hour12 !== 12) h24 = hour12 + 12;
                              if (ap === "AM" && hour12 === 12) h24 = 0;
                              setScheduleTime(`${h24.toString().padStart(2, "0")}:${min.toString().padStart(2, "0")}`);
                            };
                            return (
                              <div className="flex items-center gap-1.5">
                                <select
                                  value={h12}
                                  onChange={(e) => setTime(Number(e.target.value), m, ampm)}
                                  disabled={isBusy}
                                  className="ds-select ds-select--dark w-[64px] px-2.5 disabled:opacity-50"
                                >
                                  {Array.from({ length: 12 }, (_, i) => i + 1).map((v) => (
                                    <option key={v} value={v}>{v}</option>
                                  ))}
                                </select>
                                <span className="text-[14px] text-[var(--c-text-subtle)]">:</span>
                                <select
                                  value={m}
                                  onChange={(e) => setTime(h12, Number(e.target.value), ampm)}
                                  disabled={isBusy}
                                  className="ds-select ds-select--dark w-[64px] px-2.5 disabled:opacity-50"
                                >
                                  {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map((v) => (
                                    <option key={v} value={v}>{v.toString().padStart(2, "0")}</option>
                                  ))}
                                </select>
                                <div className="flex rounded-full border border-[var(--c-border)] bg-[var(--c-hover)] p-0.5">
                                  <button
                                    type="button"
                                    onClick={() => setTime(h12, m, "AM")}
                                    disabled={isBusy}
                                    className={`rounded-full px-2.5 py-1.5 text-[12px] font-medium transition-all duration-200 ${ampm === "AM" ? "bg-[#F24E1E] text-white" : "text-[var(--c-text-subtle)] hover:text-white"}`}
                                  >AM</button>
                                  <button
                                    type="button"
                                    onClick={() => setTime(h12, m, "PM")}
                                    disabled={isBusy}
                                    className={`rounded-full px-2.5 py-1.5 text-[12px] font-medium transition-all duration-200 ${ampm === "PM" ? "bg-[#F24E1E] text-white" : "text-[var(--c-text-subtle)] hover:text-white"}`}
                                  >PM</button>
                                </div>
                              </div>
                            );
                          })()
                        )}
                      </div>
                      <div className="flex-[2]">
                        <label className="ds-field-label ds-field-label--on-dark mb-1.5 block">Timezone</label>
                        <select value={scheduleTimezone} onChange={(e) => setScheduleTimezone(e.target.value)} disabled={isBusy} className="ds-select ds-select--dark w-full disabled:opacity-50">
                          {timezones.map((tz) => (<option key={tz.value} value={tz.value}>{tz.label}</option>))}
                        </select>
                      </div>
                    </div>
                  </div>
                ) : scheduleStep === 2 ? (
                  <div className="space-y-4">
                    <label className="ds-field-label ds-field-label--on-dark mb-1.5 block">Pick inboxes</label>
                    {channels.length === 0 ? (
                      <p className="text-[13px] text-[var(--c-text-subtle)]">No inboxes. Add one above first.</p>
                    ) : (
                      <div className="space-y-2">
                        {channels.map((ch) => (
                          <label key={ch.id} className="flex items-center gap-2.5 cursor-pointer rounded-xl border border-[var(--c-border)] bg-[var(--c-hover)] px-4 py-3 transition-all duration-200 hover:border-[#F24E1E]">
                            <input type="checkbox" checked={selectedChannelIds.includes(ch.id)} onChange={() => {
                              if (selectedChannelIds.includes(ch.id)) {
                                setSelectedChannelIds(selectedChannelIds.filter((id) => id !== ch.id));
                              } else {
                                setSelectedChannelIds([...selectedChannelIds, ch.id]);
                              }
                            }} disabled={isBusy} className="size-4 rounded accent-[#F24E1E]" />
                            <ChannelIcon type={ch.type} size={17} />
                            <span className="flex-1 text-[14px] text-[var(--c-text)]">{ch.name}</span>
                            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--c-text-subtle)]">{ch.type}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <h3 className="text-[13px] font-medium text-[var(--c-text)]">Review your schedule</h3>
                    <div className="ds-card ds-card--dark p-4 space-y-2">
                      <div><span className="text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--c-text-subtle)]">Query</span><p className="text-[14px] text-[var(--c-text)]">{scheduleQuery}</p></div>
                      <div><span className="text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--c-text-subtle)]">Schedule</span><p className="text-[14px] text-[var(--c-text)]">Daily at {formatHourMinute(scheduleTime)} ({tzLabel})</p></div>
                      <div><span className="text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--c-text-subtle)]">Inboxes</span><p className="text-[14px] text-[var(--c-text)]">{selectedChannelIds.length ? channels.filter(c => selectedChannelIds.includes(c.id)).map(c => c.name).join(", ") : "None"}</p></div>
                    </div>
                    <button type="button" onClick={handleCreateSchedule} disabled={isBusy || !scheduleQuery.trim() || !scheduleTimeConfirmed || selectedChannelIds.length === 0} className="ds-btn ds-btn--primary w-full">
                      {scheduleSubmitting ? "Saving..." : scheduleEditingId ? "Save changes" : "Schedule daily briefing"}
                    </button>
                  </div>
                )}
                <div className="mt-6 flex items-center gap-3">
                  {scheduleStep > 1 ? (
                    <button type="button" onClick={() => setScheduleStep((s) => s - 1)} disabled={isBusy} className="ds-btn ds-btn--ghost-dark ds-btn--sm disabled:opacity-50">Back</button>
                  ) : (
                    <button type="button" onClick={() => setSchedulePanel(false)} disabled={isBusy} className="ds-btn ds-btn--ghost-dark ds-btn--sm disabled:opacity-50">Cancel</button>
                  )}
                  {scheduleStep < 3 ? (
                    <button type="button" onClick={() => { if (scheduleStep === 1) setScheduleTimeConfirmed(true); setScheduleStep((s) => s + 1); }} disabled={scheduleStep === 1 ? !scheduleQuery.trim() || !scheduleTime : selectedChannelIds.length === 0} className="ds-btn ds-btn--primary ds-btn--sm flex-1">Next</button>
                  ) : null}
                </div>
            </ModalShell>
          )
        ) : null}

        {/* Delete Channel Confirmation */}
        {deleteChannelId ? (
          <ModalShell
            labelledBy="delete-channel-title"
            onClose={() => setDeleteChannelId(null)}
            className="animate-rise w-full max-w-sm rounded-t-2xl border border-[var(--c-border)] bg-[var(--c-surface)] px-6 pt-6 pb-8 shadow-[0_-1px_48px_rgba(0,0,0,0.5)] sm:rounded-2xl sm:pb-6 sm:shadow-[0_20px_48px_rgba(0,0,0,0.5)]"
          >
              <h2 id="delete-channel-title" className="text-[16px] font-semibold text-[var(--c-text)]">Delete inbox?</h2>
              {deleteAffected.length > 0 ? (
                <p className="mt-2 text-[13px] text-[var(--c-text-subtle)]">This inbox is used by {deleteAffected.length} active schedule{deleteAffected.length > 1 ? "s" : ""}. Removing it will affect those schedules.</p>
              ) : (
                <p className="mt-2 text-[13px] text-[var(--c-text-subtle)]">This inbox is not linked to any schedule.</p>
              )}
              <div className="mt-5 flex items-center gap-3">
                <button type="button" onClick={() => setDeleteChannelId(null)} className="ds-btn ds-btn--ghost-dark ds-btn--sm">Cancel</button>
                <button type="button" onClick={() => deleteChannel(deleteChannelId)} className="ds-btn ds-btn--danger ds-btn--sm flex-1">Delete</button>
              </div>
          </ModalShell>
        ) : null}

        {/* Delete Schedule Confirmation */}
        {deleteScheduleId ? (
          <ModalShell
            labelledBy="delete-schedule-title"
            onClose={() => setDeleteScheduleId(null)}
            className="animate-rise w-full max-w-sm rounded-t-2xl border border-[var(--c-border)] bg-[var(--c-surface)] px-6 pt-6 pb-8 shadow-[0_-1px_48px_rgba(0,0,0,0.5)] sm:rounded-2xl sm:pb-6 sm:shadow-[0_20px_48px_rgba(0,0,0,0.5)]"
          >
              <h2 id="delete-schedule-title" className="text-[16px] font-semibold text-[var(--c-text)]">Delete schedule?</h2>
              <p className="mt-2 text-[13px] text-[var(--c-text-subtle)]">This will permanently remove the schedule. Past runs are not affected.</p>
              <div className="mt-5 flex items-center gap-3">
                <button type="button" onClick={() => setDeleteScheduleId(null)} className="ds-btn ds-btn--ghost-dark ds-btn--sm">Cancel</button>
                <button type="button" onClick={() => deleteSchedule(deleteScheduleId)} className="ds-btn ds-btn--danger ds-btn--sm flex-1">Delete</button>
              </div>
          </ModalShell>
        ) : null}

        <ConfirmModal
          open={!!confirmToggle}
          title={confirmToggle?.isActive ? "Pause this schedule?" : "Resume this schedule?"}
          confirmLabel={confirmToggle?.isActive ? "Pause" : "Resume"}
          onConfirm={() => {
            if (confirmToggle) {
              toggleSchedule(confirmToggle.id, confirmToggle.isActive);
              setConfirmToggle(null);
            }
          }}
          onClose={() => setConfirmToggle(null)}
        >
          {confirmToggle ? (
            <>
              <p>This will {confirmToggle.isActive ? "pause" : "resume"} daily briefings for:</p>
              <p className="mt-2 rounded-lg bg-[var(--c-hover)] px-3 py-2 font-medium text-[var(--c-text)]">
                &ldquo;{confirmToggle.query}&rdquo;
              </p>
            </>
          ) : null}
        </ConfirmModal>
      </div>
    </main>
  );
}
