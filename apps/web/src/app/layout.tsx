import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Worqly",
  description: "Realtime collaborative workspace starter for Phase 1."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}