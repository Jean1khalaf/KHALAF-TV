KHALAF TV direct Windows download

The website button now targets the same website domain:
  /downloads/KHALAF-TV-Setup.exe

IMPORTANT: the actual Windows installer binary is not included in this source ZIP. The button will only download once a real installer named KHALAF-TV-Setup.exe has been built and copied into this project's public/downloads/ folder. Then redeploy the project to Vercel. After deployment, the download URL will be:
  https://khalaf-tv.vercel.app/downloads/KHALAF-TV-Setup.exe

The installer is an Electron NSIS installer configured by package.json. Build it on Windows with:
  npm install
  npm run desktop:build

Then copy dist-desktop/KHALAF-TV Setup 1.0.0.exe (or the generated .exe filename) to public/downloads/KHALAF-TV-Setup.exe before deploying. Confirm the exact generated filename in dist-desktop first.
