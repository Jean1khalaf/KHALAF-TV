# KHALAF TV

A responsive live-TV directory built with Next.js, TypeScript, HLS.js, and optional Neon PostgreSQL persistence. Designed for deployment through GitHub + Vercel.

## Latest player layout adjustment

The three special Lebanese source pages now use a compact channel header, a larger responsive iframe area, and a KHALAF TV overlay. This improves the surrounding layout; it cannot remove banners or black bars rendered inside the third-party page itself.

## What is included

- Responsive dark interface for desktop, tablets, and phones.
- Loads the public `iptv-org` M3U playlist through a server-side API route.
- Search, categories, channel selection, and favorites.
- HLS playback for compatible `.m3u8` streams, with the KHALAF TV watermark in the player.
- Dedicated MTV Lebanon, LBC Lebanon, Al Jadeed Lebanon, and Al Hadath entries.
- Optional Neon database endpoint for favorites; local browser storage works as a fallback.
- No database credentials are committed to source control.

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
