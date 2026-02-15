import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://juliette.app"),
  icons: {
    icon: "/logo.png",
  },
  title: {
    default: "Juliette | AI Educational Video Assistant",
    template: "%s | Juliette",
  },
  description:
    "Juliette helps students learn from educational videos with AI-powered explanations, personalized practice problems, and animated visualizations. Upload videos, ask questions, get instant answers.",
  keywords: ["education", "AI", "video learning", "practice problems", "animations", "student", "teacher"],
  authors: [{ name: "Juliette" }],
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "Juliette",
  },
  twitter: {
    card: "summary_large_image",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${GeistSans.className} antialiased`}>
        {children}
      </body>
    </html>
  );
}
