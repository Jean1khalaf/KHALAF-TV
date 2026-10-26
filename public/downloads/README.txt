KHALAF TV direct Windows download

The website download button points to:
  /downloads/KHALAF-TV-Setup.exe

A real Windows installer must exist at this path for the download to work. The original source ZIP did not contain an EXE, so this ZIP cannot include a genuine installer until one is built.

Build locally on a Windows PC (no GitHub Actions required):
  1. Open PowerShell in the project root.
  2. Set the deployed website URL if it differs from the default:
       $env:KHALAF_TV_URL="https://khalaf-tv.vercel.app/"
  3. Run:
       .\build-windows-installer.ps1
  4. This creates/copies public\downloads\KHALAF-TV-Setup.exe.
  5. Deploy the updated project to your website host (for example Vercel).

The live URL will then be:
  https://YOUR-DOMAIN/downloads/KHALAF-TV-Setup.exe

The desktop app opens the configured deployed website in an Electron window. The EXE must be built on Windows (or a compatible Windows build environment). Do not rename a non-installer file to .exe.
