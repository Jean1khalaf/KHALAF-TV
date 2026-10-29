# KHALAF TV Remote Control 2.0

## What's new

- Premium dark paired-device interface with Remote, Channels, Favorites and Tools tabs.
- Directional navigation and text input commands (`key`, `text`). Text is accepted only when an input or textarea is focused on the TV page.
- Playback, volume, mute, fullscreen and seek controls for the native HTML video player.
- Previous/next channel shortcuts, channel search, favorites and recently watched history (stored locally on the phone).
- Command acknowledgements include an action result; the remote distinguishes successful commands from unsupported controls and acknowledgement timeouts.
- TV status updates include player state where a native video element is active.
- New `POST /api/pairing/close` endpoint allows either paired side to close the session using its role-specific secret. TV and phone UI close actions call it.
- Sleep timer pauses playback by sending a remote command when the selected delay expires.

## Configuration

The feature uses the existing `DATABASE_URL` (Neon) and `ABLY_API_KEY` environment variables. Run the existing `db/schema.sql` once; the new route uses the existing `pairing_sessions` table and its `closed` status, so no schema migration is required.

## Manual test plan

1. Configure `DATABASE_URL` and `ABLY_API_KEY`; start the app with `npm run dev`.
2. Open KHALAF TV on the TV/browser, select **Phone remote**, then open `/remote` on a phone and pair using the code or QR.
3. Confirm both sides show a connected/ready state. Wait for the phone's connection state to recover after briefly disabling and restoring the phone network.
4. Select a native direct stream and verify play/pause, volume, mute, fullscreen and seek. Check that the phone state follows TV status updates.
5. Test a third-party embedded channel; confirm unsupported native-player controls return an explanatory acknowledgement rather than appearing successful.
6. Search for a channel, add/remove favorites, select channels and verify recent history and favorites survive a page reload on the phone.
7. Focus a text field on the TV page and test text input. With no field focused, verify the TV returns the expected text-input warning.
8. Set a one-minute sleep timer and confirm playback pauses at expiry while the remote remains connected.
9. Close the session from the phone and from the TV. Confirm further token refreshes are rejected because the DB session is marked `closed`; an already-issued Ably token may remain valid until its short TTL expires, but the TV subscription is closed when the pairing panel unmounts.
10. Try invalid/expired pairing codes and invalid remote keys; these should be rejected.

## Limitations

- The browser cannot reliably inject keyboard input into cross-origin iframes, nor can it control their internal volume/playback state. These controls are reliable only for the KHALAF TV native player or fields in the same document.
- The sleep timer is local to the phone session and requires the phone to remain online to deliver the pause command.
- Favorites/history are per-browser local storage, not synchronized to the account or across phones.
- The existing Ably token grants publish/subscribe on the session channel. Closing the database session blocks future token requests but does not revoke an already-issued token immediately; keep the short token TTL and do not expose pairing secrets.
