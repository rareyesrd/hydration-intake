import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import type { ReactNode } from "react";

import { AnimatedBackground } from "@/components/dashboard/animated-background";
import { SerwistProvider } from "@/components/pwa/serwist-provider";
import { Providers } from "@/app/providers";
import {
  PWA_APP_NAME,
  PWA_DESCRIPTION,
  PWA_SHORT_NAME,
  PWA_THEME_COLOR
} from "@/lib/pwa/constants";
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
    default: PWA_APP_NAME,
    template: `%s | ${PWA_SHORT_NAME}`
  },
  description: PWA_DESCRIPTION,
  applicationName: PWA_APP_NAME,
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: PWA_SHORT_NAME
  },
  formatDetection: {
    telephone: false
  },
  keywords: ["hydration", "athlete", "water tracker", "fitness", "pwa"],
  authors: [{ name: "Hydration Coach" }],
  creator: "Hydration Coach",
  icons: {
    icon: [
      { url: "/icons/favicon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/icons/favicon-32.png", sizes: "32x32", type: "image/png" }
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }]
  },
  openGraph: {
    title: PWA_APP_NAME,
    description: PWA_DESCRIPTION,
    type: "website"
  }
};

export const viewport: Viewport = {
  themeColor: PWA_THEME_COLOR,
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover"
};

export default function RootLayout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
      </head>
      <body
        className={`${inter.variable} ${jetBrainsMono.variable} app-shell antialiased`}
      >
        <SerwistProvider swUrl="/sw.js">
          <Providers>
            <AnimatedBackground />
            {children}
          </Providers>
        </SerwistProvider>
      </body>
    </html>
  );
}
