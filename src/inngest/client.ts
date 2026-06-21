import { Inngest } from "inngest";

export const inngest = new Inngest({
  id: "world-cup-briefing",
  baseUrl: process.env.INNGEST_DEV ? "http://localhost:8288" : undefined,
  eventKey: process.env.INNGEST_DEV ? "test-key" : process.env.INNGEST_EVENT_KEY,
});
