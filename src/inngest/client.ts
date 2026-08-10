import { Inngest } from "inngest";
import {
  resolveInngestRuntime,
  WORLD_CUP_BRIEFING_INNGEST_APP_ID,
} from "./safety";

const runtime = resolveInngestRuntime();

export const inngest = new Inngest({
  id: WORLD_CUP_BRIEFING_INNGEST_APP_ID,
  baseUrl: runtime.baseUrl,
  eventKey: runtime.eventKey,
  checkpointing: {
    maxRuntime: "10m",
    bufferedSteps: 1,
  },
});
