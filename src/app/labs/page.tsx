import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: "Labs",
  description: `Find film labs and development resources — ${SITE_NAME}.`,
};

const RESOURCES: { label: string; href: string; description: string }[] = [
  {
    label: "Ilford lab list",
    href: "https://www.ilfordphoto.com/find-a-lab",
    description: "Official Ilford directory of labs that process black & white and other films.",
  },
  {
    label: "Kodak processing",
    href: "https://www.kodak.com/en/motion/product-detail/film-processing/",
    description: "Kodak’s motion/still film processing references and partner information.",
  },
  {
    label: "CineStill Cs41 / lab resources",
    href: "https://cinestillfilm.com/",
    description: "Chemistry and resources from CineStill — useful if you home-develop or scout pro labs.",
  },
];

export default function LabsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <header className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Labs</h1>
        <p className="mt-2 text-muted-foreground">
          {SITE_NAME} doesn&apos;t run a lab directory yet — we&apos;re building a proper finder with maps and
          community notes. In the meantime, here are trusted places to start.
        </p>
      </header>

      <ul className="space-y-4">
        {RESOURCES.map((item) => (
          <li key={item.href}>
            <a
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex gap-3 rounded-card border border-border/60 bg-card/30 p-4 transition-colors hover:border-primary/40 hover:bg-card/60"
            >
              <ExternalLink
                className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground group-hover:text-primary"
                aria-hidden
              />
              <div className="min-w-0">
                <span className="font-semibold text-foreground group-hover:text-primary">{item.label}</span>
                <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
              </div>
            </a>
          </li>
        ))}
      </ul>

      <p className="mt-10 text-sm text-muted-foreground">
        Have a lab you love?{" "}
        <Link href="/community" className="font-medium text-primary underline-offset-2 hover:underline">
          Browse the community
        </Link>{" "}
        and share where you develop — a richer lab finder is on our roadmap.
      </p>
    </div>
  );
}
