import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";

const interSans = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Constitution Quest — Gamified NPTEL Learning Platform",
  description: "Master the Indian Constitution through gamified mock tests, practice questions, and XP-based progression. Exclusive learning platform for IES College of Engineering.",
  keywords: ["Indian Constitution", "NPTEL", "mock test", "gamified learning", "IES College", "Constitution Quest"],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: "#1a0b2e",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning style={{ colorScheme: "dark" }}>
      <body
        className={`${interSans.variable} antialiased`}
        style={{ backgroundColor: "#1a0b2e", color: "#ffffff", overflowX: "hidden" }}
      >
        {children}
        <Toaster />
        <SonnerToaster />
      </body>
    </html>
  );
}
