import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Labs",
  description: "Find film labs near you.",
};

export default function LabsPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <header className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Labs</h1>
        <p className="mt-2 text-muted-foreground">Coming soon.</p>
      </header>
    </div>
  );
}
