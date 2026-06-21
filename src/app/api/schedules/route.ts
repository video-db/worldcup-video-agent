import { and, desc, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { channels, db, schedules } from "@/lib/db";
import { decryptJson, encrypt } from "@/lib/encrypt";
import { notifyScheduleChange } from "@/lib/notify";
import { resolveSessionToken } from "@/lib/session";
import { computeNextRunAt } from "@/lib/timezone";
import { logger } from "@/lib/logger";

function getApiKeyHash(request: NextRequest): string | null {
  const hash = request.headers.get("x-vdb-key-hash");
  if (hash) return hash;
  const token = request.headers.get("x-session-token");
  if (token) {
    const s = resolveSessionToken(token);
    return s?.apiKeyHash ?? null;
  }
  return null;
}

export async function GET(request: NextRequest) {
  const apiKeyHash = getApiKeyHash(request);
  if (!apiKeyHash) {
    return NextResponse.json({ error: "Missing x-vdb-key-hash or x-session-token header" }, { status: 400 });
  }

  try {
    const rows = await db
      .select({
        id: schedules.id,
        query: schedules.query,
        runTime: schedules.runTime,
        timezone: schedules.timezone,
        channel: schedules.channel,
        isActive: schedules.isActive,
        nextRunAt: schedules.nextRunAt,
        lastRunAt: schedules.lastRunAt,
        createdAt: schedules.createdAt,
      })
      .from(schedules)
      .where(eq(schedules.apiKeyHash, apiKeyHash))
      .orderBy(desc(schedules.createdAt))
      .limit(50);

    return NextResponse.json({
      schedules: rows.map((row) => ({
        id: row.id,
        query: row.query,
        runTime: row.runTime,
        timezone: row.timezone,
        channel: row.channel,
        isActive: row.isActive,
        nextRunAt: row.nextRunAt?.toISOString() ?? null,
        lastRunAt: row.lastRunAt?.toISOString() ?? null,
        createdAt: row.createdAt?.toISOString() ?? null,
      })),
    });
  } catch (error) {
    logger.error({ err: error }, "Schedules GET error");
    return NextResponse.json({ schedules: [] }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;

  const query = typeof body?.query === "string" ? body.query.trim() : "";
  const runTime = typeof body?.runTime === "string" ? body.runTime.trim() : "";
  const timezone = typeof body?.timezone === "string" ? body.timezone.trim() : "";
  const channelIds: string[] = Array.isArray(body?.channelIds) ? body.channelIds.filter((id: unknown) => typeof id === "string") : [];
  const session = resolveSessionToken(request.headers.get("x-session-token") || "");
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const tfApiKey = session.tfApiKey;
  const vdbApiKey = session.vdbApiKey;
  const apiKeyHash = session.apiKeyHash;

  if (!query || !runTime || !timezone) {
    return NextResponse.json(
      { error: "Missing required fields: query, runTime, timezone" },
      { status: 400 },
    );
  }

  if (channelIds.length === 0) {
    return NextResponse.json(
      { error: "At least one channel must be selected" },
      { status: 400 },
    );
  }

  if (!/^\d{2}:\d{2}$/.test(runTime)) {
    return NextResponse.json({ error: "Invalid runTime format. Expected HH:MM." }, { status: 400 });
  }

  try {
    const tfApiKeyEnc = encrypt(tfApiKey);
    const vdbApiKeyEnc = encrypt(vdbApiKey);

    const channelRows = await db
      .select({ id: channels.id, type: channels.type, credentialsEnc: channels.credentialsEnc })
      .from(channels)
      .where(and(eq(channels.apiKeyHash, apiKeyHash)));

    const channelMap = new Map(channelRows.map((c) => [c.id, c.type]));
    const channel = channelIds.map((cid) => channelMap.get(cid)).filter(Boolean).join(",") || "none";

    const channelCreds = new Map<string, Record<string, unknown>>();
    for (const c of channelRows) {
      try { channelCreds.set(c.id, decryptJson(c.credentialsEnc)); } catch {}
    }

    const nextRunAt = computeNextRunAt(runTime, timezone);

    const [inserted] = await db
      .insert(schedules)
      .values({
        query,
        runTime,
        timezone,
        channel,
        channelConfig: { channelIds },
        tfApiKeyEnc,
        vdbApiKeyEnc,
        apiKeyHash,
        isActive: true,
        nextRunAt,
      })
      .returning({ id: schedules.id, nextRunAt: schedules.nextRunAt });

    const notifyConfig: { telegram?: { botToken: string; chatId: string }; discord?: { webhookUrl: string } } = {};
    for (const cid of channelIds) {
      const c = channelCreds.get(cid);
      const chType = channelMap.get(cid);
      if (!c || !chType) continue;
      if (chType === "telegram" && c.botToken && c.chatId) {
        notifyConfig.telegram = { botToken: c.botToken as string, chatId: c.chatId as string };
      }
      if (chType === "discord" && c.webhookUrl) {
        notifyConfig.discord = { webhookUrl: c.webhookUrl as string };
      }
    }
    notifyScheduleChange(notifyConfig, { query, runTime, timezone, action: "created" }).catch(() => {});

    return NextResponse.json({
      scheduleId: inserted.id,
      nextRunAt: inserted.nextRunAt?.toISOString() ?? null,
    });
  } catch (error) {
    logger.error({ err: error }, "Schedules POST error");
    return NextResponse.json({ error: "Failed to create schedule" }, { status: 500 });
  }
}
