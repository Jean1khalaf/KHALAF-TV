import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

// Optional persistence endpoint. Configure DATABASE_URL and run db/schema.sql first.
export async function GET() {
  if (!process.env.DATABASE_URL) return NextResponse.json({ enabled: false, favorites: [] });
  try {
    const sql = neon(process.env.DATABASE_URL);
    await sql`CREATE TABLE IF NOT EXISTS favorites (
      id BIGSERIAL PRIMARY KEY,
      channel_name TEXT NOT NULL UNIQUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`;
    const rows = await sql`SELECT channel_name FROM favorites ORDER BY channel_name`;
    return NextResponse.json({ enabled: true, favorites: rows.map((r) => r.channel_name) });
  } catch {
    return NextResponse.json({ enabled: false, favorites: [], error: "Database is not configured correctly." }, { status: 503 });
  }
}

export async function POST(request: Request) {
  if (!process.env.DATABASE_URL) return NextResponse.json({ error: "Set DATABASE_URL to enable database favorites." }, { status: 503 });
  try {
    const body = await request.json();
    const name = typeof body.name === "string" ? body.name.trim().slice(0, 200) : "";
    const remove = body.remove === true;
    if (!name) return NextResponse.json({ error: "A channel name is required." }, { status: 400 });
    const sql = neon(process.env.DATABASE_URL);
    if (remove) await sql`DELETE FROM favorites WHERE channel_name = ${name}`;
    else await sql`INSERT INTO favorites (channel_name) VALUES (${name}) ON CONFLICT (channel_name) DO NOTHING`;
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Could not update favorites." }, { status: 500 });
  }
}