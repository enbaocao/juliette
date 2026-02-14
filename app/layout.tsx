import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Juliette - AI Educational Video Assistant",
  description: "AI agent that answers student questions with animations, practice problems, and explanations",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
