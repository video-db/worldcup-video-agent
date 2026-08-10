import { serve } from "inngest/next";
import { inngest } from "@/inngest/client";
import { resolveInngestServeConfiguration } from "@/inngest/safety";
import { checkSchedules, createReel } from "@/inngest/functions";

export const runtime = "nodejs";
export const maxDuration = 800;

const serveConfiguration = resolveInngestServeConfiguration();

export const { GET, POST, PUT } = serve({
  client: inngest,
  serveOrigin: serveConfiguration.origin,
  servePath: serveConfiguration.path,
  enableUnauthedSync: false,
  streaming: true,
  functions: [createReel, checkSchedules],
});
