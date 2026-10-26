import { NextResponse } from "next/server";
import { pairingDb, randomSecret } from "@/lib/pairing";

export const runtime = "nodejs";
export async function POST() {
  if (!process.env.ABLY_API_KEY) return NextResponse.json({ error: "ABLY_API_KEY is not configured on the server." }, { status: 503 });
  try {
    const sql = pairingDb();
    const code = String(crypto.getRandomValues(new Uint32Array(1))[0] % 100_000_000).padStart(8, "0");
    const sessionId = randomSecret(16);
    const tvSecret = randomSecret();
    const channel = `khalaf-pair-${sessionId}`;
    await sql`DELETE FROM pairing_sessions WHERE expires_at < NOW() OR status = 'closed'`;
    await sql`INSERT INTO pairing_sessions (session_id, code, tv_secret, channel_name, status, expires_at) VALUES (${sessionId}, ${code}, ${tvSecret}, ${channel}, 'waiting', NOW() + INTERVAL '10 minutes')`;
    return NextResponse.json({ sessionId, code, tvSecret, channel, expiresIn: 600 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to create pairing session." }, { status: 503 });
  }
}
