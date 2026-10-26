import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const OWNER = 'Jean1khalaf';
const REPOSITORY = 'KHALAF-TV';
const ASSET_NAME = 'KHALAF-TV-Setup.exe';

export async function GET() {
  try {
    const releaseResponse = await fetch(
      `https://api.github.com/repos/${OWNER}/${REPOSITORY}/releases/latest`,
      {
        headers: {
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
          'User-Agent': 'KHALAF-TV-website-installer-proxy',
        },
        cache: 'no-store',
      },
    );

    if (!releaseResponse.ok) {
      return NextResponse.json(
        { error: 'The Windows installer is not published yet. The automatic Windows build must finish successfully first.' },
        { status: 503, headers: { 'Cache-Control': 'no-store' } },
      );
    }

    const release = await releaseResponse.json();
    const asset = Array.isArray(release.assets)
      ? release.assets.find((item: { name?: string }) => item.name === ASSET_NAME)
      : undefined;

    if (!asset?.browser_download_url) {
      return NextResponse.json(
        { error: 'The latest release does not contain KHALAF-TV-Setup.exe yet.' },
        { status: 503, headers: { 'Cache-Control': 'no-store' } },
      );
    }

    const fileResponse = await fetch(asset.browser_download_url, {
      cache: 'no-store',
      redirect: 'follow',
    });

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
