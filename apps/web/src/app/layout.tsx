import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "zuga.ee",
  description: "AI-powered portfolio and content management",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="et">
      <body>{children}</body>
    </html>
  );
}
