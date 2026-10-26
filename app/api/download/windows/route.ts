import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const OWNER = 'Jean1khalaf';
const REPOSITORY = 'KHALAF-TV';
const ASSET_NAME = 'KHALAF-TV-Setup.exe';
const API_HEADERS = {
  Accept: 'application/vnd.github+json',
  'X-GitHub-Api-Version': '2022-11-28',
  'User-Agent': 'KHALAF-TV-website-installer-proxy',
};

/**
 * Downloads the installer through the website's own URL. The Windows build
 * workflow must successfully publish KHALAF-TV-Setup.exe to a GitHub Release.
 */
export async function GET() {
  try {
    // Prefer latest, then check recent releases in case another release is marked latest.
    const latestResponse = await fetch(
      `https://api.github.com/repos/${OWNER}/${REPOSITORY}/releases/latest`,
      { headers: API_HEADERS, cache: 'no-store' },
    );

    let assetUrl: string | undefined;
    if (latestResponse.ok) {
      const latest = await latestResponse.json();
      assetUrl = Array.isArray(latest.assets)
        ? latest.assets.find((item: { name?: string }) => item.name === ASSET_NAME)?.browser_download_url
        : undefined;
    }

    if (!assetUrl) {
      const releasesResponse = await fetch(
        `https://api.github.com/repos/${OWNER}/${REPOSITORY}/releases?per_page=10`,
        { headers: API_HEADERS, cache: 'no-store' },
      );
      if (releasesResponse.ok) {
        const releases = await releasesResponse.json();
        if (Array.isArray(releases)) {
          for (const release of releases) {
            const asset = Array.isArray(release.assets)
              ? release.assets.find((item: { name?: string }) => item.name === ASSET_NAME)
              : undefined;
            if (asset?.browser_download_url) {
              assetUrl = asset.browser_download_url;
              break;
            }
          }
        }
      }
    }

    if (!assetUrl) {
      return NextResponse.json(
        { error: 'The Windows installer has not been published yet. The automatic build must finish successfully first.' },
        { status: 503, headers: { 'Cache-Control': 'no-store' } },
      );
    }

    const fileResponse = await fetch(assetUrl, { cache: 'no-store', redirect: 'follow' });
    if (!fileResponse.ok || !fileResponse.body) {
      return NextResponse.json(
        { error: 'The Windows installer could not be downloaded right now. Please try again later.' },
        { status: 502, headers: { 'Cache-Control': 'no-store' } },
      );
    }

    const headers = new Headers({
      'Content-Type': 'application/vnd.microsoft.portable-executable',
      'Content-Disposition': `attachment; filename="${ASSET_NAME}"`,
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'X-Content-Type-Options': 'nosniff',
    });
    const contentLength = fileResponse.headers.get('content-length');
    if (contentLength) headers.set('Content-Length', contentLength);

    return new Response(fileResponse.body, { status: 200, headers });
  } catch {
    return NextResponse.json(
      { error: 'The Windows installer service is temporarily unavailable. Please try again later.' },
      { status: 502, headers: { 'Cache-Control': 'no-store' } },
    );
  }
}
