/**
 * Mock profile data for the logged-in user (no auth yet).
 * All slugs reference real film stocks in seed-data.
 */

export interface ProfileRating {
  slug: string;
  rating: number; // 1–5
}

export interface ProfileReview {
  slug: string;
  rating: number;
  text: string;
  date: string; // e.g. "2 weeks ago"
  camera?: string;
}

export interface ProfileUpload {
  slug: string;
  imageUrl: string; // placeholder or real URL
  caption: string | null;
  date: string;
}

export interface ProfileMock {
  displayName: string;
  /** Slugs of films the user has marked "I've shot this" */
  shotSlugs: string[];
  /** Slugs of favourited films */
  favouriteSlugs: string[];
  /** Slugs of films on the user's shootlist (wishlist) */
  shootlistSlugs: string[];
  /** Films the user has rated */
  ratings: ProfileRating[];
  /** Written reviews */
  reviews: ProfileReview[];
  /** User-uploaded images per stock */
  uploads: ProfileUpload[];
}

export const profileMock: ProfileMock = {
  displayName: "Alex",
  shotSlugs: [
    "kodak-portra-400",
    "cinestill-800t",
    "kodak-tri-x-400",
    "ilford-hp5-plus",
    "kodak-gold-200",
    "kodak-ektar-100",
    "fujifilm-velvia-50",
    "cinestill-400d",
  ],
  favouriteSlugs: [
    "kodak-portra-400",
    "cinestill-800t",
    "fujifilm-velvia-50",
    "kodak-ektar-100",
    "ilford-hp5-plus",
  ],
  shootlistSlugs: [
    "kodak-portra-800",
    "fujifilm-provia-100f",
    "cinestill-50d",
    "ilford-delta-100",
    "kodak-tmax-p3200",
  ],
  ratings: [
    { slug: "kodak-portra-400", rating: 5 },
    { slug: "cinestill-800t", rating: 4.5 },
    { slug: "kodak-tri-x-400", rating: 5 },
    { slug: "ilford-hp5-plus", rating: 4 },
    { slug: "kodak-gold-200", rating: 4 },
    { slug: "kodak-ektar-100", rating: 4.5 },
    { slug: "fujifilm-velvia-50", rating: 5 },
    { slug: "cinestill-400d", rating: 4 },
  ],
  reviews: [
    {
      slug: "cinestill-800t",
      rating: 5,
      text: "The king of night photography. Shot three rolls in Tokyo — the halation around neon signs is unreal. Nothing else gives you this look.",
      date: "2 weeks ago",
      camera: "Contax G2",
    },
    {
      slug: "kodak-portra-400",
      rating: 5,
      text: "My go-to for portraits and travel. Skin tones are perfect, and the latitude means I rarely mess up an exposure. Worth every penny.",
      date: "1 month ago",
      camera: "Nikon F3",
    },
    {
      slug: "kodak-ektar-100",
      rating: 4.5,
      text: "Incredible saturation for landscapes. Reds and blues pop like nothing else. Just meter carefully — it's less forgiving than Portra.",
      date: "3 weeks ago",
    },
  ],
  uploads: [
    {
      slug: "cinestill-800t",
      imageUrl: "/films/cinestill-800t.jpg",
      caption: "Neon signs, downtown",
      date: "2 weeks ago",
    },
    {
      slug: "cinestill-800t",
      imageUrl: "/films/cinestill-800t.jpg",
      caption: null,
      date: "2 weeks ago",
    },
    {
      slug: "kodak-portra-400",
      imageUrl: "/films/portra-400.jpg",
      caption: "Golden hour portrait",
      date: "1 month ago",
    },
    {
      slug: "kodak-gold-200",
      imageUrl: "/films/gold-200.jpg",
      caption: "Summer trip",
      date: "1 month ago",
    },
  ],
};
