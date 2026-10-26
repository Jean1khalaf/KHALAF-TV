import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const OWNER = 'Jean1khalaf';
const REPOSITORY = 'KHALAF-TV';
const RELEASE_TAG = 'windows-installer';
const ASSET_NAME = 'KHALAF-TV-Setup.exe';

export async function GET() {
  try {
    const response = await fetch(
      `https://api.github.com/repos/${OWNER}/${REPOSITORY}/releases/tags/${RELEASE_TAG}`,
      {
        headers: {
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
          'User-Agent': 'KHALAF-TV-installer-download',
        },
        cache: 'no-store',
      },
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: 'The Windows installer has not been built yet. The automatic build may still be running or may have failed.' },
        { status: 503, headers: { 'Cache-Control': 'no-store' } },
      );
    }

    const release = await response.json();
    const asset = Array.isArray(release.assets)
      ? release.assets.find((item: { name?: string }) => item.name === ASSET_NAME)
      : undefined;

    if (!asset?.browser_download_url) {
      return NextResponse.json(
        { error: 'The Windows build release exists, but KHALAF-TV-Setup.exe is missing. Check the automatic build result.' },
        { status: 503, headers: { 'Cache-Control': 'no-store' } },
      );
    }

    const fileResponse = await fetch(asset.browser_download_url, {
      cache: 'no-store',
      redirect: 'follow',
    });
    if (!fileResponse.ok || !fileResponse.body) {
      return NextResponse.json(
        { error: 'The installer is published but could not be downloaded right now.' },
        { status: 502, headers: { 'Cache-Control': 'no-store' } },
      );
    }

    const headers = new Headers({
      'Content-Type': 'application/vnd.microsoft.portable-executable',
      'Content-Disposition': `attachment; filename="${ASSET_NAME}"`,
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'X-Content-Type-Options': 'nosniff',
    });
    const length = fileResponse.headers.get('content-length');
    if (length) headers.set('Content-Length', length);
    return new Response(fileResponse.body, { status: 200, headers });
  } catch {
    return NextResponse.json(
      { error: 'The installer download service is temporarily unavailable.' },
      { status: 502, headers: { 'Cache-Control': 'no-store' } },
    );
  }
}
