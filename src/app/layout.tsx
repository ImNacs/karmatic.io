/**
 * @fileoverview Root layout component for the Karmatic application
 * @module app/layout
 */

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "./bigint-config";
import { ClerkProvider } from '@clerk/nextjs';
import { ThemeProvider } from "@/providers/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { GoogleMapsProvider } from "@/providers/google-maps-provider";
import { AuthSync } from "@/components/features/auth";
import { GTMScript, GTMNoScript } from "@/lib/gtm/gtm";
import { SearchHistoryProvider } from "@/contexts/SearchHistoryContext";
import { VerticalSidebar } from "@/components/features/sidebar";

/**
 * Geist Sans font configuration
 * @constant
 */
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

/**
 * Geist Mono font configuration
 * @constant
 */
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/**
 * Application metadata for SEO and social sharing
 * @constant
 */
export const metadata: Metadata = {
  title: "Karmatic - Análisis de Agencias Automotrices",
  description: "Explora, analiza y selecciona las mejores agencias automotrices cerca de ti",
  keywords: ["agencias automotrices", "análisis", "inventario", "carros", "automóviles"],
  authors: [{ name: "Karmatic" }],
  creator: "Karmatic",
  publisher: "Karmatic",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL("https://karmatic.io"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Karmatic - Análisis de Agencias Automotrices",
    description: "Explora, analiza y selecciona las mejores agencias automotrices cerca de ti",
    url: "https://karmatic.io",
    siteName: "Karmatic",
    locale: "es_ES",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "google-site-verification-key",
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
};

/**
 * Root layout component wrapping all pages
 * @component
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child pages/components
 * @returns {JSX.Element} Application layout with providers
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="es" suppressHydrationWarning>
        <head>
          <GTMScript />
        </head>
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
          suppressHydrationWarning
        >
          <GTMNoScript />
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <GoogleMapsProvider>
              <SearchHistoryProvider>
                <AuthSync />
                <div className="min-h-screen bg-background">
                  <VerticalSidebar userTokens={150} />
                  <main className="lg:ml-64">
                    {children}
                  </main>
                </div>
              </SearchHistoryProvider>
            </GoogleMapsProvider>
            <Toaster />
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
