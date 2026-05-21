import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import type { ReactNode } from "react";

import { AnimatedBackground } from "@/components/dashboard/animated-background";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap"
});

const jetBrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap"
});

export const metadata: Metadata = {
  title: {
    default: "Hydration Intake",
    template: "%s | Hydration Intake"
  },
  description:
    "A cinematic personal hydration tracker for one athlete targeting at least 11 glasses of water daily.",
  applicationName: "Hydration Intake",
  keywords: ["hydration", "athlete", "water tracker", "fitness"],
  authors: [{ name: "Personal Athlete" }],
  creator: "Personal Athlete",
  openGraph: {
    title: "Hydration Intake",
    description: "Track 11 daily glasses with a premium personal hydration dashboard.",
    type: "website"
  }
};

export const viewport: Viewport = {
  themeColor: "#020617",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1
};

export default function RootLayout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${inter.variable} ${jetBrainsMono.variable} antialiased`}>
        <AnimatedBackground />
        {children}
      </body>
    </html>
  );
}
