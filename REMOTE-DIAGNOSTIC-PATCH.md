# KHALAF TV remote diagnostic patch

## What changed

- The TV explicitly attaches its Ably channel before it is considered ready to receive remote commands.
- The TV subscribes to the `remote` event, which is the event used for phone handshake and command messages.
- The phone explicitly attaches its channel before publishing the handshake and before each command.
- Error messages now distinguish an attached-channel/publish problem from an ordinary connected state.

## Apply and test

1. Back up the existing GitHub repository/branch.
2. Copy the updated files `components/TVPairingPanel.tsx` and `app/remote/remote-client.tsx` into the same paths in the repository.
3. Keep the existing `ABLY_API_KEY` and `DATABASE_URL` environment variables configured in Vercel; do not share their values.
4. Run `npm install` and `npm run build` locally, or push to a test branch and check the Vercel Preview deployment.
5. Open the Preview URL on the TV and phone, create a fresh pairing code, pair again, and tap a channel.
6. On the phone, status should change from `command sent, waiting for TV` to `TV received command` when the TV acknowledges it. If it stays waiting, inspect the TV pairing dialog status and Vercel function logs; this points to subscription/handler/deployment configuration rather than a Windows reinstall issue.
7. Test mute and fullscreen only after channel selection is acknowledged. Third-party iframe pages may not permit external control.

## Verification status

The archive structure was checked. A production build and live-device test have not been run in this environment, so this is a targeted diagnostic patch, not a claim of fully verified end-to-end operation.
