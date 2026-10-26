# KHALAF TV

A responsive live-TV directory built with Next.js, TypeScript, HLS.js, and optional Neon PostgreSQL persistence. Designed for deployment through GitHub + Vercel.

## Latest player layout adjustment

The three special Lebanese source pages now use a compact channel header, a larger responsive iframe area, and a KHALAF TV overlay. This improves the surrounding layout; it cannot remove banners or black bars rendered inside the third-party page itself.

## Mobile Elahmad playback adjustment

The four Elahmad pages (MTV Lebanon, LBC Lebanon, Al Jadeed Lebanon, and Al Hadath) are embedded with `referrerPolicy="unsafe-url"` so the browser can send the referring page URL when requesting the provider page. The “Open source” link no longer uses `noreferrer`, which would suppress that header.

This can help if the provider rejects requests when the referrer is missing, but it is not a guarantee: the provider may require its own site as the referrer, block iframe embedding, use anti-hotlink checks on the underlying media URL, or require cookies. The parent website cannot set arbitrary headers for requests made by a third-party player. If it still fails on mobile, use the provider page directly or configure a provider-authorized direct stream/official embed URL. `unsafe-url` sends the full KHALAF TV page URL to the provider, so use it only where appropriate.

## What is included

- Responsive dark interface for desktop, tablets, and phones.
- Loads the public `iptv-org` M3U playlist through a server-side API route.
- Search, categories, channel selection, and favorites.
- HLS playback for compatible `.m3u8` streams, with the KHALAF TV watermark in the player.
- Dedicated MTV Lebanon, LBC Lebanon, Al Jadeed Lebanon, and Al Hadath entries.
- Optional Neon database endpoint for favorites; local browser storage works as a fallback.
- No database credentials are committed to source control.


## Install KHALAF TV on iPhone and Android (PWA)

This project includes Progressive Web App support so visitors can add KHALAF TV to their device home screen without first publishing native apps to the App Store or Google Play. The site must be deployed over HTTPS; Vercel deployments use HTTPS by default. Installation always requires the visitor to confirm it. A website cannot silently install itself.

### iPhone / iPad

1. Deploy the website and open its HTTPS URL in Safari.
2. Tap **Share**.
3. Choose **Add to Home Screen**.
4. Keep **Open as Web App** enabled if that option is shown, then tap **Add**.
5. Launch KHALAF TV from the new home-screen icon.

The **Install app** button inside KHALAF TV opens these instructions on iOS because Safari does not expose the Android-style `beforeinstallprompt` install event.

### Android

1. Open the HTTPS website in Chrome.
2. Tap **Install app** in KHALAF TV. If the browser exposes its install prompt, the button opens it directly.
3. Otherwise, open Chrome's three-dot menu and choose **Install app** or **Add to Home screen**, then confirm. Exact wording varies by browser and device.

### PWA files included

- `public/manifest.webmanifest` — app name, launch mode, colors, and icon declarations.
- `public/sw.js` — service worker that caches the app shell and static assets for a basic offline fallback. It deliberately does not cache `/api` responses or live media streams.
- `public/offline.html` — fallback page when the app shell cannot be reached offline.
- `public/icon-192.png`, `public/icon-512.png`, `public/icon-maskable-512.png`, `public/apple-touch-icon.png` — installation icons.
- `components/PWAInstallButton.tsx` — platform-aware install button and guided instructions.

### Test installation

1. Deploy to a real HTTPS Vercel URL (or use `localhost` for local development).
2. Open the URL on an actual phone.
3. On Android/Chrome, check the install button and browser menu. On iOS, use Safari's Share menu.
4. After deployment, if a prior service worker keeps old files cached, close and reopen the app or clear the site's browser storage before retesting.

A PWA does not make live streams available offline. Channel listings may require a connection, and third-party streaming providers can block embedded playback.

## Important streaming notes

The playlist is a directory of links, not a guarantee that every stream is online, authorized for every use, or playable in every browser. The iptv-org project describes its repository as a collection of publicly available channel links and notes that it does not host the video itself: https://github.com/iptv-org/iptv

The four Elahmad URLs provided are web pages, not confirmed direct video stream URLs. This starter tries to display each page inside the player area. It will only work if that site permits framing and the embedded player works in that context. Browser security rules such as `X-Frame-Options` and CSP `frame-ancestors` cannot be bypassed from a normal website. If framing is blocked, use a direct stream URL you are authorized to embed or an official provider embed URL. The external-source link is provided as a fallback. Do not attempt to bypass access controls or DRM.

A logo overlay is drawn over the native player for streams played through KHALAF TV. It cannot be guaranteed over a third-party page's own embedded player.

## Run locally

1. Install Node.js 20 or later.
2. Extract this ZIP.
3. In this folder, run:

   ```bash
   npm install
   cp .env.example .env.local
   npm run dev
   ```

4. Open http://localhost:3000

`DATABASE_URL` can remain unset for local testing. Favorites will use browser local storage. The channel API fetches the public playlist on the server and caches it briefly.

## Deploy with GitHub + Vercel

1. Create a new repository on GitHub named `khalaf-tv`.
2. Upload the extracted project files to the repository (not the ZIP itself).
3. Sign in to Vercel and choose **Add New → Project**.
4. Import your `khalaf-tv` GitHub repository. Vercel should detect Next.js automatically.
5. Keep the default build settings (`npm run build`).
6. Click **Deploy**. Vercel will create a URL such as `https://your-project.vercel.app`.
7. Each push to the configured production branch can trigger a new deployment.

Official guide: https://vercel.com/docs/deployments

## Connect Neon PostgreSQL (optional)

1. Create a project at https://neon.tech/.
2. In Neon, copy the pooled connection string for your database.
3. In Vercel, open your project → **Settings → Environment Variables**.
4. Add `DATABASE_URL` with the Neon connection string. Add it to Production and Preview as needed.
5. Optionally add `IPTV_PLAYLIST_URL` with the default playlist URL, or another playlist you have permission to use.
6. Redeploy after adding or changing environment variables.
7. You can run `db/schema.sql` in the Neon SQL Editor. The API also creates the favorites table on first request.

Never put the Neon connection string in a `NEXT_PUBLIC_` variable and never commit it to GitHub.

## Configure channels

- Default playlist: `https://iptv-org.github.io/iptv/index.m3u`
- Change it in Vercel by setting `IPTV_PLAYLIST_URL`.
- Special Lebanese channel entries are defined in `components/KhalafTV.tsx` in the `SPECIALS` array.
- For reliable in-page playback, set each special channel to a provider-authorized direct `.m3u8` URL or a documented official embed URL. A normal page URL is not necessarily a stream URL.

## Limitations and troubleshooting

- **A channel loads but does not play:** the stream may be offline, blocked by CORS, require a codec unsupported by the browser, or not be a direct media URL. Try an authorized HLS stream URL.
- **The Elahmad frame is blank:** the source may forbid embedding. This cannot be fixed by changing the parent site; use an authorized embeddable source.
- **Playlist request fails:** check whether the playlist is reachable and whether the provider is temporarily unavailable.
- **Favorites do not persist between devices:** verify `DATABASE_URL`, deploy again, and check the Neon table. Without a database, favorites are stored only in the current browser.
- **Watermark:** the KHALAF TV logo is an overlay on the built-in video player; it does not watermark the underlying stream file.

## Project structure

```text
app/
  api/channels/route.ts
  api/favorites/route.ts
  globals.css
  layout.tsx
  page.tsx
components/
  KhalafTV.tsx
db/
  schema.sql
.env.example
package.json
README.md
```

## Credits and rights

KHALAF TV is a channel-directory/player interface. It does not host or repackage video files. Only use streams you have permission to view, embed, and distribute, and respect the applicable terms of the source providers.

## Searchable featured channels

Al Hadath, MTV Lebanon, LBC Lebanon, and Al Jadeed Lebanon are included as featured entries in the main search results. Search for their names, then select the result to open it in the KHALAF TV player area. Configure optional direct stream URLs with `NEXT_PUBLIC_AL_HADATH_STREAM`, `NEXT_PUBLIC_MTV_LEBANON_STREAM`, `NEXT_PUBLIC_LBC_LEBANON_STREAM`, and `NEXT_PUBLIC_JADEED_LEBANON_STREAM`. These values are public in the browser; only use public playback URLs, never secrets. If a direct stream is not configured, the site falls back to the corresponding provider page in an iframe; playback depends on that provider allowing embedding. The interface includes responsive phone layouts and the mobile navigation menu.

## KHALAF TV — Smart TV update

This version builds on the existing Next.js/PWA project and adds:

- A larger-card, remote/keyboard-friendly channel directory.
- Three interface languages: English, French and Arabic (RTL for Arabic).
- A local **Recently watched** list (up to 30 channel names), alongside local favorites.
- Country filters and duplicate suppression for the four curated Elahmad entries.
- Mobile playback fallback: the provider page can still block embedding; use **Open source** to open the provider directly when required.
- Existing PWA manifest, service worker, Apple touch icon, install guidance and Vercel setup are retained.

### Validate before deploying

```bash
npm install
npm run build
```

Deploy the repository to Vercel over HTTPS. On iPhone, open the site in Safari and use **Share → Add to Home Screen**. On Android, open it in Chrome and choose **Install app** when available.

### Playback limitation

The four Elahmad URLs are third-party web pages, not guaranteed direct media streams. The `Referer` policy may help if the provider expects a referring URL, but cannot override provider-side blocking, authentication, cookies, or anti-embedding rules. When embedding is refused, open the source page or configure a stream/player that the broadcaster authorizes for embedding.

## Windows desktop app (.exe)

The project includes an Electron wrapper for Windows. It opens the deployed KHALAF TV website in a desktop window. Set `KHALAF_TV_URL` to your production HTTPS URL when building/testing; for example in PowerShell: `$env:KHALAF_TV_URL="https://your-domain.example"`. Then run `npm install`, `npm run desktop:dev` to test, or `npm run desktop:build` to create a Windows installer under `dist-desktop/`.

To enable the website's **Windows .exe** download link, copy the generated installer into `public/downloads/KHALAF-TV-Setup.exe` before deploying. The download link will not work until that real installer is built and placed there. Windows installers should be built on Windows (or a compatible CI runner).

## Smart TV display

Use the **TV display** button in the website header to enlarge channel cards and controls for viewing from a distance on a Smart TV. Open the site in the TV's built-in browser and select TV display mode. Playback still depends on the channel provider, browser codec support, and whether the stream permits embedding.

## Android TV / Google TV display mode

- Open the deployed site in the TV browser and add `?tv=1` to the URL to enable the larger TV layout by default.
- The **TV display** toggle also switches the layout on/off.
- Use a browser that supports the site's JavaScript and video formats. Playback of individual streams still depends on the source provider and Android TV browser codecs; some third-party pages block embedding.
- Remote arrow keys move focus between visible controls in TV mode. Press the remote's OK/Select button to activate a focused control.

## Windows desktop installer (.exe)

The Electron wrapper opens the deployed KHALAF TV website in a desktop window; it does not bundle or host the streams. A Windows installer must be built and uploaded before the website's Windows download link can work.

### Build through GitHub Actions (recommended)

1. Push this project to the GitHub repository used by your site.
2. In **Settings → Secrets and variables → Actions → Variables**, add `KHALAF_TV_URL` with the exact deployed HTTPS URL (for example, your actual Vercel domain).
3. Open **Actions → Build KHALAF TV for Windows → Run workflow**. The workflow creates a Windows NSIS installer and uploads it as the `KHALAF-TV-Windows-Installer` artifact.
4. Download the artifact and copy the resulting `.exe` into `public/downloads/KHALAF-TV-Setup.exe`. Commit and redeploy the website so the download link serves the installer.

The checked-in `desktop/config.json` intentionally contains a placeholder. Do not distribute an installer until the workflow has embedded your real HTTPS website URL. The build workflow runs on a Windows runner so it can produce a Windows installer without requiring Windows on your own computer.
