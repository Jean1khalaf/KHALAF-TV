# Provider fallback and return navigation

- Removed the iframe attempt for curated external provider pages that may reject embedding.
- The Open provider page link opens in a separate browser tab (`target="_blank"` with `noopener noreferrer`).
- Added a Choose another channel button that exits the fullscreen player, clears the selected external channel, and scrolls to the channel directory.
- Added English, French, and Arabic copy for the fallback.
- This does not bypass provider security restrictions or guarantee stream playback. Direct playback still requires a valid, authorized media URL or official embeddable player.

## Verification

The ZIP is integrity-checked. A full Next.js build was not run in this environment because project dependencies are not installed here; run `npm install` then `npm run build` before deploying.
