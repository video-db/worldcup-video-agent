import { NextRequest, NextResponse } from "next/server";
import { TinyFish } from "@tiny-fish/sdk";
import { connect } from "videodb";
import { createSessionToken } from "@/lib/session";

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as {
    tfApiKey?: string;
    vdbApiKey?: string;
  } | null;

  const tfApiKey = body?.tfApiKey?.trim() || "";
  const vdbApiKey = body?.vdbApiKey?.trim() || "";

  if (!tfApiKey || !vdbApiKey) {
    return NextResponse.json({ error: "Both API keys are required" }, { status: 400 });
  }

  try {
    const client = new TinyFish({ apiKey: tfApiKey, timeout: 10000, maxRetries: 0 });
    await client.search.query({ query: "test" });
  } catch {
    return NextResponse.json({ error: "TinyFish API key is invalid" }, { status: 401 });
  }

  try {
    const conn = connect(vdbApiKey);
    await conn.getCollections();
  } catch {
    return NextResponse.json({ error: "VideoDB API key is invalid" }, { status: 401 });
  }

  const token = createSessionToken(tfApiKey, vdbApiKey);
  return NextResponse.json({ token });
}
