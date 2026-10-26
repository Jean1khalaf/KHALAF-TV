import { NextRequest, NextResponse } from "next/server";
import { pairingDb, randomSecret, validCode } from "@/lib/pairing";
export const runtime = "nodejs";
export async function POST(request: NextRequest) {
  let body: { code?: unknown };
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }
  if (!validCode(body.code)) return NextResponse.json({ error: "Enter the 8-digit code shown on the TV." }, { status: 400 });
  try {
    const sql = pairingDb();
    const found = await sql`SELECT session_id, channel_name FROM pairing_sessions WHERE code = ${body.code} AND status = 'waiting' AND expires_at > NOW() LIMIT 1`;
    if (!found.length) return NextResponse.json({ error: "Code expired or not found. Generate a new code on the TV." }, { status: 404 });
    const phoneSecret = randomSecret();
    await sql`UPDATE pairing_sessions SET phone_secret = ${phoneSecret}, status = 'paired', paired_at = NOW() WHERE session_id = ${found[0].session_id} AND status = 'waiting'`;
    return NextResponse.json({ sessionId: found[0].session_id, channel: found[0].channel_name, phoneSecret });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to pair this phone." }, { status: 503 });
  }
}
