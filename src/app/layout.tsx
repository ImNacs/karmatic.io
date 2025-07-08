import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { GoogleMapsProvider } from "@/components/google-maps-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <GoogleMapsProvider>
            {children}
          </GoogleMapsProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
