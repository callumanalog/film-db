import type { Metadata } from "next";
import { Suspense } from "react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import localFont from "next/font/local";
import { Work_Sans, Geist_Mono, Playfair_Display, Young_Serif } from "next/font/google";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { BottomNav } from "@/components/bottom-nav";
import { PlusActionSheet } from "@/components/plus-action-sheet";
import { UserActionsProvider } from "@/context/user-actions-context";
import { AuthProvider } from "@/context/auth-context";
import { ToastProvider } from "@/components/toast";
import { UrlToastHandler } from "@/components/url-toast-handler";
import { MobileHeaderTitleProvider } from "@/context/mobile-header-title-context";
import { FilmsSearchProvider } from "@/context/films-search-context";
import { NavSWRProvider } from "@/components/nav-swr-provider";
import "./globals.css";

const advercase = localFont({
  variable: "--font-advercase",
  src: [
    { path: "../../fonts/AdvercaseFont-Regular.ttf", weight: "400", style: "normal" },
    { path: "../../fonts/AdvercaseFont-Bold.ttf", weight: "700", style: "normal" },
  ],
});

const workSans = Work_Sans({
  variable: "--font-work-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const playfairDisplay = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const youngSerif = Young_Serif({
  variable: "--font-young-serif",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: {
    default: "FilmDB — Your Film Photography Database",
    template: "%s | FilmDB",
  },
  description:
    "The ultimate resource for analog film photography. Explore every film stock, learn shooting tips, discover where to buy, and view references.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${advercase.variable} ${workSans.variable} ${geistMono.variable} ${playfairDisplay.variable} ${youngSerif.variable}`}>
      <body className="antialiased" style={{ pointerEvents: 'auto' }}>
        <div className="flex min-h-screen flex-col" style={{ pointerEvents: 'auto' }}>
          <AuthProvider>
          <UserActionsProvider>
            <MobileHeaderTitleProvider>
            <FilmsSearchProvider>
            <NavSWRProvider>
            <ToastProvider>
              <Suspense fallback={null}>
                <UrlToastHandler />
              </Suspense>
              <Suspense fallback={<header className="sticky top-0 z-50 h-16 border-b border-border/50 bg-background/80 backdrop-blur-xl" />}>
                <Header />
              </Suspense>
              <main className="flex-1 pb-20 md:pb-0">{children}</main>
              <Footer />
              <BottomNav />
              <PlusActionSheet />
              <SpeedInsights />
            </ToastProvider>
            </NavSWRProvider>
            </FilmsSearchProvider>
            </MobileHeaderTitleProvider>
          </UserActionsProvider>
          </AuthProvider>
        </div>
      </body>
    </html>
  );
}
