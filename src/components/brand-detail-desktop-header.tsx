import Image from "next/image";
import { parseCountry, parseFoundedYear } from "@/lib/brand-meta";
import { cn } from "@/lib/utils";

export function BrandDetailDesktopLogoColumn({
  name,
  logoUrl,
}: {
  name: string;
  logoUrl: string | null;
}) {
  return (
    <div className="w-full min-w-0 flex flex-col md:w-56 md:min-w-[14rem] md:shrink-0 md:self-start md:overflow-visible">
      <div className="relative mx-auto hidden w-full min-w-0 max-w-sm overflow-hidden rounded-[7px] border border-border/50 bg-card md:mx-0 md:block md:max-w-none md:w-full">
        <div className="flex items-center justify-center px-6 py-8">
          <div className="relative h-24 w-24 shrink-0">
            {logoUrl ? (
              <Image src={logoUrl} alt={`${name} logo`} fill className="object-contain" sizes="96px" priority />
            ) : (
              <span
                className="flex h-full w-full items-center justify-center text-4xl font-bold text-foreground"
                aria-hidden
              >
                {name.charAt(0)}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function BrandDetailDesktopTitleBlock({
  name,
  foundedYear,
  country,
}: {
  name: string;
  foundedYear?: number | string | null;
  country?: string | null;
}) {
  const founded = parseFoundedYear(foundedYear);
  const countryStr = parseCountry(country);
  const metaParts: string[] = [];
  if (founded != null) metaParts.push(`Founded ${founded}`);
  if (countryStr) metaParts.push(countryStr);
  const metaLine = metaParts.join(" · ");

  return (
    <div
      className="@container mb-0 flex min-w-0 flex-wrap flex-col gap-x-8 gap-y-5 md:flex-row items-center md:items-start @[28rem]:items-center pt-6"
      data-header-content
    >
      <div className="min-w-0 w-fit flex flex-col items-center md:items-start gap-2">
        <h1 className="w-fit font-sans text-3xl font-bold tracking-tight sm:text-4xl md:text-left text-center">
          {name}
        </h1>
        {metaLine ? (
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{metaLine}</p>
        ) : null}
      </div>
    </div>
  );
}
