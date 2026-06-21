import { and, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { channels, db, schedules } from "@/lib/db";
import { resolveSessionToken } from "@/lib/session";
import { encryptJson } from "@/lib/encrypt";
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const apiKeyHash = getApiKeyHash(request);
  if (!apiKeyHash) {
    return NextResponse.json({ error: "Missing x-vdb-key-hash or x-session-token header" }, { status: 400 });
  }

  const { id } = await params;

  try {
    const [channel] = await db
      .select({ id: channels.id, apiKeyHash: channels.apiKeyHash })
      .from(channels)
      .where(and(eq(channels.id, id), eq(channels.apiKeyHash, apiKeyHash)))
      .limit(1);

    if (!channel) {
      return NextResponse.json({ error: "Channel not found" }, { status: 404 });
    }

    const allSchedules = await db
      .select({ id: schedules.id, channelConfig: schedules.channelConfig, isActive: schedules.isActive })
      .from(schedules)
      .where(eq(schedules.apiKeyHash, apiKeyHash));

    const affected: string[] = [];

    for (const schedule of allSchedules) {
      const cfg = (schedule.channelConfig || {}) as Record<string, unknown>;
      const channelIds = (Array.isArray(cfg.channelIds) ? cfg.channelIds : []) as string[];
      if (channelIds.includes(id)) {
        affected.push(schedule.id);
        const remaining = channelIds.filter((cid) => cid !== id);
        if (remaining.length === 0) {
          await db
            .update(schedules)
            .set({ channelConfig: { channelIds: [] }, channel: "none", isActive: false })
            .where(eq(schedules.id, schedule.id));
        } else {
          await db
            .update(schedules)
            .set({ channelConfig: { channelIds: remaining } })
            .where(eq(schedules.id, schedule.id));
        }
      }
    }

    await db.delete(channels).where(eq(channels.id, id));

    return NextResponse.json({ success: true, affectedScheduleIds: affected });
  } catch (error) {
    logger.error({ err: error }, "Channels DELETE error");
    return NextResponse.json({ error: "Failed to delete channel" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const apiKeyHash = getApiKeyHash(request);
  if (!apiKeyHash) {
    return NextResponse.json({ error: "Missing x-vdb-key-hash or x-session-token header" }, { status: 400 });
  }

  const { id } = await params;

  try {
    const [channel] = await db
      .select({ id: channels.id, apiKeyHash: channels.apiKeyHash })
      .from(channels)
      .where(and(eq(channels.id, id), eq(channels.apiKeyHash, apiKeyHash)))
      .limit(1);

    if (!channel) {
      return NextResponse.json({ error: "Channel not found" }, { status: 404 });
    }

    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;

    if (typeof body?.name === "string" && body.name.trim()) {
      await db
        .update(channels)
        .set({ name: body.name.trim() })
        .where(eq(channels.id, id));
    }

    if (body?.credentials && typeof body.credentials === "object") {
      await db
        .update(channels)
        .set({
          credentialsEnc: encryptJson(body.credentials as Record<string, unknown>),
          isValidated: false,
        })
        .where(eq(channels.id, id));
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error({ err: error }, "Channels PATCH error");
    return NextResponse.json({ error: "Failed to update channel" }, { status: 500 });
  }
}
