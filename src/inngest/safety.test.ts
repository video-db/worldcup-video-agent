import { describe, expect, it } from "vitest";
import {
  APPROVED_INNGEST_BASE_URL,
  INNGEST_SERVE_PATH,
  inspectInngestConfiguration,
  isSecureInngestEventKey,
  isSecureInngestSigningKey,
  resolveInngestRuntime,
  resolveInngestServeConfiguration,
} from "./safety";

const signingKey = "ab".repeat(32);
const productionEnvironment = {
  NODE_ENV: "production",
  VERCEL_ENV: "production",
  VERCEL_PROJECT_PRODUCTION_URL: "world-cup.example.com",
  INNGEST_MODE: "self-hosted",
  INNGEST_BASE_URL: APPROVED_INNGEST_BASE_URL,
  INNGEST_EVENT_KEY: "azure-event-key",
  INNGEST_SIGNING_KEY: signingKey,
  INNGEST_DEV: "0",
  INNGEST_SERVE_ORIGIN: "https://world-cup.example.com",
  INNGEST_SERVE_PATH,
};

describe("Azure-only Inngest safety", () => {
  it("accepts the complete hosted Azure configuration", () => {
    expect(resolveInngestRuntime(productionEnvironment)).toMatchObject({
      baseUrl: APPROVED_INNGEST_BASE_URL,
      eventKey: "azure-event-key",
      production: true,
    });
    expect(resolveInngestServeConfiguration(productionEnvironment)).toMatchObject({
      origin: "https://world-cup.example.com",
      path: INNGEST_SERVE_PATH,
      production: true,
    });
    expect(inspectInngestConfiguration(productionEnvironment).ready).toBe(true);
  });

  it("fails closed for Cloud mode, alternate origins, dev mode, and fallback keys", () => {
    expect(() => resolveInngestRuntime({ ...productionEnvironment, INNGEST_MODE: "cloud" })).toThrow(
      "Cloud fallback is disabled",
    );
    expect(() => resolveInngestRuntime({ ...productionEnvironment, INNGEST_BASE_URL: "https://api.inngest.com" })).toThrow(
      "exactly match",
    );
    expect(() => resolveInngestRuntime({ ...productionEnvironment, INNGEST_DEV: "1" })).toThrow(
      "INNGEST_DEV",
    );
    expect(() => resolveInngestRuntime({ ...productionEnvironment, INNGEST_SIGNING_KEY_FALLBACK: "old" })).toThrow(
      "forbidden",
    );
  });

  it("requires exact serving identity and path in hosted production", () => {
    expect(() => resolveInngestServeConfiguration({
      ...productionEnvironment,
      INNGEST_SERVE_ORIGIN: "https://preview.example.com",
    })).toThrow("INNGEST_SERVE_ORIGIN");
    expect(() => resolveInngestServeConfiguration({
      ...productionEnvironment,
      INNGEST_SERVE_PATH: "/api/inngest/",
    })).toThrow("INNGEST_SERVE_PATH");
  });

  it("uses only a localhost endpoint in explicit local development", () => {
    expect(resolveInngestRuntime({ INNGEST_DEV: "1" })).toMatchObject({
      baseUrl: "http://localhost:8288",
      eventKey: "test-key",
      production: false,
    });
    expect(() => resolveInngestRuntime({ INNGEST_DEV: "1", INNGEST_BASE_URL: APPROVED_INNGEST_BASE_URL })).toThrow(
      "localhost",
    );
  });

  it("rejects whitespace-tainted event keys and invalid signing keys", () => {
    expect(isSecureInngestEventKey("event-key")).toBe(true);
    expect(isSecureInngestEventKey(" event-key")).toBe(false);
    expect(isSecureInngestEventKey("event key")).toBe(false);
    expect(isSecureInngestSigningKey(signingKey)).toBe(true);
    expect(isSecureInngestSigningKey(`${signingKey} `)).toBe(false);
    expect(isSecureInngestSigningKey("ab".repeat(31))).toBe(false);
  });
});
