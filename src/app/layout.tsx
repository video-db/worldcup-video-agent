import type { Metadata } from "next";
import Header from "@/components/Header";
import "./globals.css";

export const metadata: Metadata = {
  title: "World Cup Briefing — TinyFish × VideoDB",
  description: "Create football moment reels with TinyFish discovery and VideoDB video indexing.",
  icons: { icon: "/brand/icon-football.png?v=2" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-[#0A0A0A] text-white">
        <Header />
        {children}
      </body>
    </html>
  );
}
