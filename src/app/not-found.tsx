import Link from "next/link";
import { Film, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-24 text-center">
      <Film className="mb-6 h-16 w-16 text-muted-foreground/30" />
      <h1 className="text-4xl font-bold tracking-tight">404</h1>
      <p className="mt-2 text-lg text-muted-foreground">
        This page doesn&apos;t exist — like an unexposed roll.
      </p>
      <Link
        href="/"
        className="mt-8 inline-flex items-center gap-2 rounded-card bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to home
      </Link>
    </div>
  );
}
