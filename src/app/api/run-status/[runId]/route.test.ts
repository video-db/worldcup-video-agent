import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  limit: vi.fn(),
  update: vi.fn(),
  resolveSessionToken: vi.fn(),
  getApiKeyHashes: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  runs: { id: "id" },
  db: {
    select: () => ({ from: () => ({ where: () => ({ limit: mocks.limit }) }) }),
    update: mocks.update,
  },
}));
vi.mock("@/lib/session", () => mocks);
vi.mock("@/lib/logger", () => ({ logger: { error: vi.fn() } }));

import { GET } from "./route";

const run = {
  id: "707b5004-ea8a-4593-82ef-d099a2dba917",
  query: "Create a football highlight",
  status: "processing",
  mode: "free",
  createdAt: new Date(Date.now() - 40 * 60 * 1000),
  statusMessage: "Waiting for scene index to build...",
};

function readStatus() {
  return GET(new NextRequest(`https://example.com/api/run-status/${run.id}`), {
    params: Promise.resolve({ runId: run.id }),
  });
}

describe("run status reads", () => {
  beforeEach(() => vi.clearAllMocks());

  it("reports a long-running worker without failing it when the page is opened", async () => {
    mocks.limit.mockResolvedValue([run]);
    const response = await readStatus();
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      status: "processing",
      statusMessage: run.statusMessage,
    });
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it("preserves the worker's actual terminal failure", async () => {
    mocks.limit.mockResolvedValue([{ ...run, status: "failed", errorMessage: "VideoDB scene index failed" }]);
    expect(await (await readStatus()).json()).toMatchObject({
      status: "failed",
      errorMessage: "VideoDB scene index failed",
    });
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it("keeps an unfinished private run hidden without a session", async () => {
    mocks.limit.mockResolvedValue([{ ...run, mode: "byok", isPublic: false }]);
    expect((await readStatus()).status).toBe(404);
    expect(mocks.update).not.toHaveBeenCalled();
  });
});
