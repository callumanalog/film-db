"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

export type AuthVariant = "sign-in" | "sign-up";

const AUTH_HERO = {
  "sign-in": {
    src: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=1200&q=80",
    alt: "Classic black and white film photography — Tri-X 400 mood",
  },
  "sign-up": {
    src: "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=1200&q=80",
    alt: "Warm nostalgic film — Kodak Gold 200",
  },
} as const;

interface AuthLayoutProps {
  variant: AuthVariant;
  children: React.ReactNode;
}

export function AuthLayout({ variant, children }: AuthLayoutProps) {
  const hero = AUTH_HERO[variant];

  return (
    <div className="grid min-h-[dvh] lg:min-h-screen lg:grid-cols-2">
      {/* Left: Hero image — hidden on mobile */}
      <div className="relative hidden overflow-hidden bg-muted lg:flex">
        <div className="absolute inset-0 animate-ken-burns">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={hero.src}
            alt={hero.alt}
            className="h-full w-full object-cover"
            fetchPriority="high"
          />
        </div>
        <div className="auth-grain" aria-hidden />
      </div>

      {/* Right: Form area — full width on mobile, overlapping card on desktop */}
      <div className="flex min-h-[dvh] flex-col items-center justify-center px-4 py-8 lg:justify-center lg:py-12">
        <div
          className={cn(
            "w-full max-w-[450px] rounded-card bg-card p-6 shadow-sm ring-1 ring-border",
            "lg:-ml-10 lg:px-8 lg:py-8"
          )}
        >
          <Link
            href="/"
            className="mb-8 font-sans text-xl font-bold tracking-tight text-foreground transition-opacity hover:opacity-80"
          >
            FilmDB
          </Link>
          {children}
        </div>
      </div>
    </div>
  );
}
