# KHALAF TV – remote provider window (Web + Windows Electron)

## Web browser behaviour
A normal website cannot open a popup in response to a click that happened on another device. Chrome/Edge require a real user gesture on the TV browser. Therefore:
1. On the TV, while KHALAF TV is open, click **Enable remote channel tab** once.
2. Allow pop-ups for the KHALAF TV site if prompted.
3. That opens a named, app-owned blank provider tab/window.
4. Pair the phone. Selecting MTV, LBC, Al Jadeed or Al Hadath navigates that same tab.
5. **Close provider tab** from the phone closes the tab because the TV page originally opened it.
If the browser discards the popup or the user closes it manually, repeat step 1.

## Windows Electron behaviour
The Electron app exposes a narrow preload bridge. The phone's paired command can open a dedicated Electron provider window or close it. Switching one of the curated elahmad.ru channels closes the previous provider window before opening the next. The app validates HTTPS and the elahmad.ru hostname. The browser/web popup activation step is not needed in Electron.

## Security and limitations
- No attempt is made to bypass elahmad.ru frame-embedding restrictions.
- The browser version cannot force popup activation remotely; this is enforced by Chrome/Edge.
- The web version can navigate/close only the popup that the TV page itself opened and retained.
- Electron provider URLs are limited to HTTPS elahmad.ru / www.elahmad.ru.
- The provider website may show its own ads, redirects or media windows; this app controls only its own provider window.

## Build
1. Deploy the web project to Vercel (or your hosting provider).
2. Set `desktop/config.json` `siteUrl` to the deployed HTTPS KHALAF TV URL.
3. Install dependencies with `npm install`.
4. Build the web app with `npm run build`.
5. Build Windows installer with `npm run desktop:build`.
6. Install the generated installer from `dist-desktop`.

## Test checklist
- Web: click Enable remote channel tab on the TV once; select each of the four channels from phone; close from phone; select another channel.
- Electron: pair phone; select each channel; verify prior provider window closes; use Close provider tab; verify main KHALAF TV window remains.
