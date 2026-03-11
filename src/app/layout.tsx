import type { Metadata } from "next";
import localFont from "next/font/local";
import { Work_Sans, Geist_Mono } from "next/font/google";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { UserActionsProvider } from "@/context/user-actions-context";
import { AuthProvider } from "@/context/auth-context";
import { ToastProvider } from "@/components/toast";
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
    <html lang="en" className={`${advercase.variable} ${workSans.variable} ${geistMono.variable}`}>
      <body className="antialiased" style={{ pointerEvents: 'auto' }}>
        <div className="flex min-h-screen flex-col" style={{ pointerEvents: 'auto' }}>
          <AuthProvider>
          <UserActionsProvider>
            <ToastProvider>
              <Header />
              <main className="flex-1">{children}</main>
              <Footer />
            </ToastProvider>
          </UserActionsProvider>
          </AuthProvider>
        </div>
      </body>
    </html>
  );
}
