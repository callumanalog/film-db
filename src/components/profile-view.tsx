"use client";

import Link from "next/link";
import Image from "next/image";
import {
  CheckCircle2,
  Heart,
  ListTodo,
  Star,
  StarHalf,
  MessageSquare,
  ImageIcon,
  Camera,
} from "lucide-react";
import { FilmCard } from "@/components/film-card";
import { FilmDetailTabs } from "@/components/film-page-tabs";
import type { FilmStock, FilmBrand } from "@/lib/types";
import type { ProfileMock, ProfileReview, ProfileUpload } from "@/lib/profile-mock-data";

type StockWithBrand = FilmStock & { brand: FilmBrand };

function MiniStars({ rating, size = 14 }: { rating: number; size?: number }) {
  const full = Math.floor(rating);
  const hasHalf = rating - full >= 0.25 && rating - full < 0.75;
  const adjusted = rating - full >= 0.75 ? full + 1 : full;
  const empty = 5 - adjusted - (hasHalf ? 1 : 0);
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: adjusted }).map((_, i) => (
        <Star key={`f-${i}`} className="text-amber-400 fill-amber-400" style={{ width: size, height: size }} />
      ))}
      {hasHalf && (
        <div className="relative" style={{ width: size, height: size }}>
          <Star className="absolute text-amber-400/30" style={{ width: size, height: size }} />
          <StarHalf className="absolute text-amber-400 fill-amber-400" style={{ width: size, height: size }} />
        </div>
      )}
      {Array.from({ length: empty }).map((_, i) => (
        <Star key={`e-${i}`} className="text-amber-400/30" style={{ width: size, height: size }} />
      ))}
    </div>
  );
}

interface ProfileViewProps {
  profile: ProfileMock;
  stocksBySlug: Map<string, StockWithBrand>;
}

export function ProfileView({ profile, stocksBySlug }: ProfileViewProps) {
  const shotStocks = profile.shotSlugs.map((s) => stocksBySlug.get(s)).filter(Boolean) as StockWithBrand[];
  const favouriteStocks = profile.favouriteSlugs.map((s) => stocksBySlug.get(s)).filter(Boolean) as StockWithBrand[];
  const shootlistStocks = profile.shootlistSlugs.map((s) => stocksBySlug.get(s)).filter(Boolean) as StockWithBrand[];

  const stats = [
    { label: "Films shot", value: profile.shotSlugs.length, icon: CheckCircle2 },
    { label: "Favourites", value: profile.favouriteSlugs.length, icon: Heart },
    { label: "On shootlist", value: profile.shootlistSlugs.length, icon: ListTodo },
    { label: "Rated", value: profile.ratings.length, icon: Star },
    { label: "Reviews", value: profile.reviews.length, icon: MessageSquare },
    { label: "Uploads", value: profile.uploads.length, icon: ImageIcon },
  ];

  return (
    <div className="space-y-8">
      {/* Profile header */}
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary/15 text-2xl font-bold text-primary">
            {profile.displayName.charAt(0)}
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight font-advercase">{profile.displayName}</h1>
            <p className="text-sm text-muted-foreground">FilmDB member</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-4 sm:gap-6">
          {stats.map(({ label, value, icon: Icon }) => (
            <div key={label} className="flex items-center gap-2 rounded-lg border border-border/50 bg-card px-4 py-2">
              <Icon className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-semibold">{value}</span>
              <span className="text-xs text-muted-foreground">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <FilmDetailTabs
        defaultId="shot"
        tabs={[
          {
            id: "shot",
            label: "I've shot",
            content: (
              <ProfileSection
                title="Films you've shot"
                description="Stocks you've marked as shot. Your ratings and reviews are linked from here."
                emptyMessage={'You haven\'t marked any films as shot yet. Visit a film page and tap "I\'ve shot this".'}
                isEmpty={shotStocks.length === 0}
              >
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                  {shotStocks.map((stock) => (
                    <FilmCard key={stock.id} stock={stock} />
                  ))}
                </div>
              </ProfileSection>
            ),
          },
          {
            id: "favourites",
            label: "Favourites",
            content: (
              <ProfileSection
                title="Favourite films"
                description="Stocks you've saved as favourites."
                emptyMessage="No favourites yet. Heart a film on its page to add it here."
                isEmpty={favouriteStocks.length === 0}
              >
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                  {favouriteStocks.map((stock) => (
                    <FilmCard key={stock.id} stock={stock} />
                  ))}
                </div>
              </ProfileSection>
            ),
          },
          {
            id: "shootlist",
            label: "Shootlist",
            content: (
              <ProfileSection
                title="Shootlist"
                description="Films you want to try. Your wishlist for future rolls."
                emptyMessage="Your shootlist is empty. Add films from their pages to remember what to try next."
                isEmpty={shootlistStocks.length === 0}
              >
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                  {shootlistStocks.map((stock) => (
                    <FilmCard key={stock.id} stock={stock} />
                  ))}
                </div>
              </ProfileSection>
            ),
          },
          {
            id: "ratings",
            label: "My ratings",
            content: (
              <ProfileSection
                title="Your ratings"
                description="Films you've rated. Click through to edit or add a review."
                emptyMessage="You haven't rated any films yet."
                isEmpty={profile.ratings.length === 0}
              >
                <ul className="space-y-3">
                  {profile.ratings.map((r) => {
                    const stock = stocksBySlug.get(r.slug);
                    if (!stock) return null;
                    return (
                      <li key={r.slug}>
                        <Link
                          href={`/films/${r.slug}`}
                          className="flex items-center gap-4 rounded-xl border border-border/50 bg-card p-4 transition-colors hover:border-primary/30 hover:bg-accent/30"
                        >
                          <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-muted">
                            {stock.image_url ? (
                              <Image
                                src={stock.image_url}
                                alt=""
                                fill
                                className="object-contain"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center">
                                <Camera className="h-6 w-6 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <span className="font-semibold text-foreground">
                              {stock.brand.name} {stock.name}
                            </span>
                          </div>
                          <MiniStars rating={r.rating} size={18} />
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </ProfileSection>
            ),
          },
          {
            id: "reviews",
            label: "My reviews",
            content: (
              <ProfileSection
                title="Your reviews"
                description="Written reviews you've left on film stock pages."
                emptyMessage="You haven't written any reviews yet."
                isEmpty={profile.reviews.length === 0}
              >
                <ul className="space-y-4">
                  {profile.reviews.map((rev, i) => (
                    <ReviewCard key={`${rev.slug}-${i}`} review={rev} stock={stocksBySlug.get(rev.slug)} />
                  ))}
                </ul>
              </ProfileSection>
            ),
          },
          {
            id: "uploads",
            label: "My uploads",
            content: (
              <ProfileSection
                title="Your uploads"
                description="Images you've uploaded for film stocks. Shown in Community for each stock."
                emptyMessage="You haven't uploaded any images yet."
                isEmpty={profile.uploads.length === 0}
              >
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                  {profile.uploads.map((up, i) => (
                    <UploadCard key={`${up.slug}-${i}`} upload={up} stock={stocksBySlug.get(up.slug)} />
                  ))}
                </div>
              </ProfileSection>
            ),
          },
        ]}
      />
    </div>
  );
}

function ProfileSection({
  title,
  description,
  emptyMessage,
  isEmpty,
  children,
}: {
  title: string;
  description: string;
  emptyMessage: string;
  isEmpty?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      <div className="mt-6">
        {isEmpty ? (
          <p className="rounded-xl border border-dashed border-border/50 bg-muted/30 px-4 py-8 text-center text-sm text-muted-foreground">
            {emptyMessage}
          </p>
        ) : (
          children
        )}
      </div>
    </div>
  );
}

function ReviewCard({ review, stock }: { review: ProfileReview; stock: StockWithBrand | undefined }) {
  const name = stock ? `${stock.brand.name} ${stock.name}` : review.slug;
  return (
    <li className="rounded-xl border border-border/50 bg-card p-5">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <Link href={`/films/${review.slug}`} className="font-semibold text-foreground hover:text-primary">
          {name}
        </Link>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <MiniStars rating={review.rating} />
          <span>{review.date}</span>
          {review.camera && <span> · {review.camera}</span>}
        </div>
      </div>
      <p className="text-sm leading-relaxed text-muted-foreground">{review.text}</p>
    </li>
  );
}

function UploadCard({
  upload,
  stock,
}: {
  upload: ProfileUpload;
  stock: StockWithBrand | undefined;
}) {
  const name = stock ? `${stock.brand.name} ${stock.name}` : upload.slug;
  return (
    <Link
      href={`/films/${upload.slug}`}
      className="group block overflow-hidden rounded-xl border border-border/50 bg-card transition-colors hover:border-primary/30"
    >
      <div className="relative aspect-[4/3] bg-muted">
        <Image
          src={upload.imageUrl}
          alt={upload.caption ?? name}
          fill
          className="object-cover transition-transform group-hover:scale-105"
        />
      </div>
      <div className="p-3">
        <p className="truncate text-sm font-medium text-foreground">{name}</p>
        {upload.caption && (
          <p className="mt-0.5 truncate text-xs text-muted-foreground">{upload.caption}</p>
        )}
        <p className="mt-1 text-xs text-muted-foreground">{upload.date}</p>
      </div>
    </Link>
  );
}
