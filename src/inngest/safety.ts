export const APPROVED_INNGEST_BASE_URL =
  "https://ca-inngest-dev.ashyfield-21cb2f83.centralindia.azurecontainerapps.io";
export const WORLD_CUP_BRIEFING_INNGEST_APP_ID = "world-cup-briefing-v3";
export const INNGEST_SERVE_PATH = "/api/inngest";

const DEFAULT_WORKFLOW_CONCURRENCY = 2;
const MAX_WORKFLOW_CONCURRENCY = 2;

type Environment = Record<string, string | undefined>;

function isHostedProduction(env: Environment) {
  return env.NODE_ENV === "production" || env.VERCEL_ENV === "production";
}

function hasEnvironmentVariable(env: Environment, name: string) {
  return Object.prototype.hasOwnProperty.call(env, name);
}

function isExactOrigin(value: string | undefined) {
  try {
    const parsed = new URL(value || "");
    return (
      parsed.origin === value &&
      parsed.protocol === "https:" &&
      !parsed.username &&
      !parsed.password &&
      parsed.pathname === "/" &&
      !parsed.search &&
      !parsed.hash
    );
  } catch {
    return false;
  }
}

function isLocalInngestOrigin(value: string) {
  try {
    const parsed = new URL(value);
    return (
      parsed.origin === value &&
      parsed.protocol === "http:" &&
      (parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1") &&
      parsed.pathname === "/" &&
      !parsed.search &&
      !parsed.hash
    );
  } catch {
    return false;
  }
}

export function isSecureInngestEventKey(value: string | undefined) {
  return typeof value === "string" && value.length > 0 && /^\S+$/.test(value);
}

/** The Inngest server requires an even-length hexadecimal signing key. */
export function isSecureInngestSigningKey(value: string | undefined) {
  return typeof value === "string" && /^(?:[0-9a-fA-F]{2}){32,}$/.test(value);
}

export function boundedWorkflowConcurrency(
  raw = process.env.INNGEST_WORKFLOW_CONCURRENCY,
) {
  if (!raw || !/^\d+$/.test(raw)) return DEFAULT_WORKFLOW_CONCURRENCY;
  const value = Number.parseInt(raw, 10);
  if (!Number.isFinite(value) || value < 1) return DEFAULT_WORKFLOW_CONCURRENCY;
  return Math.min(value, MAX_WORKFLOW_CONCURRENCY);
}

export const worldCupWorkflowConcurrency = {
  scope: "env" as const,
  key: '"world-cup-briefing-heavy"',
  limit: boundedWorkflowConcurrency(),
};

export function resolveInngestRuntime(env: Environment = process.env) {
  const production = isHostedProduction(env);
  const devMode = env.INNGEST_DEV?.toLowerCase();

  if (hasEnvironmentVariable(env, "INNGEST_SIGNING_KEY_FALLBACK")) {
    throw new Error(
      "INNGEST_SIGNING_KEY_FALLBACK is forbidden; configure exactly one signing key.",
    );
  }

  if (production) {
    if (env.INNGEST_MODE !== "self-hosted") {
      throw new Error(
        "Production Inngest is locked to INNGEST_MODE=self-hosted; Cloud fallback is disabled.",
      );
    }
    if (env.INNGEST_BASE_URL !== APPROVED_INNGEST_BASE_URL) {
      throw new Error(
        `Production INNGEST_BASE_URL must exactly match ${APPROVED_INNGEST_BASE_URL}.`,
      );
    }
    if (devMode !== undefined && devMode !== "0" && devMode !== "false") {
      throw new Error("INNGEST_DEV must be unset, 0, or false in hosted production.");
    }
    if (!isSecureInngestEventKey(env.INNGEST_EVENT_KEY)) {
      throw new Error("INNGEST_EVENT_KEY must be nonempty and contain no whitespace.");
    }
    if (!isSecureInngestSigningKey(env.INNGEST_SIGNING_KEY)) {
      throw new Error(
        "INNGEST_SIGNING_KEY must be at least 64 hexadecimal characters with an even length and no whitespace.",
      );
    }
    return {
      baseUrl: APPROVED_INNGEST_BASE_URL,
      eventKey: env.INNGEST_EVENT_KEY,
      production,
    };
  }

  if (devMode === "1") {
    const baseUrl = env.INNGEST_BASE_URL || "http://localhost:8288";
    if (!isLocalInngestOrigin(baseUrl)) {
      throw new Error(
        "Local INNGEST_DEV=1 is restricted to an explicit HTTP localhost Inngest endpoint.",
      );
    }
    return { baseUrl, eventKey: "test-key", production };
  }

  // Explicitly retain a local, non-Cloud default for non-production processes.
  if (env.INNGEST_BASE_URL && env.INNGEST_BASE_URL !== APPROVED_INNGEST_BASE_URL) {
    throw new Error(
      `Non-production INNGEST_BASE_URL must be local development or ${APPROVED_INNGEST_BASE_URL}.`,
    );
  }
  if (env.INNGEST_BASE_URL === APPROVED_INNGEST_BASE_URL) {
    if (!isSecureInngestEventKey(env.INNGEST_EVENT_KEY)) {
      throw new Error("INNGEST_EVENT_KEY must be nonempty and contain no whitespace.");
    }
    if (!isSecureInngestSigningKey(env.INNGEST_SIGNING_KEY)) {
      throw new Error(
        "INNGEST_SIGNING_KEY must be at least 64 hexadecimal characters with an even length and no whitespace.",
      );
    }
    return { baseUrl: APPROVED_INNGEST_BASE_URL, eventKey: env.INNGEST_EVENT_KEY, production };
  }
  return { baseUrl: "http://localhost:8288", eventKey: "test-key", production };
}

export function resolveInngestServeConfiguration(env: Environment = process.env) {
  const production = isHostedProduction(env);
  if (production) {
    const host = env.VERCEL_PROJECT_PRODUCTION_URL;
    const expectedOrigin = host ? `https://${host}` : undefined;
    if (!host || host !== host.trim() || /[/:?#@\s]/.test(host)) {
      throw new Error("VERCEL_PROJECT_PRODUCTION_URL must be the exact production hostname.");
    }
    if (
      env.INNGEST_SERVE_ORIGIN !== expectedOrigin ||
      !isExactOrigin(env.INNGEST_SERVE_ORIGIN)
    ) {
      throw new Error(
        "INNGEST_SERVE_ORIGIN must exactly match https://VERCEL_PROJECT_PRODUCTION_URL.",
      );
    }
    if (env.INNGEST_SERVE_PATH !== INNGEST_SERVE_PATH) {
      throw new Error(`INNGEST_SERVE_PATH must exactly match ${INNGEST_SERVE_PATH}.`);
    }
    return { origin: expectedOrigin, path: INNGEST_SERVE_PATH, production };
  }

  const origin =
    env.INNGEST_SERVE_ORIGIN || env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  if (!isExactOrigin(origin) && !isLocalInngestOrigin(origin)) {
    throw new Error("INNGEST_SERVE_ORIGIN must be an exact HTTPS or local HTTP origin.");
  }
  if (env.INNGEST_SERVE_PATH && env.INNGEST_SERVE_PATH !== INNGEST_SERVE_PATH) {
    throw new Error(`INNGEST_SERVE_PATH must exactly match ${INNGEST_SERVE_PATH}.`);
  }
  return { origin, path: INNGEST_SERVE_PATH, production };
}

export function inspectInngestConfiguration(env: Environment = process.env) {
  try {
    const runtime = resolveInngestRuntime(env);
    const serve = resolveInngestServeConfiguration(env);
    return {
      ready: true,
      checks: {
        selfHostedMode: runtime.production ? env.INNGEST_MODE === "self-hosted" : true,
        approvedBaseUrl:
          runtime.production ? runtime.baseUrl === APPROVED_INNGEST_BASE_URL : true,
        eventKey: runtime.production ? isSecureInngestEventKey(env.INNGEST_EVENT_KEY) : true,
        signingKey: runtime.production ? isSecureInngestSigningKey(env.INNGEST_SIGNING_KEY) : true,
        noSigningKeyFallback: !hasEnvironmentVariable(env, "INNGEST_SIGNING_KEY_FALLBACK"),
        serveOrigin: Boolean(serve.origin),
        servePath: serve.path === INNGEST_SERVE_PATH,
      },
    };
  } catch {
    return {
      ready: false,
      checks: {
        selfHostedMode: env.INNGEST_MODE === "self-hosted",
        approvedBaseUrl: env.INNGEST_BASE_URL === APPROVED_INNGEST_BASE_URL,
        eventKey: isSecureInngestEventKey(env.INNGEST_EVENT_KEY),
        signingKey: isSecureInngestSigningKey(env.INNGEST_SIGNING_KEY),
        noSigningKeyFallback: !hasEnvironmentVariable(env, "INNGEST_SIGNING_KEY_FALLBACK"),
        serveOrigin: false,
        servePath: env.INNGEST_SERVE_PATH === INNGEST_SERVE_PATH,
      },
    };
  }
}
