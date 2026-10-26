KHALAF TV direct Windows download

The website serves the Windows installer through:
  /api/download/windows

The installer is built automatically on pushes to main or master by:
  .github/workflows/windows-installer.yml

The first successful build creates a GitHub Release containing:
  KHALAF-TV-Setup.exe

After you upload these source files to the GitHub repository and commit them,
the build should start automatically. You do not need to click Run workflow.
The endpoint will only download the installer after the release asset exists.

The desktop app is an Electron wrapper that opens the hosted KHALAF TV website.
It does not bundle TV streams offline.
