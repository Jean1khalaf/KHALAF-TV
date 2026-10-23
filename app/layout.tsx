import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "KHALAF TV — Live Television",
  description: "Browse live television streams with KHALAF TV.",
  applicationName: "KHALAF TV",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "KHALAF TV" },
  manifest: "/manifest.webmanifest",
  icons: { icon: [{ url: "/icon-192.png", sizes: "192x192", type: "image/png" }, { url: "/icon-512.png", sizes: "512x512", type: "image/png" }], apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }] },
};
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#080b12",
  colorScheme: "dark",
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}<script dangerouslySetInnerHTML={{__html: "if (typeof window !== \"undefined\" && \"serviceWorker\" in navigator) { window.addEventListener(\"load\", function () { navigator.serviceWorker.register(\"/sw.js\").catch(function (error) { console.warn(\"KHALAF TV offline support unavailable\", error); }); }); }"}} /></body></html>;
}