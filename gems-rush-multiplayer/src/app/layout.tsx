import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ErrorBoundary from "@/components/ui/ErrorBoundary";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: 'swap',
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: "Gems Rush: Divine Teams - Match-3 Multiplayer Game",
    template: "%s | Gems Rush"
  },
  description: "Experience the ultimate match-3 battle game with divine gems, multiplayer action, and progressive divine realms. Play solo or compete with friends in real-time!",
  keywords: ["match-3", "puzzle game", "multiplayer", "divine gems", "battle", "strategy"],
  authors: [{ name: "Gems Rush Team" }],
  creator: "Gems Rush Team",
  publisher: "Gems Rush",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    title: 'Gems Rush: Divine Teams',
    description: 'The ultimate match-3 multiplayer game with divine gems and strategic battles',
    siteName: 'Gems Rush',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Gems Rush Game Preview',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Gems Rush: Divine Teams',
    description: 'The ultimate match-3 multiplayer game with divine gems and strategic battles',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <head>
        {/* Preconnect to external domains for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* Viewport meta tag for responsive design */}
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        
        {/* Manifest for PWA */}
        <link rel="manifest" href="/manifest.json" />
        
        {/* Theme color for mobile browsers */}
        <meta name="theme-color" content="#8B5CF6" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="mobile-web-app-capable" content="yes" />
        
        {/* Favicon */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body className="antialiased min-h-screen bg-ink text-fg">
        <ErrorBoundary>
          {/* Main game container */}
          <div id="game-root" className="relative min-h-screen">
            {children}
          </div>
          
          {/* Portal container for modals and overlays */}
          <div id="modal-root" />
          <div id="tooltip-root" />
          <div id="notification-root" />
        </ErrorBoundary>
        
        {/* Development tools */}
        {process.env.NODE_ENV === 'development' && (
          <div className="fixed bottom-4 right-4 z-50">
            <div className="bg-black/80 text-white text-xs px-2 py-1 rounded">
              DEV MODE
            </div>
          </div>
        )}
      </body>
    </html>
  );
}
