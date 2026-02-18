import "./globals.css";
import type { Metadata } from "next";
import AuthBootstrap from "./AuthBootstrap";

export const metadata: Metadata = {
  title: "Fanta Batizado",
  description: "Fanta Batizado",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="it">
      <body>
        {/* ✅ mantiene la sessione viva e la refresh-a quando riaprono l’app */}
        <AuthBootstrap />
        {children}
      </body>
    </html>
  );
}
