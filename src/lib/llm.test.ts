import { afterEach, describe, expect, it, vi } from "vitest";
import { getModel, getModelName, llmGenerateJson } from "./llm";

afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

describe("direct OpenAI transport", () => {
  it("sends JSON generation only to OpenAI with the OpenAI credential", async () => {
    vi.stubEnv("OPENAI_API_KEY", "openai-test-key");
    vi.stubEnv("OPENAI_MODEL", "");
    vi.stubEnv("OPEN_ROUTER_API_KEY", "obsolete-router-key");
    vi.stubEnv("OPENROUTER_MODEL", "deepseek/deepseek-chat");
    const request = vi.fn<typeof fetch>(async () => new Response(JSON.stringify({
      id: "chatcmpl-test", object: "chat.completion", created: 1, model: "gpt-4.1-mini",
      choices: [{ index: 0, message: { role: "assistant", content: '{"ok":true}' }, finish_reason: "stop" }],
      usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 },
    }), { headers: { "Content-Type": "application/json" } }));
    vi.stubGlobal("fetch", request);
    expect(await llmGenerateJson('Return JSON {"ok":true}')).toEqual({ ok: true });
    expect(String(request.mock.calls[0][0])).toBe("https://api.openai.com/v1/chat/completions");
    const init = request.mock.calls[0][1] as RequestInit;
    expect(new Headers(init.headers).get("authorization")).toBe("Bearer openai-test-key");
    expect(JSON.parse(String(init.body)).model).toBe("gpt-4.1-mini");
  });

  it("requires an OpenAI key even if an obsolete router key remains", () => {
    vi.stubEnv("OPENAI_API_KEY", "");
    vi.stubEnv("OPEN_ROUTER_API_KEY", "obsolete-router-key");
    expect(() => getModel()).toThrow("OPENAI_API_KEY is not configured");
  });

  it("uses the same configured model for generation and reporting", () => {
    vi.stubEnv("OPENAI_API_KEY", "openai-test-key");
    vi.stubEnv("OPENAI_MODEL", "gpt-4.1-mini-2025-04-14");
    expect(getModel().modelId).toBe(getModelName());
    expect(getModelName()).toBe("gpt-4.1-mini-2025-04-14");
  });
});
