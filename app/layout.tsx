import "./globals.css";
import type { Metadata, Viewport } from "next";
import AuthBootstrap from "./AuthBootstrap";

export const metadata: Metadata = {
  title: "Fanta Batizado",
  description: "Fanta Batizado",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="it">
      <head>
        {/* iOS PWA */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Fanta Batizado" />

        {/* Android/Chrome */}
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body>
        <AuthBootstrap />
        {children}
      </body>
    </html>
  );
}
