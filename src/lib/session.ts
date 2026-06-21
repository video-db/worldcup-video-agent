import { createHash } from "crypto";
import { decrypt, encrypt } from "@/lib/encrypt";

type SessionPayload = {
  tf: string;
  vdb: string;
  exp: number;
};

const TOKEN_TTL = 24 * 60 * 60 * 1000; // 24 hours

export function createSessionToken(tfApiKey: string, vdbApiKey: string): string {
  const payload: SessionPayload = {
    tf: tfApiKey,
    vdb: vdbApiKey,
    exp: Date.now() + TOKEN_TTL,
  };
  return encrypt(JSON.stringify(payload));
}

export function resolveSessionToken(token: string): { tfApiKey: string; vdbApiKey: string; apiKeyHash: string } | null {
  try {
    const raw = decrypt(token);
    const payload = JSON.parse(raw) as SessionPayload;
    if (!payload.tf || !payload.vdb) return null;
    if (Date.now() > payload.exp) return null;
    const apiKeyHash = createHash("sha256").update(payload.vdb).digest("hex");
    return { tfApiKey: payload.tf, vdbApiKey: payload.vdb, apiKeyHash };
  } catch {
    return null;
  }
}

export function resolveApiKeyHash(token: string): string | null {
  const session = resolveSessionToken(token);
  return session?.apiKeyHash ?? null;
}
