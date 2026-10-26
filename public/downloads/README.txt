Windows installer publishing

The website download button uses /api/download/windows and streams the latest published KHALAF-TV-Setup.exe through the website domain.

The GitHub Actions workflow at .github/workflows/windows-installer.yml runs automatically on pushes to main or master. It builds the Windows installer and attaches it to a GitHub Release.

Important: the build must complete successfully once before the download works. The Electron Builder artifactName is explicitly set to KHALAF-TV-Setup.exe so the generated filename matches the release workflow and website API.
