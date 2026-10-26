import { NextRequest, NextResponse } from "next/server";
import * as Ably from "ably";
import { pairingDb } from "@/lib/pairing";
export const runtime = "nodejs";
export async function POST(request: NextRequest) {
  if (!process.env.ABLY_API_KEY) return NextResponse.json({ error: "ABLY_API_KEY is not configured." }, { status: 503 });
  let data: Record<string, string> = {};
  try {
    const type = request.headers.get("content-type") || "";
    if (type.includes("application/json")) data = await request.json();
    else { const form = await request.formData(); form.forEach((v, k) => { data[k] = String(v); }); }
  } catch { return NextResponse.json({ error: "Invalid token request." }, { status: 400 }); }
  const { sessionId, role, secret } = data;
  if (!sessionId || !secret || !["tv", "phone"].includes(role)) return NextResponse.json({ error: "Invalid pairing credentials." }, { status: 400 });
  try {
    const sql = pairingDb();
    const rows = role === "tv"
      ? await sql`SELECT channel_name, status FROM pairing_sessions WHERE session_id = ${sessionId} AND tv_secret = ${secret} AND expires_at > NOW() AND status IN ('waiting','paired') LIMIT 1`
      : await sql`SELECT channel_name, status FROM pairing_sessions WHERE session_id = ${sessionId} AND phone_secret = ${secret} AND expires_at > NOW() AND status = 'paired' LIMIT 1`;
    if (!rows.length) return NextResponse.json({ error: "Pairing session expired or credentials invalid." }, { status: 401 });
    const channel = String(rows[0].channel_name);
    const ably = new Ably.Rest(process.env.ABLY_API_KEY);
    const tokenRequest = await ably.auth.createTokenRequest({
      clientId: `${role}-${sessionId.slice(0, 8)}`,
      capability: JSON.stringify({ [channel]: ["publish", "subscribe"] }),
      ttl: 10 * 60 * 1000,
    });
    return NextResponse.json(tokenRequest, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Could not authenticate with Ably. Check ABLY_API_KEY." }, { status: 503 });
  }
}
