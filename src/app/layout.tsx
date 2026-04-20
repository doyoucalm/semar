import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SEMAR — BaZi Self-Reflection",
  description: "Deep astrology for the modern soul.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:ital,wght@0,300..700;1,300..700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-screen pb-24 md:pb-0">
        {children}
      </body>
    </html>
  );
}
