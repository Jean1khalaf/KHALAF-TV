# KHALAF TV remote-control fix v4

- Desktop provider windows are reused across channel changes rather than closed and recreated.
- Opening a provider restores/focuses a minimized window but does not force full-screen.
- Close provider hides the existing provider window after navigating it to a blank page, allowing a later remote command to reuse it without another enable click.
- Browser-only mode still requires the initial user gesture because browsers restrict remotely initiated popups. The desktop application is the reliable way to avoid repeated enabling.
