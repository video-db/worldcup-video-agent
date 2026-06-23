import type { BriefingEvent } from "@/lib/demo-data";
import { logger } from "@/lib/logger";

type NotifyConfig = {
  telegram?: { botToken: string; chatId: string };
  discord?: { webhookUrl: string };
};

type RunInfo = {
  runId: string;
  query: string;
  topic: string | null;
  playerUrl: string;
  events: BriefingEvent[];
  summary: string | null;
  thumbnailUrl: string | null;
};

type DiscordEmbed = {
  title?: string;
  description?: string;
  url?: string;
  color?: number;
  fields?: { name: string; value: string; inline?: boolean }[];
  footer?: { text: string };
  timestamp?: string;
  thumbnail?: { url: string };
};

function resolveBaseUrl() {
  if (process.env.NEXT_PUBLIC_BASE_URL) return process.env.NEXT_PUBLIC_BASE_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  if (process.env.NODE_ENV === "production") {
    logger.warn("NEXT_PUBLIC_BASE_URL is not set in production. Notification links will be broken.");
  }
  return "http://localhost:3000";
}

const baseUrl = resolveBaseUrl();

function briefUrl(runId: string) {
  return `${baseUrl}/b/${runId}`;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function safeUrlAttr(url: string): string {
  return url.replace(/&/g, "&amp;");
}

// ── Telegram ───────────────────────────────────────────────
// HTML parse_mode with anchor text distinct from href.
// Telegram fails <a href="X">X</a> (identical text) but works
// with <a href="X">Watch briefing</a> (different text).

export async function sendTelegramMessage(
  botToken: string,
  chatId: string,
  message: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: "HTML",
        link_preview_options: { is_disabled: true },
      }),
    });
    const data = await res.json();
    if (res.ok && data.ok) {
      return { success: true };
    }
    return { success: false, error: data?.description || `Telegram API returned status ${res.status}` };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Telegram send failed" };
  }
}

// ── Discord ────────────────────────────────────────────────

export async function sendDiscordMessage(
  webhookUrl: string,
  content: string | null,
  embeds: DiscordEmbed[],
): Promise<{ success: boolean; error?: string }> {
  try {
    const body: Record<string, unknown> = { embeds };
    if (content) body.content = content;
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.status === 204 || res.status === 200) {
      return { success: true };
    }
    let errorText = `Discord returned status ${res.status}`;
    try {
      const data = await res.json();
      if (data.message) errorText = data.message;
    } catch {}
    return { success: false, error: errorText };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Discord send failed" };
  }
}

// ── Message builders ───────────────────────────────────────

function buildTelegramMessage(run: RunInfo): string {
  const lines: string[] = [];
  const href = safeUrlAttr(briefUrl(run.runId));
  const title = escapeHtml(run.topic || run.query);

  lines.push(`⚽ <b>${title}</b>`);
  lines.push("");
  lines.push(escapeHtml(run.query));
  lines.push("");
  lines.push(`<a href="${href}">Watch your briefing</a>`);

  if (run.events.length > 0) {
    lines.push("");
    lines.push("<b>Key Moments</b>");
    for (const event of run.events) {
      lines.push(`• <b>${escapeHtml(event.timestamp)}</b> — ${escapeHtml(event.label)}`);
    }
  }

  if (run.summary) {
    lines.push("");
    lines.push(escapeHtml(run.summary));
  }

  return lines.join("\n");
}

function buildDiscordEmbeds(run: RunInfo): DiscordEmbed[] {
  const url = briefUrl(run.runId);
  const title = run.topic || run.query;

  const fields: { name: string; value: string; inline?: boolean }[] = [];

  fields.push({ name: "Watch", value: `[Open Briefing](${url})`, inline: false });

  if (run.events.length > 0) {
    const momentsText = run.events
      .map((e) => `• **${e.timestamp}** — ${e.label}`)
      .join("\n");
    fields.push({ name: "Key Moments", value: momentsText, inline: false });
  }

  if (run.summary) {
    fields.push({ name: "Match Summary", value: run.summary, inline: false });
  }

  return [
    {
      title,
      description: run.query,
      color: 0x2ecc71,
      thumbnail: run.thumbnailUrl ? { url: run.thumbnailUrl } : undefined,
      fields,
      footer: { text: "World Cup Briefing" },
      timestamp: new Date().toISOString(),
    },
  ];
}

// ── Notifications ──────────────────────────────────────────

export async function sendRunNotification(
  notifyConfig: NotifyConfig,
  run: RunInfo,
): Promise<void> {
  const results: string[] = [];

  if (notifyConfig.telegram?.botToken && notifyConfig.telegram?.chatId) {
    const tgMessage = buildTelegramMessage(run);
    const result = await sendTelegramMessage(
      notifyConfig.telegram.botToken,
      notifyConfig.telegram.chatId,
      tgMessage,
    );
    if (!result.success) {
      logger.error({ err: result.error }, "Telegram notification failed");
    } else {
      results.push("telegram");
    }
  }

  if (notifyConfig.discord?.webhookUrl) {
    const embeds = buildDiscordEmbeds(run);
    const result = await sendDiscordMessage(
      notifyConfig.discord.webhookUrl,
      null,
      embeds,
    );
    if (!result.success) {
      logger.error({ err: result.error }, "Discord notification failed");
    } else {
      results.push("discord");
    }
  }

  if (results.length > 0) {
    logger.info({ channels: results.length }, "Notifications sent to: %s", results.join(", "));
  }
}

// ── Schedule change notifications ──────────────────────────

export async function notifyScheduleChange(
  notifyConfig: NotifyConfig,
  schedule: { query: string; runTime: string; timezone: string; action: "created" | "paused" | "resumed" | "removed" | "updated" },
): Promise<void> {
  const [h, m] = schedule.runTime.split(":").map(Number);
  const hour = h % 12 || 12;
  const ampm = h < 12 ? "AM" : "PM";
  const timeLabel = `${hour}:${String(m).padStart(2, "0")} ${ampm} ${schedule.timezone}`;

  const actions: Record<string, { text: string; embedColor: number; embedTitle: string }> = {
    created: {
      text: `⚽ <b>Daily briefing scheduled</b>\n\n<b>${escapeHtml(schedule.query)}</b>\n\nYour reel will arrive around ${escapeHtml(timeLabel)}.`,
      embedColor: 0x2ecc71,
      embedTitle: "Schedule Created",
    },
    paused: {
      text: `⏸ <b>Briefing paused</b>\n\n<b>${escapeHtml(schedule.query)}</b>\n\nThe schedule is now inactive.`,
      embedColor: 0xf1c40f,
      embedTitle: "Schedule Paused",
    },
    resumed: {
      text: `▶ <b>Briefing resumed</b>\n\n<b>${escapeHtml(schedule.query)}</b>\n\nYour reel will arrive around ${escapeHtml(timeLabel)}.`,
      embedColor: 0x2ecc71,
      embedTitle: "Schedule Resumed",
    },
    removed: {
      text: `📤 <b>Removed from briefing</b>\n\n<b>${escapeHtml(schedule.query)}</b>`,
      embedColor: 0xe74c3c,
      embedTitle: "Schedule Removed",
    },
    updated: {
      text: `✏ <b>Briefing updated</b>\n\n<b>${escapeHtml(schedule.query)}</b>\n\nYour reel will arrive around ${escapeHtml(timeLabel)}.`,
      embedColor: 0x3498db,
      embedTitle: "Schedule Updated",
    },
  };

  const a = actions[schedule.action];
  const results: string[] = [];

  if (notifyConfig.telegram?.botToken && notifyConfig.telegram?.chatId) {
    const result = await sendTelegramMessage(notifyConfig.telegram.botToken, notifyConfig.telegram.chatId, a.text);
    if (!result.success) logger.error({ err: result.error }, "Schedule Telegram notify failed");
    else results.push("telegram");
  }

  if (notifyConfig.discord?.webhookUrl) {
    const embed: DiscordEmbed = {
      title: a.embedTitle,
      description: schedule.query,
      color: a.embedColor,
      footer: { text: `Runs daily at ${timeLabel}` },
    };
    const result = await sendDiscordMessage(notifyConfig.discord.webhookUrl, null, [embed]);
    if (!result.success) logger.error({ err: result.error }, "Schedule Discord notify failed");
    else results.push("discord");
  }

  if (results.length > 0) {
    logger.info({ channels: results.length }, "Schedule change notified to: %s", results.join(", "));
  }
}
