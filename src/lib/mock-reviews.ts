/**
 * Mock review data for the Reviews tab — 50+ reviews with varied ratings, dates, text, and images.
 * Pagination shows 50 per page; total count is 152 for "Showing 1–50 of 152 reviews".
 */

const PLACEHOLDERS = [
  "/placeholders/placeholder-1.png",
  "/placeholders/placeholder-2.png",
  "/placeholders/placeholder-3.png",
  "/placeholders/placeholder-4.png",
];

export interface MockReviewReply {
  id: string;
  username: string;
  avatar: string;
  text: string;
  date: string;
}

export interface MockReview {
  id: string;
  username: string;
  avatar: string;
  rating: number;
  date: string;
  /** Short header/title for the review (e.g. "Kiss all the time, lets not disco please") */
  title: string;
  text: string;
  camera?: string;
  likes: number;
  /** Optional image URLs (e.g. from uploads). Many reviews include example images. */
  images: string[];
  /** Replies to this review (hidden until user taps to expand). */
  replies: MockReviewReply[];
}

function pick<T>(arr: T[], n: number): T[] {
  const out: T[] = [];
  for (let i = 0; i < n; i++) out.push(arr[i % arr.length]);
  return out;
}

const USERS = [
  { username: "nightcrawler_35mm", avatar: "NC" },
  { username: "analog.sara", avatar: "AS" },
  { username: "filmvault", avatar: "FV" },
  { username: "grainsofsilver", avatar: "GS" },
  { username: "shutterdiaries", avatar: "SD" },
  { username: "tokyoframes", avatar: "TF" },
  { username: "halation.club", avatar: "HC" },
  { username: "reelmoments", avatar: "RM" },
  { username: "neon.lab", avatar: "NL" },
  { username: "street.silver", avatar: "SS" },
  { username: "cinestill.lover", avatar: "CL" },
  { username: "tungsten.tales", avatar: "TT" },
  { username: "roll.by.roll", avatar: "RB" },
  { username: "halation.hunter", avatar: "HH" },
  { username: "film.soup", avatar: "FS" },
  { username: "night.shooter", avatar: "NS" },
  { username: "800t.daily", avatar: "8D" },
  { username: "analog.only", avatar: "AO" },
  { username: "red.glow", avatar: "RG" },
  { username: "cinema.still", avatar: "CS" },
  { username: "portra.party", avatar: "PP" },
  { username: "golden.hour", avatar: "GH" },
  { username: "moody.frames", avatar: "MF" },
  { username: "film.grain", avatar: "FG" },
  { username: "lens.cap", avatar: "LC" },
  { username: "shot.on.film", avatar: "SO" },
  { username: "develop.this", avatar: "DT" },
  { username: "push.pull", avatar: "PU" },
  { username: "box.speed", avatar: "BS" },
];

const CAMERAS = [
  "Contax G2",
  "Nikon FM2",
  "Canon AE-1",
  "Leica M6",
  "Pentax 67",
  "Olympus OM-1",
  "Nikon F3",
  "Minolta X-700",
  "Canon F-1",
  "Yashica T4",
];

const SENTENCES = [
  "The king of night photography film.",
  "Shot three rolls in Tokyo at night — the halation around neon signs is absolutely unreal.",
  "Nothing else gives you this look.",
  "Metered at 800 and got perfect exposures.",
  "If you haven't shot this under tungsten light, you're missing out.",
  "Gorgeous stock but you need to know what you're getting into.",
  "The halation is a love-it-or-hate-it thing.",
  "Shot a roll at golden hour and the warm tones were beautiful.",
  "The red glow around backlit subjects was a bit much for portraiture.",
  "Best reserved for moody urban work. Also — not cheap.",
  "Pushed this to 1600 for a concert shoot and the results were incredible.",
  "Grain is there but it adds character.",
  "The colors under mixed lighting are cinematic in a way no digital preset can replicate.",
  "This is the stock that got me back into film.",
  "Overhyped? Maybe slightly.",
  "It's a great stock but the price-to-roll ratio is brutal.",
  "The halation effect is cool but one-note.",
  "I prefer Portra 800 for general high-speed color work.",
  "That said, I keep coming back to 800T for specific projects.",
  "Shot my entire wedding reception on this and the couple was blown away.",
  "The warm ambient light rendered beautifully neutral.",
  "Halation around candles added magic I couldn't have planned.",
  "Expensive for a wedding, but absolutely worth it for the reception.",
  "Tried it at 1600 in a dim bar — grain was heavy but the look was worth it.",
  "Skin tones under neon can go magenta; just something to watch for.",
  "My go-to for any night street work now.",
  "Wish it came in 120 more readily.",
  "First roll was a learning curve; second roll I got the look I wanted.",
  "Worth every penny for the shots I got.",
];

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function buildText(minSentences: number, maxSentences: number): string {
  const n = randomInt(minSentences, maxSentences);
  const used = new Set<number>();
  const out: string[] = [];
  while (out.length < n) {
    const i = randomInt(0, SENTENCES.length - 1);
    if (used.has(i)) continue;
    used.add(i);
    out.push(SENTENCES[i]);
  }
  return out.join(" ");
}

const DATES = [
  "1 day ago",
  "2 days ago",
  "3 days ago",
  "5 days ago",
  "1 week ago",
  "2 weeks ago",
  "3 weeks ago",
  "1 month ago",
  "2 months ago",
  "3 months ago",
  "5 Mar 2026",
  "6 Mar 2026",
  "7 Mar 2026",
];

const REVIEW_TITLES = [
  "The king of night photography film",
  "Gorgeous stock but know what you're getting into",
  "Pushed to 1600 and the results were incredible",
  "Overhyped? Maybe slightly.",
  "Shot my entire wedding reception on this",
  "Halation is a love-it-or-hate-it thing",
  "Nothing else gives you this look",
  "Best reserved for moody urban work",
  "Grain adds character",
  "Colors under mixed lighting are cinematic",
  "This stock got me back into film",
  "Price-to-roll ratio is brutal",
  "Keep coming back to 800T for specific projects",
  "Warm ambient light rendered beautifully neutral",
  "Tried at 1600 in a dim bar — worth it",
  "My go-to for night street work now",
  "First roll was a learning curve",
  "Worth every penny for the shots I got",
  "Red glow around backlit subjects",
  "Expensive for a wedding but worth it",
  "Skin tones under neon can go magenta",
  "Wish it came in 120 more readily",
  "The halation effect is cool but one-note",
  "Metered at 800 and got perfect exposures",
  "Shot three rolls in Tokyo at night",
  "If you haven't shot this under tungsten, you're missing out",
  "I prefer Portra 800 for general high-speed work",
  "Halation around candles added magic",
  "Shot a roll at golden hour",
  "Cinematic in a way no digital preset can replicate",
];

const REPLY_TEXTS = [
  "Same — shot it in Tokyo last month and the halation was insane.",
  "Totally agree on the price. Worth it for special projects though.",
  "Pushed to 1600 once and loved the grain.",
  "This is the one that got me back into film too.",
  "Great point about skin tones under neon.",
  "I prefer Portra 800 for general use but 800T for night.",
  "Shot my first roll last week. Hooked.",
  "Wish it came in 120 more readily.",
  "The wedding reception tip is gold.",
  "Halation around candles is magic.",
];

function buildReplies(reviewIndex: number): MockReviewReply[] {
  const count = reviewIndex % 4; // 0, 1, 2, or 3 replies
  if (count === 0) return [];
  const out: MockReviewReply[] = [];
  for (let i = 0; i < count; i++) {
    const user = USERS[(reviewIndex + i + 1) % USERS.length];
    out.push({
      id: `reply-${reviewIndex}-${i}`,
      username: user.username,
      avatar: user.avatar,
      text: REPLY_TEXTS[(reviewIndex + i) % REPLY_TEXTS.length],
      date: i === 0 ? "1 day ago" : `${i + 1} days ago`,
    });
  }
  return out;
}

function buildMockReviews(count: number): MockReview[] {
  const reviews: MockReview[] = [];
  for (let i = 0; i < count; i++) {
    const user = USERS[i % USERS.length];
    const rating = [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5][i % 10];
    const imageCount = [0, 0, 1, 1, 2, 2, 3, 3, 4, 5, 6, 8, 10][i % 13]; // many have images
    reviews.push({
      id: `rev-${i + 1}`,
      username: user.username,
      avatar: user.avatar,
      rating,
      date: DATES[i % DATES.length],
      title: REVIEW_TITLES[i % REVIEW_TITLES.length],
      text: buildText(2, 6),
      camera: i % 3 === 0 ? undefined : CAMERAS[i % CAMERAS.length],
      likes: randomInt(2, 120),
      images: pick(PLACEHOLDERS, imageCount),
      replies: buildReplies(i),
    });
  }
  return reviews;
}

/** Total mock count for "Showing X–Y of Z" (e.g. 152). */
export const MOCK_REVIEWS_TOTAL = 152;

/** First page of 50 reviews for the long scroll. */
export const MOCK_REVIEWS_PAGE: MockReview[] = buildMockReviews(50);
