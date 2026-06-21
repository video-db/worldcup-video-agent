"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useState } from "react";

import Link from "next/link";
import { getCommonTimezones } from "@/lib/timezone";
import ConfirmModal from "@/components/ConfirmModal";

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

  async function fetchData() {
    const sessionToken = localStorage.getItem("session_token");
    if (!sessionToken) { setError("Add API keys first"); setLoading(false); return; }
    const [sRes, cRes] = await Promise.all([
      fetch("/api/schedules", { headers: { "x-session-token": sessionToken } }),
      fetch("/api/channels", { headers: { "x-session-token": sessionToken } }),
    ]);
    const sData = await sRes.json();
    const cData = await cRes.json();
    setSchedules(sData.schedules || []);
    setChannels(cData.channels || []);
    setLoading(false);
  }

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
    const data = await res.json();
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
    setSchedulePanel(true); setScheduleStep(1); setScheduleOk(false);
    setScheduleQuery(""); setScheduleTime("09:00"); setScheduleTimeConfirmed(false);
    setScheduleTimezone("UTC"); setSelectedChannelIds([]);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#fbfbf7] flex items-center justify-center">
        <svg viewBox="0 0 16 16" className="size-5 animate-spin text-[#FF6700]" fill="none">
          <circle cx="8" cy="8" r="6" stroke="currentColor" strokeOpacity="0.25" strokeWidth="2" />
          <path d="M14 8a6 6 0 00-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#fbfbf7] text-[#1f1f1e]">
      <div className="mx-auto w-full max-w-6xl px-4 pb-24">
        <header className="sticky top-0 z-20 -mx-4 flex h-14 items-center justify-between bg-[#fbfbf7]/85 px-4 backdrop-blur-md">
          <Link href="/" className="rounded-full border border-[#e5e1d8] bg-white px-3.5 py-1.5 text-[13px] text-[#625d55] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#FECB8B] hover:text-[#20201f] hover:shadow-[0_4px_14px_rgba(255,103,0,0.12)] active:translate-y-0">
            ← Back
          </Link>
        </header>

        {error ? (
          <div className="flex flex-col items-center justify-center py-24">
            <p className="text-[15px] text-[#8a857c]">{error}</p>
            <Link href="/" className="mt-2 text-[13px] text-[#FF6700] hover:underline">Go to main page →</Link>
          </div>
        ) : (
          <>
            <section className="pt-10 pb-8">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl tracking-tight text-[#1f1f1e]">Your Schedules</h1>
                  <p className="mt-1 text-[14px] text-[#8a857c]">Manage daily briefings and notification channels</p>
                </div>
                <button
                  type="button"
                  onClick={openNewSchedule}
                  disabled={channels.length === 0}
                  className="rounded-full bg-[#FF6700] px-4 py-2 text-[13px] font-medium text-white transition-all duration-200 hover:bg-[#e35c00] active:scale-[0.98] disabled:bg-[#E9E9DC] disabled:text-[#a8a399] disabled:cursor-not-allowed"
                >
                  + New Schedule
                </button>
              </div>
            </section>

            {/* Channels Section */}
            <section className="mb-10">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-[14px] font-medium text-[#625d55]">Channels ({channels.length})</h2>
                <button
                  type="button"
                  onClick={() => { setAddPanel(true); setAddError(""); }}
                  className="rounded-full border border-[#e5e1d8] bg-white px-3 py-1 text-[12px] text-[#625d55] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#FECB8B] hover:text-[#20201f]"
                >
                  + Add Channel
                </button>
              </div>
              {channels.length === 0 ? (
                <div className="rounded-2xl border border-[#eceae3] bg-white p-6 text-center">
                  <p className="text-[14px] text-[#8a857c]">No channels yet. Add one to start scheduling.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {channels.map((ch) => (
                    <div key={ch.id} className="rounded-2xl border border-[#eceae3] bg-white p-4">
                      <div className="flex items-center justify-between">
                        <div className="min-w-0 flex-1">
                          <p className="text-[14px] font-medium text-[#20201f] truncate">{ch.name}</p>
                          <span className={`text-[11px] px-1.5 py-0.5 rounded-full ${ch.type === "discord" ? "bg-[#eeebf7] text-[#5865F2]" : ch.type === "telegram" ? "bg-[#e8f0fe] text-[#1a73e8]" : "bg-[#f3f1ea] text-[#8a857c]"} ${ch.isValidated ? "" : "opacity-70"}`}>
                            {ch.type} {ch.isValidated ? "" : "(not tested)"}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteChannelClick(ch.id)}
                          className="rounded-full p-1 text-[#a8a399] transition-colors hover:bg-[#fef2f2] hover:text-[#dc2626]"
                        >
                          <svg viewBox="0 0 16 16" className="size-3.5" fill="none">
                            <path d="M4.5 4.5l7 7m0-7l-7 7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Schedules List */}
            <section>
              <h2 className="text-[14px] font-medium text-[#625d55] mb-4">Schedules ({schedules.length})</h2>
              {schedules.length === 0 ? (
                <div className="rounded-2xl border border-[#eceae3] bg-white p-6 text-center">
                  <p className="text-[14px] text-[#8a857c]">No schedules yet. Create your first one.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {schedules.map((s) => (
                    <Link
                      key={s.id}
                      href={`/schedules/${s.id}`}
                      className="block rounded-2xl border border-[#eceae3] bg-white p-4 transition-all duration-200 hover:shadow-[0_4px_24px_rgba(32,32,31,0.1)] hover:-translate-y-0.5"
                    >
                      <div className="flex items-start justify-between">
                        <div className="min-w-0 flex-1">
                          <span className="text-[15px] font-medium text-[#20201f] line-clamp-2">
                            {s.query}
                          </span>
                          <p className="mt-1 text-[13px] text-[#8a857c]">
                            Daily at {formatHourMinute(s.runTime)} {s.timezone}
                          </p>
                          <p className="mt-0.5 text-[12px] text-[#a8a399]">
                            via {s.channel.split(",").map((c: string) => c.charAt(0).toUpperCase() + c.slice(1)).join(" & ")}
                            {s.nextRunAt ? ` · ${relativeTime(s.nextRunAt)}` : ""}
                          </p>
                        </div>
                        <div className="ml-3 flex shrink-0 items-center gap-1.5">
                          <button
                            type="button"
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setConfirmToggle(s); }}
                            className={`rounded-full px-3 py-1 text-[11px] font-medium transition-all duration-200 ${s.isActive ? "bg-[#1B7064] text-white" : "border border-[#e5e1d8] bg-white text-[#625d55] hover:border-[#FECB8B]"}`}
                          >
                            {s.isActive ? "Active" : "Paused"}
                          </button>
                          <button
                            type="button"
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setDeleteScheduleId(s.id); }}
                            className="rounded-full p-1 text-[#a8a399] transition-colors hover:bg-[#fef2f2] hover:text-[#dc2626]"
                          >
                            <svg viewBox="0 0 16 16" className="size-3.5" fill="none">
                              <path d="M4.5 4.5l7 7m0-7l-7 7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </section>
          </>
        )}

        {/* Add Channel Panel */}
        {addPanel ? (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#141413]/40 backdrop-blur-sm sm:items-center" onClick={() => { if (!addTesting) closeAddPanel(); }}>
            <div className="animate-rise w-full max-w-md rounded-t-2xl bg-white px-6 pt-6 pb-8 shadow-[0_-1px_48px_rgba(32,32,31,0.18)] sm:rounded-2xl sm:pb-6 sm:shadow-[0_1px_2px_rgba(32,32,31,0.06),0_20px_48px_rgba(32,32,31,0.18)]" onClick={(e) => e.stopPropagation()}>
              <div className="mb-5 flex items-center justify-between">
                <h2 className="text-[16px] font-semibold text-[#1f1f1e]">Add Channel</h2>
                <button type="button" onClick={() => { if (!addTesting) closeAddPanel(); }} disabled={addTesting} className="rounded-full p-1 text-[#a8a399] transition-colors hover:bg-[#f3f1ea] hover:text-[#625d55] disabled:opacity-50">
                  <svg viewBox="0 0 16 16" className="size-4" fill="none"><path d="M4.5 4.5l7 7m0-7l-7 7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
                </button>
              </div>
              {addError ? (
                <div className="mb-5 rounded-xl border border-[#fecaca] bg-[#fef2f2] px-4 py-3 text-[13px] text-[#dc2626]">{addError}</div>
              ) : null}
              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-[12px] font-medium text-[#625d55]">Channel name</label>
                   <input type="text" value={addName} onChange={(e) => setAddName(e.target.value)} placeholder={addType === "telegram" ? "Personal Telegram" : "My Discord server"} disabled={addTesting} className="w-full rounded-xl border border-[#e8e4db] bg-white px-4 py-2.5 text-[14px] outline-none transition-all duration-200 placeholder:text-[#a8a399] focus:border-[#FECB8B] focus:shadow-[0_1px_2px_rgba(32,32,31,0.05),0_4px_16px_rgba(255,103,0,0.08)] disabled:opacity-50" />
                </div>
                <div>
                  <label className="mb-1.5 block text-[12px] font-medium text-[#625d55]">Type</label>
                  <div className="flex gap-1 rounded-full border border-[#eceae3] bg-white p-1">
                    <button type="button" onClick={() => { setAddType("telegram"); setAddTgToken(""); setAddTgChatId(""); setAddError(""); }} className={`flex-1 rounded-full px-4 py-1.5 text-[13px] font-medium transition-all duration-200 ${addType === "telegram" ? "bg-[#FF6700] text-white" : "text-[#625d55] hover:text-[#20201f]"}`}>Telegram</button>
                    <button type="button" onClick={() => { setAddType("discord"); setAddDcWebhook(""); setAddError(""); }} className={`flex-1 rounded-full px-4 py-1.5 text-[13px] font-medium transition-all duration-200 ${addType === "discord" ? "bg-[#FF6700] text-white" : "text-[#625d55] hover:text-[#20201f]"}`}>Discord</button>
                  </div>
                </div>
                {addType === "telegram" ? (
                  <>
                    <div className="mb-2 flex items-center justify-between">
                      <label className="text-[12px] font-medium text-[#625d55]">Credentials</label>
                      <a
                        href="https://core.telegram.org/bots/tutorial"
                        target="_blank"
                        rel="noreferrer"
                        className="text-[12px] font-semibold text-[#ff6700] no-underline hover:underline"
                      >
                        Get credentials →
                      </a>
                    </div>
                    <div>
                      <label className="mb-1.5 block text-[12px] font-medium text-[#625d55]">Bot Token</label>
                      <input type="password" value={addTgToken} onChange={(e) => setAddTgToken(e.target.value)} placeholder="0000000000:XXXXX..." disabled={addTesting} className="w-full rounded-xl border border-[#e8e4db] bg-white px-4 py-2.5 text-[14px] outline-none transition-all duration-200 placeholder:text-[#a8a399] focus:border-[#FECB8B] focus:shadow-[0_1px_2px_rgba(32,32,31,0.05),0_4px_16px_rgba(255,103,0,0.08)] disabled:opacity-50" />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-[12px] font-medium text-[#625d55]">Chat ID</label>
                      <input type="text" value={addTgChatId} onChange={(e) => setAddTgChatId(e.target.value)} placeholder="123456789" disabled={addTesting} className="w-full rounded-xl border border-[#e8e4db] bg-white px-4 py-2.5 text-[14px] outline-none transition-all duration-200 placeholder:text-[#a8a399] focus:border-[#FECB8B] focus:shadow-[0_1px_2px_rgba(32,32,31,0.05),0_4px_16px_rgba(255,103,0,0.08)] disabled:opacity-50" />
                    </div>
                  </>
                ) : (
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <label className="text-[12px] font-medium text-[#625d55]">Webhook URL</label>
                      <a
                        href="https://support.discord.com/hc/en-us/articles/228383668-Intro-to-Webhooks"
                        target="_blank"
                        rel="noreferrer"
                        className="text-[12px] font-semibold text-[#ff6700] no-underline hover:underline"
                      >
                        Get webhook URL →
                      </a>
                    </div>
                    <input type="text" value={addDcWebhook} onChange={(e) => setAddDcWebhook(e.target.value)} placeholder="https://discord.com/api/webhooks/..." disabled={addTesting} className="w-full rounded-xl border border-[#e8e4db] bg-white px-4 py-2.5 text-[14px] outline-none transition-all duration-200 placeholder:text-[#a8a399] focus:border-[#FECB8B] focus:shadow-[0_1px_2px_rgba(32,32,31,0.05),0_4px_16px_rgba(255,103,0,0.08)] disabled:opacity-50" />
                  </div>
                )}
              </div>
              <div className="mt-6 flex items-center gap-3">
                <button type="button" onClick={() => { closeAddPanel(); }} disabled={addTesting} className="rounded-full border border-[#e5e1d8] bg-white px-4 py-2 text-[13px] text-[#625d55] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#FECB8B] hover:text-[#20201f] disabled:opacity-50">Cancel</button>
                <button type="button" onClick={handleAddChannel} disabled={addTesting || !addName.trim() || (addType === "telegram" ? !addTgToken.trim() || !addTgChatId.trim() : !addDcWebhook.trim())} className="flex flex-1 items-center justify-center gap-2 rounded-full bg-[#FF6700] px-4 py-2 text-[13px] font-medium text-white transition-all duration-200 hover:bg-[#e35c00] active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-[#E9E9DC] disabled:text-[#a8a399]">
                  {addTesting ? "Testing..." : "Add & Test"}
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {/* New Schedule Panel */}
        {schedulePanel ? (
          scheduleOk ? (
            <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#141413]/40 backdrop-blur-sm sm:items-center" onClick={() => setSchedulePanel(false)}>
              <div className="animate-rise w-full max-w-md rounded-t-2xl bg-white px-6 pt-6 pb-8 shadow-[0_-1px_48px_rgba(32,32,31,0.18)] sm:rounded-2xl sm:pb-6 sm:shadow-[0_1px_2px_rgba(32,32,31,0.06),0_20px_48px_rgba(32,32,31,0.18)]" onClick={(e) => e.stopPropagation()}>
                <h2 className="text-[16px] font-semibold text-[#1f1f1e] mb-4">Schedule Created</h2>
                <p className="text-[14px] text-[#8a857c]">Your daily briefing has been scheduled.</p>
                <div className="mt-5">
                  <button type="button" onClick={() => setSchedulePanel(false)} className="w-full rounded-full bg-[#FF6700] px-4 py-2 text-[13px] font-medium text-white transition-all duration-200 hover:bg-[#e35c00]">Done</button>
                </div>
              </div>
            </div>
          ) : (
            <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#141413]/40 backdrop-blur-sm sm:items-center" onClick={() => setSchedulePanel(false)}>
              <div className="animate-rise w-full max-w-md rounded-t-2xl bg-white px-6 pt-6 pb-8 shadow-[0_-1px_48px_rgba(32,32,31,0.18)] sm:rounded-2xl sm:pb-6 sm:shadow-[0_1px_2px_rgba(32,32,31,0.06),0_20px_48px_rgba(32,32,31,0.18)]" onClick={(e) => e.stopPropagation()}>
                <div className="mb-5 flex items-center justify-between">
                  <h2 className="text-[16px] font-semibold text-[#1f1f1e]">{scheduleEditingId ? "Edit Schedule" : "New Schedule"}</h2>
                  <button type="button" onClick={() => { setSchedulePanel(false); setScheduleEditingId(null); }} disabled={isBusy} className="rounded-full p-1 text-[#a8a399] transition-colors hover:bg-[#f3f1ea] hover:text-[#625d55] disabled:opacity-50">
                    <svg viewBox="0 0 16 16" className="size-4" fill="none"><path d="M4.5 4.5l7 7m0-7l-7 7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
                  </button>
                </div>
                <div className="mb-5 flex items-center gap-1 rounded-full border border-[#eceae3] bg-white p-1">
                  {["Query & Time", "Channel", "Confirm"].map((label, i) => (
                    <button key={label} disabled={isBusy} className={`flex-1 rounded-full px-2 py-1 text-[12px] font-medium transition-all duration-200 ${scheduleStep === i + 1 ? "bg-[#FF6700] text-white shadow-[0_2px_8px_rgba(255,103,0,0.25)]" : "text-[#a8a399]"}`}>{label}</button>
                  ))}
                </div>
                {scheduleError ? (
                  <div className="animate-rise mb-5 rounded-xl border border-[#fecaca] bg-[#fef2f2] px-4 py-3 text-[13px] text-[#dc2626]">{scheduleError}</div>
                ) : null}
                {scheduleStep === 1 ? (
                  <div className="space-y-4">
                    <div>
                      <label className="mb-1.5 block text-[12px] font-medium text-[#625d55]">Search query</label>
                      <input type="text" value={scheduleQuery} onChange={(e) => setScheduleQuery(e.target.value)} placeholder="e.g. highlights of fouls from USA vs Paraguay" disabled={isBusy} className="w-full rounded-xl border border-[#e8e4db] bg-white px-4 py-2.5 text-[14px] outline-none transition-all duration-200 placeholder:text-[#a8a399] focus:border-[#FECB8B] focus:shadow-[0_1px_2px_rgba(32,32,31,0.05),0_4px_16px_rgba(255,103,0,0.08)] disabled:opacity-50" />
                    </div>
                    <div className="flex gap-3">
                      <div className="flex-1">
                        <label className="mb-1.5 block text-[12px] font-medium text-[#625d55]">Time</label>
                        {scheduleTimeConfirmed ? (
                          <div className="flex items-center gap-2">
                            <span className="rounded-xl border border-[#e8e4db] bg-white px-4 py-2.5 text-[14px] text-[#20201f] flex-1">{formatHourMinute(scheduleTime)}</span>
                            <button type="button" onClick={() => setScheduleTimeConfirmed(false)} disabled={isBusy} className="text-[12px] text-[#a8a399] underline-offset-2 hover:text-[#625d55] hover:underline shrink-0">Edit</button>
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
                                  className="w-[64px] rounded-xl border border-[#e8e4db] bg-white px-2.5 py-2.5 text-[14px] outline-none transition-all duration-200 focus:border-[#FECB8B] focus:shadow-[0_1px_2px_rgba(32,32,31,0.05),0_4px_16px_rgba(255,103,0,0.08)] disabled:opacity-50"
                                >
                                  {Array.from({ length: 12 }, (_, i) => i + 1).map((v) => (
                                    <option key={v} value={v}>{v}</option>
                                  ))}
                                </select>
                                <span className="text-[14px] text-[#a8a399]">:</span>
                                <select
                                  value={m}
                                  onChange={(e) => setTime(h12, Number(e.target.value), ampm)}
                                  disabled={isBusy}
                                  className="w-[64px] rounded-xl border border-[#e8e4db] bg-white px-2.5 py-2.5 text-[14px] outline-none transition-all duration-200 focus:border-[#FECB8B] focus:shadow-[0_1px_2px_rgba(32,32,31,0.05),0_4px_16px_rgba(255,103,0,0.08)] disabled:opacity-50"
                                >
                                  {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map((v) => (
                                    <option key={v} value={v}>{v.toString().padStart(2, "0")}</option>
                                  ))}
                                </select>
                                <div className="flex rounded-full border border-[#eceae3] bg-white p-0.5">
                                  <button
                                    type="button"
                                    onClick={() => setTime(h12, m, "AM")}
                                    disabled={isBusy}
                                    className={`rounded-full px-2.5 py-1.5 text-[12px] font-medium transition-all duration-200 ${ampm === "AM" ? "bg-[#FF6700] text-white" : "text-[#625d55] hover:text-[#20201f]"}`}
                                  >AM</button>
                                  <button
                                    type="button"
                                    onClick={() => setTime(h12, m, "PM")}
                                    disabled={isBusy}
                                    className={`rounded-full px-2.5 py-1.5 text-[12px] font-medium transition-all duration-200 ${ampm === "PM" ? "bg-[#FF6700] text-white" : "text-[#625d55] hover:text-[#20201f]"}`}
                                  >PM</button>
                                </div>
                              </div>
                            );
                          })()
                        )}
                      </div>
                      <div className="flex-[2]">
                        <label className="mb-1.5 block text-[12px] font-medium text-[#625d55]">Timezone</label>
                        <select value={scheduleTimezone} onChange={(e) => setScheduleTimezone(e.target.value)} disabled={isBusy} className="w-full rounded-xl border border-[#e8e4db] bg-white px-4 py-2.5 text-[14px] outline-none transition-all duration-200 focus:border-[#FECB8B] focus:shadow-[0_1px_2px_rgba(32,32,31,0.05),0_4px_16px_rgba(255,103,0,0.08)] disabled:opacity-50">
                          {timezones.map((tz) => (<option key={tz.value} value={tz.value}>{tz.label}</option>))}
                        </select>
                      </div>
                    </div>
                  </div>
                ) : scheduleStep === 2 ? (
                  <div className="space-y-4">
                    <label className="mb-1.5 block text-[12px] font-medium text-[#625d55]">Pick channels</label>
                    {channels.length === 0 ? (
                      <p className="text-[13px] text-[#8a857c]">No channels. Add one above first.</p>
                    ) : (
                      <div className="space-y-2">
                        {channels.map((ch) => (
                          <label key={ch.id} className="flex items-center gap-2.5 cursor-pointer rounded-xl border border-[#eceae3] bg-white px-4 py-3 transition-all duration-200 hover:border-[#FECB8B]">
                            <input type="checkbox" checked={selectedChannelIds.includes(ch.id)} onChange={() => {
                              if (selectedChannelIds.includes(ch.id)) {
                                setSelectedChannelIds(selectedChannelIds.filter((id) => id !== ch.id));
                              } else {
                                setSelectedChannelIds([...selectedChannelIds, ch.id]);
                              }
                            }} disabled={isBusy} className="size-4 rounded accent-[#FF6700]" />
                            <span className="flex-1 text-[14px] text-[#20201f]">{ch.name}</span>
                            <span className={`text-[11px] px-1.5 py-0.5 rounded-full ${ch.type === "discord" ? "bg-[#eeebf7] text-[#5865F2]" : ch.type === "telegram" ? "bg-[#e8f0fe] text-[#1a73e8]" : "bg-[#f3f1ea] text-[#8a857c]"}`}>{ch.type}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <h3 className="text-[13px] font-medium text-[#1f1f1e]">Review your schedule</h3>
                    <div className="rounded-2xl border border-[#eceae3] bg-white p-4 space-y-2">
                      <div><span className="text-[11px] font-medium uppercase tracking-[0.08em] text-[#a8a399]">Query</span><p className="text-[14px] text-[#20201f]">{scheduleQuery}</p></div>
                      <div><span className="text-[11px] font-medium uppercase tracking-[0.08em] text-[#a8a399]">Schedule</span><p className="text-[14px] text-[#20201f]">Daily at {formatHourMinute(scheduleTime)} ({tzLabel})</p></div>
                      <div><span className="text-[11px] font-medium uppercase tracking-[0.08em] text-[#a8a399]">Channels</span><p className="text-[14px] text-[#20201f]">{selectedChannelIds.length ? channels.filter(c => selectedChannelIds.includes(c.id)).map(c => c.name).join(", ") : "None"}</p></div>
                    </div>
                    <button type="button" onClick={handleCreateSchedule} disabled={isBusy || !scheduleQuery.trim() || !scheduleTimeConfirmed || selectedChannelIds.length === 0} className="flex w-full items-center justify-center gap-2 rounded-full bg-[#FF6700] px-4 py-2.5 text-[13px] font-medium text-white transition-all duration-200 hover:bg-[#e35c00] active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-[#E9E9DC] disabled:text-[#a8a399]">
                      {scheduleSubmitting ? "Saving..." : scheduleEditingId ? "Save changes" : "Schedule daily briefing"}
                    </button>
                  </div>
                )}
                <div className="mt-6 flex items-center gap-3">
                  {scheduleStep > 1 ? (
                    <button type="button" onClick={() => setScheduleStep((s) => s - 1)} disabled={isBusy} className="rounded-full border border-[#e5e1d8] bg-white px-4 py-2 text-[13px] text-[#625d55] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#FECB8B] hover:text-[#20201f] disabled:opacity-50">Back</button>
                  ) : (
                    <button type="button" onClick={() => setSchedulePanel(false)} disabled={isBusy} className="rounded-full border border-[#e5e1d8] bg-white px-4 py-2 text-[13px] text-[#625d55] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#FECB8B] hover:text-[#20201f] disabled:opacity-50">Cancel</button>
                  )}
                  {scheduleStep < 3 ? (
                    <button type="button" onClick={() => { if (scheduleStep === 1) setScheduleTimeConfirmed(true); setScheduleStep((s) => s + 1); }} disabled={scheduleStep === 1 ? !scheduleQuery.trim() || !scheduleTime : selectedChannelIds.length === 0} className="flex flex-1 items-center justify-center gap-2 rounded-full bg-[#FF6700] px-4 py-2 text-[13px] font-medium text-white transition-all duration-200 hover:bg-[#e35c00] active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-[#E9E9DC] disabled:text-[#a8a399]">Next</button>
                  ) : null}
                </div>
              </div>
            </div>
          )
        ) : null}

        {/* Delete Channel Confirmation */}
        {deleteChannelId ? (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#141413]/40 backdrop-blur-sm sm:items-center" onClick={() => setDeleteChannelId(null)}>
            <div className="animate-rise w-full max-w-sm rounded-t-2xl bg-white px-6 pt-6 pb-8 shadow-[0_-1px_48px_rgba(32,32,31,0.18)] sm:rounded-2xl sm:pb-6 sm:shadow-[0_1px_2px_rgba(32,32,31,0.06),0_20px_48px_rgba(32,32,31,0.18)]" onClick={(e) => e.stopPropagation()}>
              <h2 className="text-[16px] font-semibold text-[#1f1f1e]">Delete channel?</h2>
              {deleteAffected.length > 0 ? (
                <p className="mt-2 text-[13px] text-[#8a857c]">This channel is used by {deleteAffected.length} active schedule{deleteAffected.length > 1 ? "s" : ""}. Removing it will affect those schedules.</p>
              ) : (
                <p className="mt-2 text-[13px] text-[#8a857c]">This channel is not linked to any schedule.</p>
              )}
              <div className="mt-5 flex items-center gap-3">
                <button type="button" onClick={() => setDeleteChannelId(null)} className="rounded-full border border-[#e5e1d8] bg-white px-4 py-2 text-[13px] text-[#625d55] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#FECB8B] hover:text-[#20201f]">Cancel</button>
                <button type="button" onClick={() => deleteChannel(deleteChannelId)} className="flex flex-1 items-center justify-center gap-2 rounded-full bg-[#dc2626] px-4 py-2 text-[13px] font-medium text-white transition-all duration-200 hover:bg-[#b91c1c] active:scale-[0.98]">Delete</button>
              </div>
            </div>
          </div>
        ) : null}

        {/* Delete Schedule Confirmation */}
        {deleteScheduleId ? (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#141413]/40 backdrop-blur-sm sm:items-center" onClick={() => setDeleteScheduleId(null)}>
            <div className="animate-rise w-full max-w-sm rounded-t-2xl bg-white px-6 pt-6 pb-8 shadow-[0_-1px_48px_rgba(32,32,31,0.18)] sm:rounded-2xl sm:pb-6 sm:shadow-[0_1px_2px_rgba(32,32,31,0.06),0_20px_48px_rgba(32,32,31,0.18)]" onClick={(e) => e.stopPropagation()}>
              <h2 className="text-[16px] font-semibold text-[#1f1f1e]">Delete schedule?</h2>
              <p className="mt-2 text-[13px] text-[#8a857c]">This will permanently remove the schedule. Past runs are not affected.</p>
              <div className="mt-5 flex items-center gap-3">
                <button type="button" onClick={() => setDeleteScheduleId(null)} className="rounded-full border border-[#e5e1d8] bg-white px-4 py-2 text-[13px] text-[#625d55] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#FECB8B] hover:text-[#20201f]">Cancel</button>
                <button type="button" onClick={() => deleteSchedule(deleteScheduleId)} className="flex flex-1 items-center justify-center gap-2 rounded-full bg-[#dc2626] px-4 py-2 text-[13px] font-medium text-white transition-all duration-200 hover:bg-[#b91c1c] active:scale-[0.98]">Delete</button>
              </div>
            </div>
          </div>
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
              <p className="mt-2 rounded-lg bg-[#f3f1ea] px-3 py-2 font-medium text-[#1f1f1e]">
                &ldquo;{confirmToggle.query}&rdquo;
              </p>
            </>
          ) : null}
        </ConfirmModal>
      </div>
    </main>
  );
}
