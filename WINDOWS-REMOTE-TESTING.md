# KHALAF TV — Windows and phone remote test guide

## What this Windows package is

The Electron desktop app is a Windows wrapper around the deployed KHALAF TV HTTPS website. It does not host the Next.js server locally. The website must be deployed with its required environment variables before the Windows installer and phone remote can work together.

## Required production setup

1. Deploy the updated project to your HTTPS website.
2. Configure `ABLY_API_KEY` and `DATABASE_URL` in the deployment environment. Run `db/schema.sql` against the configured Postgres database.
3. Redeploy after changing environment variables.
4. On the Windows PC, open KHALAF TV and choose **Phone remote**.
5. On the phone, scan the QR code or open the same website's `/remote` page and enter the pairing code.

## Test sequence

1. Select a known working direct stream (`.m3u8`, `.mp4`, or `.webm`) on the phone. The TV player should start muted automatically; press Mute/Unmute to test audio.
2. Press Fullscreen. The player should switch to the app's fullscreen layout. Press Exit fullscreen to return.
3. Test Play/Pause and volume. If the stream has expired, is geo-blocked, or rejects cross-origin playback, try another direct stream.
4. Third-party provider pages rendered in an iframe cannot reliably be controlled by the phone remote. This is a provider/browser limitation, not a Windows installer issue.

## Build the Windows installer

On Windows with Node.js LTS installed, open PowerShell in the extracted project directory and run:

```powershell
$env:KHALAF_TV_URL = 'https://YOUR-DEPLOYED-KHALAF-TV-DOMAIN/'
./build-windows-installer.ps1
```

The installer will be created under `dist-desktop`. This project cannot produce a verified `.exe` until dependencies are installed and the Windows build succeeds.
