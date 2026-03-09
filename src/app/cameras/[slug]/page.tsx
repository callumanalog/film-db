import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import {
  getCameraBySlug,
  getCameras,
  getRelatedCameras,
  getMoreCamerasFromBrand,
} from "@/lib/camera-queries";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CameraCard } from "@/components/camera-card";
import { CAMERA_TYPE_LABELS } from "@/lib/types";
import { Camera, ArrowLeft, Aperture, Calendar, Layers, List } from "lucide-react";

interface CameraDetailPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: CameraDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const camera = await getCameraBySlug(slug);
  if (!camera) return { title: "Camera Not Found" };
  return {
    title: `${camera.brand.name} ${camera.name}`,
    description: camera.description || `Learn about the ${camera.brand.name} ${camera.name} film camera.`,
  };
}

export async function generateStaticParams() {
  const cameras = await getCameras();
  return cameras.map((c) => ({ slug: c.slug }));
}

export default async function CameraDetailPage({ params }: CameraDetailPageProps) {
  const { slug } = await params;
  const camera = await getCameraBySlug(slug);

  if (!camera) notFound();

  const relatedCameras = await getRelatedCameras(camera, 6);
  const moreFromBrand = await getMoreCamerasFromBrand(camera, 6);

  const specs = [
    { icon: Layers, label: "Format", value: camera.format.join(", ") },
    { icon: Aperture, label: "Type", value: CAMERA_TYPE_LABELS[camera.type] },
    ...(camera.lens_mount ? [{ icon: Aperture, label: "Lens mount", value: camera.lens_mount }] : []),
    ...(camera.year_introduced
      ? [
          {
            icon: Calendar,
            label: "Years",
            value: camera.year_discontinued
              ? `${camera.year_introduced} – ${camera.year_discontinued}`
              : `${camera.year_introduced} – present`,
          },
        ]
      : []),
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <Link
        href="/cameras"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to all cameras
      </Link>

      <div className="mb-10 flex flex-col gap-6 sm:flex-row sm:items-start sm:gap-8">
        <div className="flex h-36 w-36 shrink-0 items-center justify-center rounded-2xl border border-border/50 bg-muted/30">
          <Camera className="h-14 w-14 text-muted-foreground/40" />
        </div>
        <div className="min-w-0 flex-1">
          <Link
            href={`/cameras?brand=${camera.brand.slug}`}
            className="text-sm font-medium text-primary transition-colors hover:text-primary/80"
          >
            {camera.brand.name}
          </Link>
          <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl font-advercase">
            {camera.name}
          </h1>
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge variant="outline">{CAMERA_TYPE_LABELS[camera.type]}</Badge>
            {camera.format.map((f) => (
              <Badge key={f} variant="outline">
                {f}
              </Badge>
            ))}
            {camera.year_introduced && (
              <Badge variant="secondary">
                {camera.year_introduced}
                {camera.year_discontinued ? `–${camera.year_discontinued}` : ""}
              </Badge>
            )}
          </div>
          {camera.description && (
            <p className="mt-4 max-w-2xl leading-relaxed text-muted-foreground">
              {camera.description}
            </p>
          )}
        </div>
      </div>

      <Separator className="mb-10" />

      {specs.length > 0 && (
        <section className="mb-10">
          <div className="mb-4 flex items-center gap-2">
            <Aperture className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-bold tracking-tight">Specifications</h2>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {specs.map((spec) => {
              const Icon = spec.icon;
              return (
                <div
                  key={spec.label}
                  className="rounded-xl border border-border/50 bg-card p-4"
                >
                  <div className="mb-1 flex items-center gap-2">
                    <Icon className="h-4 w-4 text-primary" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {spec.label}
                    </span>
                  </div>
                  <p className="text-sm font-medium">{spec.value}</p>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {camera.features.length > 0 && (
        <section className="mb-10">
          <div className="mb-4 flex items-center gap-2">
            <List className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-bold tracking-tight">Features</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {camera.features.map((f) => (
              <Badge key={f} variant="secondary">
                {f}
              </Badge>
            ))}
          </div>
        </section>
      )}

      {relatedCameras.length > 0 && (
        <section className="mb-10">
          <h2 className="mb-6 text-xl font-bold tracking-tight">
            Similar Cameras
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-6">
            {relatedCameras.map((c) => (
              <CameraCard key={c.id} camera={c} />
            ))}
          </div>
        </section>
      )}

      {moreFromBrand.length > 0 && (
        <section className="mb-10">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-bold tracking-tight">
              More from {camera.brand.name}
            </h2>
            <Link
              href={`/cameras?brand=${camera.brand.slug}`}
              className="text-sm font-medium text-primary transition-colors hover:text-primary/80"
            >
              View all {camera.brand.name} cameras
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-6">
            {moreFromBrand.map((c) => (
              <CameraCard key={c.id} camera={c} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
