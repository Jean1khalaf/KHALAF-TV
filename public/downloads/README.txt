KHALAF TV Windows installer

The website's Windows download button uses the latest GitHub Release:
https://github.com/KHALAF-TV/khalaf-tv/releases/latest/download/KHALAF-TV-Setup.exe

The included GitHub Actions workflow builds the Windows NSIS installer online. Push the project to the KHALAF-TV/khalaf-tv repository and push a version tag such as v1.0.0. The workflow creates a GitHub Release and attaches KHALAF-TV-Setup.exe. No local Windows computer is needed.

A manual/local build remains available through build-windows-installer.ps1. The online release URL will not work until the first tagged release has completed successfully.
