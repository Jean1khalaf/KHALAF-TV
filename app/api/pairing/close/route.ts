import { NextRequest, NextResponse } from "next/server";
import { pairingDb } from "@/lib/pairing";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  let body: { sessionId?: unknown; secret?: unknown; role?: unknown };
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }
  if (typeof body.sessionId !== "string" || typeof body.secret !== "string" || !["tv", "phone"].includes(String(body.role))) {
    return NextResponse.json({ error: "Invalid session credentials." }, { status: 400 });
  }
  try {
    const sql = pairingDb();
    const result = body.role === "tv"
      ? await sql`UPDATE pairing_sessions SET status = 'closed' WHERE session_id = ${body.sessionId} AND tv_secret = ${body.secret} AND status IN ('waiting','paired') RETURNING session_id`
      : await sql`UPDATE pairing_sessions SET status = 'closed' WHERE session_id = ${body.sessionId} AND phone_secret = ${body.secret} AND status = 'paired' RETURNING session_id`;
    if (!result.length) return NextResponse.json({ error: "Session already closed or credentials invalid." }, { status: 404 });
    return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Unable to close pairing session." }, { status: 503 });
  }
}
