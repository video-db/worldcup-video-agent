import { NextResponse } from "next/server";
import {
  inspectInngestConfiguration,
  WORLD_CUP_BRIEFING_INNGEST_APP_ID,
} from "@/inngest/safety";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const configuration = inspectInngestConfiguration();
  return NextResponse.json(
    {
      status: configuration.ready ? "ok" : "unavailable",
      app: WORLD_CUP_BRIEFING_INNGEST_APP_ID,
      configuration: configuration.checks,
    },
    { status: configuration.ready ? 200 : 503 },
  );
}
