import { NextResponse } from "next/server";

export const revalidate = 900;
const DEFAULT_PLAYLIST = "https://iptv-org.github.io/iptv/index.m3u";

export async function GET() {
  const url = process.env.IPTV_PLAYLIST_URL || DEFAULT_PLAYLIST;
  try {
    const response = await fetch(url, { next: { revalidate: 900 } });
    if (!response.ok) throw new Error(`Playlist returned ${response.status}`);
    const text = await response.text();
    const lines = text.split(/\r?\n/);
    const channels: { name: string; url: string; logo?: string; group?: string; country?: string }[] = [];
    let current: { name: string; logo?: string; group?: string; country?: string } | null = null;

    for (const raw of lines) {
      const line = raw.trim();
      if (line.startsWith("#EXTINF:")) {
        const name = line.includes(",") ? line.slice(line.lastIndexOf(",") + 1).trim() : "Unknown channel";
        const attr = (key: string) => {
          const match = line.match(new RegExp(`${key}="([^"]*)"`));
          return match?.[1];
        };
        current = {
          name: name || "Unknown channel",
          logo: attr("tvg-logo"),
          group: attr("group-title") || "Other",
          country: attr("tvg-country"),
        };
      } else if (line && !line.startsWith("#") && current) {
        if (/^https?:\/\//i.test(line)) {
          channels.push({ ...current, url: line });
        }
        current = null;
      }
    }
    return NextResponse.json({ channels, count: channels.length, updatedAt: new Date().toISOString() }, {
      headers: { "Cache-Control": "public, s-maxage=900, stale-while-revalidate=3600" },
    });
  } catch {
    return NextResponse.json({ error: "Could not load the public playlist. Please try again later.", channels: [] }, { status: 502 });
  }
}