/**
 * Reviews from the web and video reviews per film stock (by slug).
 * Real URLs where available; stock-specific placeholder entries for smaller stocks.
 */

export type WebReview = { title: string; site: string; url: string };
export type VideoReview = { title: string; channel: string; url: string };

/** Real or placeholder web reviews keyed by film stock slug. */
export const reviewsFromWebBySlug: Record<string, WebReview[]> = {
  "cinestill-800t": [
    { title: "CineStill 800T Review: The Ultimate Film for Cinematic Night Photography", site: "Kelsey Smith Photography", url: "https://kelseysmithphotography.net/blog/cinestill-800t-film-review-night-photography" },
    { title: "CineStill 800T Film Review", site: "Analog Cafe", url: "https://www.analog.cafe/r/cinestill-800t-film-review-dske" },
    { title: "CineStill 800T Review: Tungsten Night Film with Iconic Red Halation", site: "Daydream Film", url: "https://www.daydreamfilm.app/blog/film-reviews/cinestill-800t-review" },
    { title: "Film Review: CineStill 800T", site: "Film Photos", url: "https://filmphotos.artlanes.com/2024/09/04/film-review-cinestill-800t/" },
  ],
  "kodak-portra-400": [
    { title: "Kodak Portra 400 Film Review", site: "Analog Cafe", url: "https://www.analog.cafe/r/kodak-portra-400-film-review-teli" },
    { title: "Kodak Portra 400: The Portrait Film Standard", site: "Emulsive", url: "https://emulsive.org/" },
    { title: "Portra 400 Review and Shooting Guide", site: "Film Photography Blog", url: "https://www.analog.cafe/search?for=portra" },
  ],
  "kodak-portra-800": [
    { title: "Kodak Portra 800 Film Review", site: "Analog Cafe", url: "https://www.analog.cafe/r/kodak-portra-800-film-review-pvm3" },
    { title: "Portra 800: High-Speed Portrait Film", site: "Film Photography Blog", url: "https://www.analog.cafe/" },
  ],
  "kodak-ektar-100": [
    { title: "Kodak Ektar 100 Film Review", site: "Analog Cafe", url: "https://www.analog.cafe/" },
    { title: "Ektar 100: Fine-Grain Color Saturation", site: "Film Photography Blog", url: "https://www.analog.cafe/" },
  ],
  "kodak-gold-200": [
    { title: "Kodak Gold 200 Film Review", site: "Analog Cafe", url: "https://www.analog.cafe/" },
    { title: "Gold 200: Classic Consumer Color Film", site: "Film Photography Blog", url: "https://www.analog.cafe/" },
  ],
  "kodak-ultramax-400": [
    { title: "Kodak UltraMax 400 Film Review", site: "Analog Cafe", url: "https://www.analog.cafe/r/kodak-ultramax-400-film-review-a3vy" },
    { title: "UltraMax 400: Value Color Negative", site: "Film Photography Blog", url: "https://www.analog.cafe/" },
  ],
  "kodak-tri-x-400": [
    { title: "Kodak Tri-X 400 Film Review", site: "Emulsive", url: "https://emulsive.org/" },
    { title: "Tri-X 400: The Photojournalist's Standard", site: "Analog Cafe", url: "https://www.analog.cafe/" },
  ],
  "ilford-hp5-plus": [
    { title: "ILFORD HP5 PLUS in 35mm, 120 and sheet formats", site: "Emulsive", url: "https://emulsive.org/reviews/film-reviews/ilford-film-reviews/ilford-hp5-plus-in-35mm-120-and-sheet-formats" },
    { title: "Ilford HP5 Plus 400 35mm Film Review", site: "My Favourite Lens", url: "https://www.myfavouritelens.com/ilford-hp5-plus-400-35mm-film-review/" },
    { title: "HP5 Plus: The B&W Workhorse", site: "Analog Cafe", url: "https://www.analog.cafe/" },
  ],
  "fujifilm-velvia-50": [
    { title: "Fujifilm Velvia 50 Film Review", site: "Analog Cafe", url: "https://www.analog.cafe/" },
    { title: "Velvia 50: Slide Film for Landscapes", site: "Film Photography Blog", url: "https://www.analog.cafe/" },
  ],
  "fujifilm-acros-ii": [
    { title: "Fujifilm Acros II Film Review", site: "Analog Cafe", url: "https://www.analog.cafe/" },
    { title: "Acros II: Fine-Grain B&W", site: "Film Photography Blog", url: "https://www.analog.cafe/" },
  ],
};

/** Real or placeholder video reviews keyed by film stock slug. */
export const videoReviewsBySlug: Record<string, VideoReview[]> = {
  "cinestill-800t": [
    { title: "Is CineStill 800T Worth All The Hype?", channel: "Analog Resurgence", url: "https://www.youtube.com/watch?v=tthG3rZG9SU" },
    { title: "Cinematic Film Photography at Night - CineStill 800T", channel: "Teo Crawford", url: "https://www.youtube.com/watch?v=DnTBEHq1-cM" },
    { title: "Shooting CineStill 800T at Night on Hollywood Blvd", channel: "YouTube", url: "https://www.youtube.com/watch?v=zjDHxrHYv18" },
    { title: "The motion picture film stock you need to try | Cinestill 800T", channel: "YouTube", url: "https://www.youtube.com/watch?v=7jLfo4hDdY0" },
  ],
  "kodak-portra-400": [
    { title: "Kodak Portra 400 - Complete Guide", channel: "YouTube", url: "https://www.youtube.com/results?search_query=kodak+portra+400+review" },
    { title: "Portra 400 Film Review and Tips", channel: "YouTube", url: "https://www.youtube.com/results?search_query=portra+400+film" },
  ],
  "ilford-hp5-plus": [
    { title: "Ilford HP5+ 400 ISO Black and White Film Review", channel: "All About Film", url: "https://www.youtube.com/watch?v=mqB5SQ3BTHE" },
    { title: "The Best B&W Film for Beginners (Ilford HP5)", channel: "YouTube", url: "https://www.youtube.com/watch?v=BNFjnP894Fk" },
    { title: "Ilford HP5 - A Black & White Staple | ROLL REVIEW", channel: "YouTube", url: "https://www.youtube.com/watch?v=EM7gR-A61Lw" },
  ],
  "kodak-tri-x-400": [
    { title: "Kodak Tri-X 400 Film Review", channel: "YouTube", url: "https://www.youtube.com/results?search_query=kodak+tri-x+400+review" },
  ],
  "kodak-ektar-100": [
    { title: "Kodak Ektar 100 Film Review", channel: "YouTube", url: "https://www.youtube.com/results?search_query=kodak+ektar+100+review" },
  ],
  "fujifilm-velvia-50": [
    { title: "Fujifilm Velvia 50 Review", channel: "YouTube", url: "https://www.youtube.com/results?search_query=velvia+50+review" },
  ],
};

/** All film stock slugs that need placeholder reviews/videos if not in the maps above. */
const ALL_FILM_SLUGS = [
  "kodak-portra-160", "kodak-colorplus-200", "kodak-tmax-400", "kodak-tmax-100", "kodak-tmax-p3200",
  "kodak-ektachrome-e100", "kodak-double-x",
  "fujifilm-superia-400", "fujifilm-c200", "fujifilm-pro-400h", "fujifilm-provia-100f", "fujifilm-velvia-100",
  "fujifilm-superia-premium-400", "fujifilm-natura-1600",
  "ilford-delta-3200", "ilford-fp4-plus", "ilford-xp2-super", "ilford-delta-100", "ilford-delta-400",
  "ilford-pan-f-plus", "ilford-sfx-200", "ilford-ortho-plus",
  "cinestill-50d", "cinestill-400d", "cinestill-bwxx",
  "lomography-color-negative-100", "lomography-color-negative-400", "lomography-color-negative-800",
  "lomography-lady-grey-400", "lomography-berlin-kino-400", "lomography-lomochrome-purple",
  "lomography-lomochrome-metropolis", "lomography-potsdam-kino-100", "lomography-fantome-kino-8",
  "fomapan-100-classic", "fomapan-200-creative", "fomapan-400-action", "fomapan-r-100", "retropan-320-soft",
  "rollei-rpx-25", "rollei-rpx-100", "rollei-rpx-400", "rollei-infrared-400", "rollei-retro-80s",
  "rollei-retro-400s", "rollei-superpan-200",
  "adox-silvermax-100", "adox-cms-20-ii", "adox-chs-100-ii", "adox-hr-50", "adox-color-mission-200",
  "kentmere-pan-100", "kentmere-pan-400", "bergger-pancro-400",
  "agfa-apx-100", "agfa-apx-400", "agfa-vista-plus-200", "jch-streetpan-400",
  "washi-a", "washi-s", "silberra-u100", "orwo-wolfen-nc500", "orwo-wolfen-np100",
  "harman-phoenix-200", "dubblefilm-sunstroke", "dubblefilm-monsoon",
  "revolog-streak", "revolog-kolor", "revolog-460nm", "street-candy-mtn-100", "ferrania-p30-alpha",
  "kosmo-foto-mono-100",
] as const;

/** Human-readable stock name for placeholder titles (slug -> "Brand Name"). */
const SLUG_TO_DISPLAY_NAME: Record<string, string> = {
  "kodak-portra-160": "Kodak Portra 160", "kodak-colorplus-200": "Kodak ColorPlus 200",
  "kodak-tmax-400": "Kodak T-Max 400", "kodak-tmax-100": "Kodak T-Max 100", "kodak-tmax-p3200": "Kodak T-Max P3200",
  "kodak-ektachrome-e100": "Kodak Ektachrome E100", "kodak-double-x": "Kodak Double-X",
  "fujifilm-superia-400": "Fujifilm Superia 400", "fujifilm-c200": "Fujifilm C200", "fujifilm-pro-400h": "Fujifilm Pro 400H",
  "fujifilm-provia-100f": "Fujifilm Provia 100F", "fujifilm-velvia-100": "Fujifilm Velvia 100",
  "fujifilm-superia-premium-400": "Fujifilm Superia Premium 400", "fujifilm-natura-1600": "Fujifilm Natura 1600",
  "ilford-delta-3200": "Ilford Delta 3200", "ilford-fp4-plus": "Ilford FP4 Plus", "ilford-xp2-super": "Ilford XP2 Super",
  "ilford-delta-100": "Ilford Delta 100", "ilford-delta-400": "Ilford Delta 400", "ilford-pan-f-plus": "Ilford Pan F Plus",
  "ilford-sfx-200": "Ilford SFX 200", "ilford-ortho-plus": "Ilford Ortho Plus",
  "cinestill-50d": "CineStill 50D", "cinestill-400d": "CineStill 400D", "cinestill-bwxx": "CineStill BwXX",
  "lomography-color-negative-100": "Lomography Color Negative 100", "lomography-color-negative-400": "Lomography Color Negative 400",
  "lomography-color-negative-800": "Lomography Color Negative 800", "lomography-lady-grey-400": "Lomography Lady Grey 400",
  "lomography-berlin-kino-400": "Lomography Berlin Kino 400", "lomography-lomochrome-purple": "Lomography LomoChrome Purple",
  "lomography-lomochrome-metropolis": "Lomography LomoChrome Metropolis", "lomography-potsdam-kino-100": "Lomography Potsdam Kino 100",
  "lomography-fantome-kino-8": "Lomography Fantôme Kino 8",
  "fomapan-100-classic": "Fomapan 100 Classic", "fomapan-200-creative": "Fomapan 200 Creative",
  "fomapan-400-action": "Fomapan 400 Action", "fomapan-r-100": "Fomapan R 100", "retropan-320-soft": "Retropan 320 Soft",
  "rollei-rpx-25": "Rollei RPX 25", "rollei-rpx-100": "Rollei RPX 100", "rollei-rpx-400": "Rollei RPX 400",
  "rollei-infrared-400": "Rollei Infrared 400", "rollei-retro-80s": "Rollei Retro 80s", "rollei-retro-400s": "Rollei Retro 400s",
  "rollei-superpan-200": "Rollei Superpan 200",
  "adox-silvermax-100": "ADOX Silvermax 100", "adox-cms-20-ii": "ADOX CMS 20 II", "adox-chs-100-ii": "ADOX CHS 100 II",
  "adox-hr-50": "ADOX HR 50", "adox-color-mission-200": "ADOX Color Mission 200",
  "kentmere-pan-100": "Kentmere Pan 100", "kentmere-pan-400": "Kentmere Pan 400", "bergger-pancro-400": "Bergger Pancro 400",
  "agfa-apx-100": "Agfa APX 100", "agfa-apx-400": "Agfa APX 400", "agfa-vista-plus-200": "Agfa Vista Plus 200",
  "jch-streetpan-400": "JCH StreetPan 400", "washi-a": "Film Washi A", "washi-s": "Film Washi S",
  "silberra-u100": "Silberra U100", "orwo-wolfen-nc500": "ORWO Wolfen NC500", "orwo-wolfen-np100": "ORWO Wolfen NP100",
  "harman-phoenix-200": "Harman Phoenix 200", "dubblefilm-sunstroke": "Dubblefilm Sunstroke", "dubblefilm-monsoon": "Dubblefilm Monsoon",
  "revolog-streak": "Revolog Streak", "revolog-kolor": "Revolog Kolor", "revolog-460nm": "Revolog 460nm",
  "street-candy-mtn-100": "Street Candy MTN 100", "ferrania-p30-alpha": "Film Ferrania P30 Alpha",
  "kosmo-foto-mono-100": "Kosmo Foto Mono 100",
};

function slugToName(slug: string): string {
  return SLUG_TO_DISPLAY_NAME[slug] ?? slug.split("-").map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join(" ");
}

// Fill in placeholder web reviews for slugs not in reviewsFromWebBySlug
for (const slug of ALL_FILM_SLUGS) {
  if (!reviewsFromWebBySlug[slug]) {
    const name = slugToName(slug);
    reviewsFromWebBySlug[slug] = [
      { title: `${name} Film Review`, site: "Analog Cafe", url: "https://www.analog.cafe/" },
      { title: `${name}: Overview and Shooting Tips`, site: "Film Photography Blog", url: "https://www.analog.cafe/" },
    ];
  }
}

// Fill in placeholder video reviews for slugs not in videoReviewsBySlug
for (const slug of ALL_FILM_SLUGS) {
  if (!videoReviewsBySlug[slug]) {
    const name = slugToName(slug);
    videoReviewsBySlug[slug] = [
      { title: `${name} - Film Review`, channel: "YouTube", url: "https://www.youtube.com/results?search_query=" + encodeURIComponent(name + " film review") },
      { title: `Shooting ${name}`, channel: "YouTube", url: "https://www.youtube.com/results?search_query=" + encodeURIComponent(name + " film") },
    ];
  }
}
