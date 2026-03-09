import { Star, StarHalf } from "lucide-react";

interface StarRatingProps {
  rating: number;
  size?: number;
}

export function StarRating({ rating, size = 18 }: StarRatingProps) {
  const fullStars = Math.floor(rating);
  const hasHalf = rating - fullStars >= 0.25 && rating - fullStars < 0.75;
  const adjustedFull = rating - fullStars >= 0.75 ? fullStars + 1 : fullStars;
  const emptyStars = 5 - adjustedFull - (hasHalf ? 1 : 0);

  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center">
        {Array.from({ length: adjustedFull }).map((_, i) => (
          <Star
            key={`full-${i}`}
            className="text-amber-400 fill-amber-400"
            style={{ width: size, height: size }}
          />
        ))}
        {hasHalf && (
          <div className="relative" style={{ width: size, height: size }}>
            <Star
              className="absolute text-amber-400/30"
              style={{ width: size, height: size }}
            />
            <StarHalf
              className="absolute text-amber-400 fill-amber-400"
              style={{ width: size, height: size }}
            />
          </div>
        )}
        {Array.from({ length: emptyStars }).map((_, i) => (
          <Star
            key={`empty-${i}`}
            className="text-amber-400/30"
            style={{ width: size, height: size }}
          />
        ))}
      </div>
      <span className="text-sm font-semibold text-foreground/80">
        {rating.toFixed(1)}
      </span>
    </div>
  );
}
