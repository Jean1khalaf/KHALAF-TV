# Managed external provider window (Windows Electron)

## Behaviour
- In the Windows Electron app, selecting one of the four curated elahmad.ru channels from the paired phone opens it in a dedicated Electron window.
- Selecting another curated channel closes the previous provider window before opening the next one.
- Selecting a regular/direct stream closes the provider window.
- The phone remote has a **Close external channel** action that closes the managed provider window.
- Closing the main KHALAF TV window also closes the provider window.
- The ordinary browser/web version is unchanged: browser security does not permit a website to close arbitrary tabs or windows that it did not open.

## Security
- The Electron preload exposes only `openProvider` and `closeProvider` through context isolation.
- The main process accepts provider navigation only over HTTPS to `elahmad.ru` / `www.elahmad.ru`.
- The website origin configured in `desktop/config.json` is checked for IPC requests.

## Test
1. Build and install the Windows Electron app using the existing Windows installer workflow.
2. Open KHALAF TV, pair the phone from **Phone remote**, and connect `/remote`.
3. Select MTV Lebanon on the phone: a managed provider window should open on the HDMI television.
4. Select LBC Lebanon: the MTV window should close and the LBC provider page should open.
5. Press **Close external channel**: the provider window should close and reveal KHALAF TV.
6. Repeat with Al Jadeed and Al Hadath.
7. In the regular web version, verify that channel selection still updates KHALAF TV; the web app cannot close unrelated browser tabs.

Note: provider pages may open their own in-page dialogs, ads, or media popups. KHALAF TV can close its managed provider window, but cannot control or remove content inside the third-party page.
