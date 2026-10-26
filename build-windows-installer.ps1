$ErrorActionPreference = 'Stop'

# Build a Windows installer locally, without GitHub Actions.
# Set this to the public HTTPS URL where KHALAF TV is deployed.
if (-not $env:KHALAF_TV_URL) {
  $env:KHALAF_TV_URL = 'https://khalaf-tv.vercel.app/'
}
if ($env:KHALAF_TV_URL -notmatch '^https://') {
  throw 'KHALAF_TV_URL must be a public HTTPS URL.'
}

Write-Host "Building KHALAF TV desktop installer for $env:KHALAF_TV_URL"
npm install
npm run desktop:build

$installer = Get-ChildItem -Path '.\dist-desktop' -Filter '*.exe' -File | Select-Object -First 1
if (-not $installer) {
  throw 'No .exe installer was created in dist-desktop.'
}

$downloadDir = Join-Path (Get-Location) 'public\downloads'
New-Item -ItemType Directory -Force -Path $downloadDir | Out-Null
$destination = Join-Path $downloadDir 'KHALAF-TV-Setup.exe'
Copy-Item -LiteralPath $installer.FullName -Destination $destination -Force
Write-Host "Installer copied to: $destination"
Write-Host 'Next: deploy the updated website so /downloads/KHALAF-TV-Setup.exe is publicly hosted.'
