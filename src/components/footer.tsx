import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-border/50 bg-background">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2 lg:col-span-1">
            <Link href="/" className="transition-opacity hover:opacity-80">
              <span className="text-lg font-bold tracking-tight">FilmDB</span>
            </Link>
            <p className="mt-3 max-w-xs text-sm text-muted-foreground">
              Your ultimate resource for analog film photography. Discover film stocks,
              learn shooting tips, and find where to buy.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Discover
            </h3>
            <ul className="mt-4 space-y-2">
              <li>
                <Link href="/films" className="text-sm text-foreground/70 transition-colors hover:text-primary">
                  All Film Stocks
                </Link>
              </li>
              <li>
                <Link href="/brands" className="text-sm text-foreground/70 transition-colors hover:text-primary">
                  Brands
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Film Types
            </h3>
            <ul className="mt-4 space-y-2">
              <li>
                <Link href="/films?type=color_negative" className="text-sm text-foreground/70 transition-colors hover:text-primary">
                  Color Negative
                </Link>
              </li>
              <li>
                <Link href="/films?type=color_reversal" className="text-sm text-foreground/70 transition-colors hover:text-primary">
                  Slide / Reversal
                </Link>
              </li>
              <li>
                <Link href="/films?type=bw_negative" className="text-sm text-foreground/70 transition-colors hover:text-primary">
                  Black & White
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Brands
            </h3>
            <ul className="mt-4 space-y-2">
              <li>
                <Link href="/brands/kodak" className="text-sm text-foreground/70 transition-colors hover:text-primary">
                  Kodak
                </Link>
              </li>
              <li>
                <Link href="/brands/fujifilm" className="text-sm text-foreground/70 transition-colors hover:text-primary">
                  Fujifilm
                </Link>
              </li>
              <li>
                <Link href="/brands/ilford" className="text-sm text-foreground/70 transition-colors hover:text-primary">
                  Ilford
                </Link>
              </li>
              <li>
                <Link href="/brands/cinestill" className="text-sm text-foreground/70 transition-colors hover:text-primary">
                  CineStill
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-border/50 pt-6">
          <p className="text-center text-xs text-muted-foreground">
            Built with love for analog photography. Film is not dead.
          </p>
        </div>
      </div>
    </footer>
  );
}
