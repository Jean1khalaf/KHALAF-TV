import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "KHALAF TV — Live Television",
  description: "Browse live television streams with KHALAF TV.",
  applicationName: "KHALAF TV",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "KHALAF TV" },
};
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#080b12",
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}