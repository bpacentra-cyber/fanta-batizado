import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Fanta Batizado",
  description: "App by Instrutor Frodo",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // ✅ IMPORTANTISSIMO: qui NON deve esserci nessun controllo sessione / redirect.
  // Le pagine che richiedono login si gestiscono DENTRO alle singole page.tsx (come già fai).
  return (
    <html lang="it">
      <body>{children}</body>
    </html>
  );
}
