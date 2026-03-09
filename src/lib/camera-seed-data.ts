import type { CameraBrand, FilmCamera } from "@/lib/types";

const ts = () => new Date().toISOString();

export const seedCameraBrands: CameraBrand[] = [
  { id: "cb-nikon", name: "Nikon", slug: "nikon", description: "Japanese optical and imaging company. Legendary F-mount SLRs and rangefinders.", website_url: "https://www.nikon.com", created_at: ts(), updated_at: ts() },
  { id: "cb-canon", name: "Canon", slug: "canon", description: "Japanese multinational. AE-1, F-1, and EOS film cameras are icons.", website_url: "https://global.canon", created_at: ts(), updated_at: ts() },
  { id: "cb-pentax", name: "Pentax", slug: "pentax", description: "Japanese camera maker. K1000, 67, and 645 are beloved by film shooters.", website_url: "https://www.pentax.com", created_at: ts(), updated_at: ts() },
  { id: "cb-olympus", name: "Olympus", slug: "olympus", description: "OM system SLRs and compact XA/mju series defined portable quality.", website_url: "https://www.olympus-global.com", created_at: ts(), updated_at: ts() },
  { id: "cb-minolta", name: "Minolta", slug: "minolta", description: "Japanese camera company. X-700, SR-T, and Autocord TLR are classics.", website_url: null, created_at: ts(), updated_at: ts() },
  { id: "cb-leica", name: "Leica", slug: "leica", description: "German precision. M-series rangefinders and R-series SLRs.", website_url: "https://leica-camera.com", created_at: ts(), updated_at: ts() },
  { id: "cb-hasselblad", name: "Hasselblad", slug: "hasselblad", description: "Swedish medium format. 500 series and V system are industry standards.", website_url: "https://www.hasselblad.com", created_at: ts(), updated_at: ts() },
  { id: "cb-mamiya", name: "Mamiya", slug: "mamiya", description: "Japanese medium format. RB67, RZ67, 7, and C330 TLR.", website_url: null, created_at: ts(), updated_at: ts() },
  { id: "cb-rollei", name: "Rollei", slug: "rollei", description: "German TLR and 35mm. Rolleiflex and Rolleicord are legendary.", website_url: "https://www.rolleianalog.com", created_at: ts(), updated_at: ts() },
  { id: "cb-fuji", name: "Fujifilm", slug: "fujifilm-cameras", description: "Fuji medium format rangefinders and compact cameras.", website_url: "https://www.fujifilm.com", created_at: ts(), updated_at: ts() },
  { id: "cb-contax", name: "Contax", slug: "contax", description: "Zeiss optics, Kyocera/Yashica build. T2, T3, G1, G2.", website_url: null, created_at: ts(), updated_at: ts() },
  { id: "cb-yashica", name: "Yashica", slug: "yashica", description: "Japanese maker. Mat-124G TLR, Electro 35 rangefinder.", website_url: null, created_at: ts(), updated_at: ts() },
  { id: "cb-konica", name: "Konica", slug: "konica", description: "Hexar AF, Auto S3, and Hexar RF rangefinders.", website_url: null, created_at: ts(), updated_at: ts() },
  { id: "cb-ricoh", name: "Ricoh", slug: "ricoh", description: "GR1, GR1s, GR21 compact 35mm cameras.", website_url: "https://www.ricoh-imaging.co.jp", created_at: ts(), updated_at: ts() },
  { id: "cb-zeiss", name: "Zeiss", slug: "zeiss", description: "Ikon rangefinders and Contax legacy.", website_url: "https://www.zeiss.com", created_at: ts(), updated_at: ts() },
  { id: "cb-polaroid", name: "Polaroid", slug: "polaroid", description: "Instant photography. SX-70, 600, Spectra.", website_url: "https://www.polaroid.com", created_at: ts(), updated_at: ts() },
  { id: "cb-lomography", name: "Lomography", slug: "lomography", description: "LC-A, LCA+, Diana, and creative film cameras.", website_url: "https://www.lomography.com", created_at: ts(), updated_at: ts() },
  { id: "cb-holga", name: "Holga", slug: "holga", description: "Plastic 120 and 35mm cameras with lo-fi aesthetic.", website_url: null, created_at: ts(), updated_at: ts() },
  { id: "cb-kodak", name: "Kodak", slug: "kodak-cameras", description: "Retina, Pony, and disposable cameras.", website_url: "https://www.kodak.com", created_at: ts(), updated_at: ts() },
  { id: "cb-voigtlander", name: "Voigtländer", slug: "voigtlander", description: "Bessa rangefinders and classic folding cameras.", website_url: "https://www.voigtlaender.de", created_at: ts(), updated_at: ts() },
  { id: "cb-bronica", name: "Bronica", slug: "bronica", description: "Medium format SQ, ETR, and GS systems.", website_url: null, created_at: ts(), updated_at: ts() },
  { id: "cb-kiev", name: "Kiev", slug: "kiev", description: "Soviet rangefinder and medium format cameras.", website_url: null, created_at: ts(), updated_at: ts() },
  { id: "cb-zorki", name: "Zorki", slug: "zorki", description: "Soviet Leica-style rangefinders.", website_url: null, created_at: ts(), updated_at: ts() },
  { id: "cb-fed", name: "FED", slug: "fed", description: "Soviet rangefinder cameras.", website_url: null, created_at: ts(), updated_at: ts() },
  { id: "cb-zenit", name: "Zenit", slug: "zenit", description: "Soviet 35mm SLR cameras.", website_url: null, created_at: ts(), updated_at: ts() },
  { id: "cb-argus", name: "Argus", slug: "argus", description: "American C3 and other classic cameras.", website_url: null, created_at: ts(), updated_at: ts() },
  { id: "cb-agfa", name: "Agfa", slug: "agfa", description: "Agfa Optima, Isolette, and other cameras.", website_url: null, created_at: ts(), updated_at: ts() },
  { id: "cb-ansco", name: "Ansco", slug: "ansco", description: "American brand. Speedex, Memar.", website_url: null, created_at: ts(), updated_at: ts() },
  { id: "cb-sinar", name: "Sinar", slug: "sinar", description: "Swiss large format and view cameras.", website_url: "https://www.sinar.ch", created_at: ts(), updated_at: ts() },
  { id: "cb-toyo", name: "Toyo", slug: "toyo", description: "Japanese large format field and view cameras.", website_url: null, created_at: ts(), updated_at: ts() },
  { id: "cb-superheadz", name: "Superheadz", slug: "superheadz", description: "Japanese toy and novelty film cameras.", website_url: null, created_at: ts(), updated_at: ts() },
];

function cam(
  id: string,
  name: string,
  slug: string,
  brand_id: string,
  format: ("35mm" | "120" | "4x5" | "8x10" | "110" | "instant" | "127" | "220" | "620")[],
  type: "slr" | "rangefinder" | "tlr" | "point_and_shoot" | "viewfinder" | "folding" | "instant" | "large_format" | "medium_format_slr" | "medium_format_rangefinder" | "toy" | "pinhole",
  year_introduced: number | null,
  year_discontinued: number | null,
  description: string | null,
  lens_mount: string | null,
  features: string[]
): FilmCamera {
  return {
    id,
    name,
    slug,
    brand_id,
    format,
    type,
    year_introduced,
    year_discontinued,
    description,
    lens_mount,
    features,
    image_url: null,
    created_at: ts(),
    updated_at: ts(),
  };
}

export const seedFilmCameras: FilmCamera[] = [
  // Nikon
  cam("cam-nikon-f", "Nikon F", "nikon-f", "cb-nikon", ["35mm"], "slr", 1959, 1974, "The first Japanese system SLR. Professional standard with interchangeable finders and lenses.", "Nikon F", ["Interchangeable prism", "Full system"]),
  cam("cam-nikon-f2", "Nikon F2", "nikon-f2", "cb-nikon", ["35mm"], "slr", 1971, 1980, "Legendary professional SLR. All-mechanical, rugged.", "Nikon F", ["Professional", "Mechanical"]),
  cam("cam-nikon-f3", "Nikon F3", "nikon-f3", "cb-nikon", ["35mm"], "slr", 1980, 2001, "Quartz-timed electronic shutter, LED metering. Used by NASA in space.", "Nikon F", ["Aperture priority", "HP finder option"]),
  cam("cam-nikon-fm2", "Nikon FM2", "nikon-fm2", "cb-nikon", ["35mm"], "slr", 1982, 2001, "All-mechanical 1/4000s shutter. No batteries for shutter.", "Nikon F", ["Mechanical", "1/4000s"]),
  cam("cam-nikon-fe2", "Nikon FE2", "nikon-fe2", "cb-nikon", ["35mm"], "slr", 1983, 1987, "Compact electronic SLR with aperture priority and 1/4000s.", "Nikon F", ["Aperture priority", "TTL flash"]),
  cam("cam-nikon-fm10", "Nikon FM10", "nikon-fm10", "cb-nikon", ["35mm"], "slr", 1995, 2006, "Entry-level mechanical SLR. Reliable and affordable.", "Nikon F", ["Mechanical", "Metered"]),
  cam("cam-nikon-f100", "Nikon F100", "nikon-f100", "cb-nikon", ["35mm"], "slr", 1998, 2006, "Advanced amateur/professional AF SLR. D100’s film counterpart.", "Nikon F", ["Autofocus", "Matrix metering"]),
  cam("cam-nikon-f6", "Nikon F6", "nikon-f6", "cb-nikon", ["35mm"], "slr", 2004, 2020, "Last professional Nikon film SLR. Full automation and durability.", "Nikon F", ["Autofocus", "Multi-segment metering"]),
  cam("cam-nikon-sp", "Nikon SP", "nikon-sp", "cb-nikon", ["35mm"], "rangefinder", 1957, 1965, "Professional rangefinder with 1:1 finder and 50–135 framelines.", "Nikon S", ["Interchangeable lens", "Coupled meter"]),
  cam("cam-nikon-nikkormat-ftn", "Nikkormat FTn", "nikon-nikkormat-ftn", "cb-nikon", ["35mm"], "slr", 1967, 1975, "Robust consumer SLR with center-weighted metering.", "Nikon F", ["Match-needle metering"]),
  cam("cam-nikon-nikonos-v", "Nikonos V", "nikon-nikonos-v", "cb-nikon", ["35mm"], "point_and_shoot", 1984, 2001, "Underwater 35mm camera. Amphibious to 50m.", "Nikonos", ["Underwater", "O-ring sealed"]),

  // Canon
  cam("cam-canon-ae-1", "Canon AE-1", "canon-ae-1", "cb-canon", ["35mm"], "slr", 1976, 1984, "One of the best-selling SLRs. Shutter-priority automation.", "Canon FD", ["Shutter priority", "LED viewfinder"]),
  cam("cam-canon-a-1", "Canon A-1", "canon-a-1", "cb-canon", ["35mm"], "slr", 1978, 1985, "Program, aperture priority, shutter priority, and manual.", "Canon FD", ["Multi-mode", "LCD display"]),
  cam("cam-canon-f-1", "Canon F-1", "canon-f-1", "cb-canon", ["35mm"], "slr", 1971, 1981, "Professional system SLR. All-mechanical or with servo finder.", "Canon FD", ["Interchangeable finder", "Motor drive"]),
  cam("cam-canon-ftb", "Canon FTb", "canon-ftb", "cb-canon", ["35mm"], "slr", 1971, 1976, "Robust FD-mount SLR with full-aperture metering.", "Canon FD", ["Full-aperture metering"]),
  cam("cam-canon-canonet-ql17", "Canon Canonet QL17", "canon-canonet-ql17", "cb-canon", ["35mm"], "rangefinder", 1965, 1972, "Fixed-lens rangefinder with quick-load and 40mm f/1.7.", null, ["Coupled rangefinder", "Selenium meter"]),
  cam("cam-canon-eos-1v", "Canon EOS 1V", "canon-eos-1v", "cb-canon", ["35mm"], "slr", 2000, 2018, "Flagship EOS film body. 45-point AF, 10 fps.", "Canon EF", ["Autofocus", "45-point AF"]),
  cam("cam-canon-eos-5", "Canon EOS 5", "canon-eos-5", "cb-canon", ["35mm"], "slr", 1992, 1998, "Eye-controlled focus point selection. A2e in US.", "Canon EF", ["Eye-control AF", "5-point AF"]),
  cam("cam-canon-eos-3", "Canon EOS 3", "canon-eos-3", "cb-canon", ["35mm"], "slr", 1998, 2007, "45-point area AF and eye-control. Sealed body.", "Canon EF", ["45-point AF", "Eye-control"]),
  cam("cam-canon-pellix", "Canon Pellix", "canon-pellix", "cb-canon", ["35mm"], "slr", 1965, 1966, "Fixed pellicle mirror for live view and reduced vibration.", "Canon FL", ["Pellicle mirror"]),

  // Pentax
  cam("cam-pentax-k1000", "Pentax K1000", "pentax-k1000", "cb-pentax", ["35mm"], "slr", 1976, 1997, "The student and beginner classic. Fully manual, no frills.", "Pentax K", ["Mechanical", "CdS meter"]),
  cam("cam-pentax-mx", "Pentax MX", "pentax-mx", "cb-pentax", ["35mm"], "slr", 1976, 1985, "Compact mechanical SLR. Smallest 35mm SLR at release.", "Pentax K", ["Mechanical", "Compact"]),
  cam("cam-pentax-lx", "Pentax LX", "pentax-lx", "cb-pentax", ["35mm"], "slr", 1980, 2001, "Professional SLR with off-the-film metering and seals.", "Pentax K", ["OTF metering", "Weather-sealed"]),
  cam("cam-pentax-67", "Pentax 6x7", "pentax-67", "cb-pentax", ["120"], "medium_format_slr", 1969, 1998, "6x7 SLR with 35mm-style handling. Heavy but iconic.", "Pentax 6x7", ["Interchangeable lens", "MLU"]),
  cam("cam-pentax-645", "Pentax 645", "pentax-645", "cb-pentax", ["120"], "medium_format_slr", 1984, 1997, "6x4.5 SLR with autofocus (645N).", "Pentax 645", ["Medium format", "Interchangeable lens"]),
  cam("cam-pentax-spotmatic", "Pentax Spotmatic", "pentax-spotmatic", "cb-pentax", ["35mm"], "slr", 1964, 1976, "Spot metering and M42 screw mount. Huge seller.", "M42", ["Spot meter", "Screw mount"]),
  cam("cam-pentax-kx", "Pentax KX", "pentax-kx", "cb-pentax", ["35mm"], "slr", 1975, 1977, "K-mount SLR with match-needle metering.", "Pentax K", ["Center-weighted"]),
  cam("cam-pentax-me-super", "Pentax ME Super", "pentax-me-super", "cb-pentax", ["35mm"], "slr", 1979, 1984, "Compact aperture-priority with manual override buttons.", "Pentax K", ["Aperture priority", "Compact"]),

  // Olympus
  cam("cam-olympus-om-1", "Olympus OM-1", "olympus-om-1", "cb-olympus", ["35mm"], "slr", 1972, 1979, "Compact system SLR that defined the OM system.", "Olympus OM", ["Compact", "Interchangeable finder"]),
  cam("cam-olympus-om-2", "Olympus OM-2", "olympus-om-2", "cb-olympus", ["35mm"], "slr", 1975, 1984, "Off-the-film metering for accurate auto exposure.", "Olympus OM", ["OTF metering", "Aperture priority"]),
  cam("cam-olympus-om-4", "Olympus OM-4", "olympus-om-4", "cb-olympus", ["35mm"], "slr", 1983, 1987, "Multi-spot metering (up to 8 spots).", "Olympus OM", ["Multi-spot", "Aperture priority"]),
  cam("cam-olympus-xa", "Olympus XA", "olympus-xa", "cb-olympus", ["35mm"], "rangefinder", 1979, 1985, "Compact clamshell rangefinder. 35mm f/2.8.", null, ["Clamshell", "Rangefinder"]),
  cam("cam-olympus-mju-ii", "Olympus mju II", "olympus-mju-ii", "cb-olympus", ["35mm"], "point_and_shoot", 1997, 2003, "Stylus Epic in US. Sharp 35mm f/2.8, weather-resistant.", null, ["Weather-resistant", "Sharp lens"]),
  cam("cam-olympus-trip-35", "Olympus Trip 35", "olympus-trip-35", "cb-olympus", ["35mm"], "viewfinder", 1967, 1984, "Zone-focus viewfinder with selenium meter. 40mm f/2.8.", null, ["Zone focus", "No battery"]),
  cam("cam-olympus-35rc", "Olympus 35 RC", "olympus-35rc", "cb-olympus", ["35mm"], "rangefinder", 1970, 1974, "Compact rangefinder with 42mm f/2.8.", null, ["Coupled rangefinder"]),
  cam("cam-olympus-om-10", "Olympus OM-10", "olympus-om-10", "cb-olympus", ["35mm"], "slr", 1979, 1987, "Entry-level aperture-priority OM. Manual adapter available.", "Olympus OM", ["Aperture priority"]),

  // Minolta
  cam("cam-minolta-x-700", "Minolta X-700", "minolta-x-700", "cb-minolta", ["35mm"], "slr", 1981, 1999, "Program, aperture priority, and manual. TTL flash.", "Minolta MD", ["Program mode", "TTL flash"]),
  cam("cam-minolta-xd7", "Minolta XD-7", "minolta-xd7", "cb-minolta", ["35mm"], "slr", 1977, 1984, "XD-11 in US. Shutter and aperture priority.", "Minolta MD", ["Dual priority", "Compact"]),
  cam("cam-minolta-srt-101", "Minolta SRT 101", "minolta-srt-101", "cb-minolta", ["35mm"], "slr", 1966, 1975, "Full-aperture metering mechanical SLR.", "Minolta SR", ["CLC metering", "Mechanical"]),
  cam("cam-minolta-autocord", "Minolta Autocord", "minolta-autocord", "cb-minolta", ["120"], "tlr", 1955, 1966, "Rokkor lens TLR. Often compared to Rolleicord.", null, ["Rokkor lens", "120 rollfilm"]),
  cam("cam-minolta-himatic-7s", "Minolta Hi-Matic 7s", "minolta-himatic-7s", "cb-minolta", ["35mm"], "rangefinder", 1966, 1969, "Fixed-lens rangefinder with 45mm f/1.8.", null, ["Coupled rangefinder", "CdS meter"]),
  cam("cam-minolta-cle", "Minolta CLE", "minolta-cle", "cb-minolta", ["35mm"], "rangefinder", 1980, 1982, "Leica M-mount compact with AE. 28/40/90 framelines.", "Leica M", ["M-mount", "Aperture priority"]),
  cam("cam-minolta-alpha-9", "Minolta Alpha 9", "minolta-alpha-9", "cb-minolta", ["35mm"], "slr", 1998, 2006, "Flagship Minolta AF SLR. 1/12000s, 5.5 fps.", "Minolta A", ["Autofocus", "1/12000s"]),

  // Leica
  cam("cam-leica-m3", "Leica M3", "leica-m3", "cb-leica", ["35mm"], "rangefinder", 1954, 1966, "The definitive M. 0.92x finder, 50/90/135 framelines.", "Leica M", ["Interchangeable lens", "Rangefinder"]),
  cam("cam-leica-m6", "Leica M6", "leica-m6", "cb-leica", ["35mm"], "rangefinder", 1984, 2002, "M3 ergonomics with TTL meter. Beloved by photojournalists.", "Leica M", ["TTL metering", "Rangefinder"]),
  cam("cam-leica-m4-p", "Leica M4-P", "leica-m4-p", "cb-leica", ["35mm"], "rangefinder", 1980, 1986, "28/35/50/75/90/135 framelines. Canadian-built.", "Leica M", ["28mm framelines", "Rangefinder"]),
  cam("cam-leica-m7", "Leica M7", "leica-m7", "cb-leica", ["35mm"], "rangefinder", 2002, 2018, "Electronic shutter with aperture priority. DX coding.", "Leica M", ["Aperture priority", "Electronic shutter"]),
  cam("cam-leica-m2", "Leica M2", "leica-m2", "cb-leica", ["35mm"], "rangefinder", 1958, 1967, "Simpler M with 35/50/90 framelines. Lower magnification.", "Leica M", ["Rangefinder", "Compact"]),
  cam("cam-leica-r4", "Leica R4", "leica-r4", "cb-leica", ["35mm"], "slr", 1980, 1987, "Leica SLR with program and spot metering.", "Leica R", ["Program", "Spot meter"]),
  cam("cam-leica-cl", "Leica CL", "leica-cl", "cb-leica", ["35mm"], "rangefinder", 1973, 1976, "Compact M-mount by Minolta. 40/50/90 framelines.", "Leica M", ["Compact", "M-mount"]),

  // Hasselblad
  cam("cam-hasselblad-500c", "Hasselblad 500C", "hasselblad-500c", "cb-hasselblad", ["120"], "medium_format_slr", 1957, 1970, "First Hasselblad with Synchro-Compur shutter in lenses.", "Hasselblad C", ["120", "Interchangeable lens"]),
  cam("cam-hasselblad-500cm", "Hasselblad 500C/M", "hasselblad-500cm", "cb-hasselblad", ["120"], "medium_format_slr", 1970, 1994, "Gliding mirror for non-C lenses. System 500 standard.", "Hasselblad C", ["120", "Interchangeable back"]),
  cam("cam-hasselblad-501c", "Hasselblad 501C", "hasselblad-501c", "cb-hasselblad", ["120"], "medium_format_slr", 1994, 2005, "Updated 500C/M with improved winding.", "Hasselblad C", ["120", "C lens"]),
  cam("cam-hasselblad-503cw", "Hasselblad 503CW", "hasselblad-503cw", "cb-hasselblad", ["120"], "medium_format_slr", 1996, 2013, "Built-in winder coupling and flash sync. 500 classic.", "Hasselblad C", ["120", "Winder"]),
  cam("cam-hasselblad-2000fc", "Hasselblad 2000FC", "hasselblad-2000fc", "cb-hasselblad", ["120"], "medium_format_slr", 1977, 1984, "Focal-plane shutter for F lenses. 1/2000s.", "Hasselblad F", ["Focal-plane shutter", "F lens"]),
  cam("cam-hasselblad-swc", "Hasselblad SWC", "hasselblad-swc", "cb-hasselblad", ["120"], "medium_format_rangefinder", 1954, 1989, "Fixed 38mm Biogon. Wide-angle medium format.", "Hasselblad C", ["Fixed lens", "38mm"]),

  // Mamiya
  cam("cam-mamiya-rb67", "Mamiya RB67", "mamiya-rb67", "cb-mamiya", ["120"], "medium_format_slr", 1970, 1990, "Revolving back 6x7. Bellows focus, heavy.", "Mamiya RB", ["Revolving back", "Bellows"]),
  cam("cam-mamiya-rz67", "Mamiya RZ67", "mamiya-rz67", "cb-mamiya", ["120"], "medium_format_slr", 1982, 2014, "Electronic RB67 successor. RZ lenses.", "Mamiya RZ", ["Electronic", "Revolving back"]),
  cam("cam-mamiya-7", "Mamiya 7", "mamiya-7", "cb-mamiya", ["120"], "medium_format_rangefinder", 1995, 2014, "6x7 rangefinder with interchangeable lenses.", "Mamiya 7", ["Rangefinder", "6x7"]),
  cam("cam-mamiya-7ii", "Mamiya 7 II", "mamiya-7ii", "cb-mamiya", ["120"], "medium_format_rangefinder", 1999, 2014, "Mamiya 7 with multiple exposure and improved finder.", "Mamiya 7", ["Rangefinder", "6x7"]),
  cam("cam-mamiya-645", "Mamiya 645", "mamiya-645", "cb-mamiya", ["120"], "medium_format_slr", 1975, 1985, "6x4.5 SLR system. 645 Pro later.", "Mamiya 645", ["120", "Interchangeable back"]),
  cam("cam-mamiya-c330", "Mamiya C330", "mamiya-c330", "cb-mamiya", ["120"], "tlr", 1969, 1994, "TLR with interchangeable lenses and bellows.", "Mamiya C", ["Interchangeable lens TLR", "Bellows"]),
  cam("cam-mamiya-c220", "Mamiya C220", "mamiya-c220", "cb-mamiya", ["120"], "tlr", 1968, 1982, "Lighter C330 with same lens system.", "Mamiya C", ["Interchangeable lens TLR"]),

  // Rollei
  cam("cam-rollei-28f", "Rolleiflex 2.8F", "rollei-28f", "cb-rollei", ["120"], "tlr", 1960, 1981, "Planar 80mm f/2.8. Metered, legendary TLR.", null, ["Planar", "Metered"]),
  cam("cam-rollei-35f", "Rolleiflex 3.5F", "rollei-rolleiflex-35f", "cb-rollei", ["120"], "tlr", 1958, 1976, "Xenotar or Planar 75mm f/3.5. Slightly smaller than 2.8.", null, ["TLR", "120"]),
  cam("cam-rollei-35", "Rollei 35", "rollei-35", "cb-rollei", ["35mm"], "point_and_shoot", 1966, 1974, "Tiny zone-focus 35mm. Tessar 40mm f/3.5.", null, ["Zone focus", "Compact"]),
  cam("cam-rollei-35s", "Rollei 35 S", "rollei-35s", "cb-rollei", ["35mm"], "point_and_shoot", 1974, 1980, "Rollei 35 with Sonar 40mm f/2.8.", null, ["Zone focus", "Sonar"]),
  cam("cam-rollei-rolleicord", "Rolleicord V", "rollei-rolleicord-v", "cb-rollei", ["120"], "tlr", 1955, 1976, "Economy Rolleiflex. Xenar 75mm f/3.5.", null, ["TLR", "120"]),
  cam("cam-rollei-sl35", "Rolleiflex SL35", "rollei-sl35", "cb-rollei", ["35mm"], "slr", 1970, 1976, "Rollei 35mm SLR. QBM mount.", "Rollei QBM", ["SLR", "QBM"]),

  // Fuji
  cam("cam-fuji-gw690", "Fujifilm GW690 III", "fuji-gw690-iii", "cb-fuji", ["120"], "medium_format_rangefinder", 1992, 2002, "Texas Leica. Fixed 90mm f/3.5, 6x9.", null, ["Fixed lens", "6x9"]),
  cam("cam-fuji-ga645", "Fujifilm GA645", "fuji-ga645", "cb-fuji", ["120"], "medium_format_rangefinder", 1995, 2003, "Autofocus 6x4.5. 60mm f/4.", null, ["Autofocus", "6x4.5"]),
  cam("cam-fuji-gs645", "Fujifilm GS645", "fuji-gs645", "cb-fuji", ["120"], "medium_format_rangefinder", 1984, 1988, "Folding 6x4.5 rangefinder. 75mm f/3.4.", null, ["Folding", "Rangefinder"]),
  cam("cam-fuji-gf670", "Fujifilm GF670", "fuji-gf670", "cb-fuji", ["120"], "medium_format_rangefinder", 2008, 2014, "Folding 6x6/6x7. EBC 80mm f/3.5.", null, ["Folding", "6x6/6x7"]),
  cam("cam-fuji-gs645s", "Fujifilm GS645S", "fuji-gs645s", "cb-fuji", ["120"], "medium_format_rangefinder", 1985, 1988, "Wide 60mm f/4. Fixed lens 6x4.5.", null, ["60mm", "6x4.5"]),
  cam("cam-fuji-dl-200", "Fujifilm DL-200", "fuji-dl-200", "cb-fuji", ["35mm"], "point_and_shoot", 1988, 1992, "Compact point and shoot. 35mm f/3.5.", null, ["Point and shoot"]),

  // Contax
  cam("cam-contax-t2", "Contax T2", "contax-t2", "cb-contax", ["35mm"], "point_and_shoot", 1990, 2005, "Premium compact. Zeiss Sonnar 38mm f/2.8, titanium.", null, ["Zeiss Sonnar", "Titanium"]),
  cam("cam-contax-t3", "Contax T3", "contax-t3", "cb-contax", ["35mm"], "point_and_shoot", 2001, 2005, "Smaller T2 successor. Sonnar 35mm f/2.8.", null, ["Zeiss Sonnar", "Compact"]),
  cam("cam-contax-g1", "Contax G1", "contax-g1", "cb-contax", ["35mm"], "rangefinder", 1994, 2001, "Autofocus rangefinder. G-mount Zeiss lenses.", "Contax G", ["Autofocus", "Rangefinder"]),
  cam("cam-contax-g2", "Contax G2", "contax-g2", "cb-contax", ["35mm"], "rangefinder", 1996, 2005, "Faster AF and manual focus override. G system.", "Contax G", ["Autofocus", "Rangefinder"]),
  cam("cam-contax-645", "Contax 645", "contax-645", "cb-contax", ["120"], "medium_format_slr", 1999, 2005, "Autofocus 6x4.5. Zeiss AF lenses.", "Contax 645", ["Autofocus", "6x4.5"]),
  cam("cam-contax-rts", "Contax RTS", "contax-rts", "cb-contax", ["35mm"], "slr", 1975, 1982, "First Contax/Yashica SLR. Zeiss lenses.", "Contax/Yashica", ["Zeiss", "SLR"]),

  // Yashica
  cam("cam-yashica-mat-124g", "Yashica Mat-124G", "yashica-mat-124g", "cb-yashica", ["120"], "tlr", 1970, 1986, "TLR with Yashinon 80mm f/3.5 and built-in meter.", null, ["TLR", "Metered"]),
  cam("cam-yashica-electro-35", "Yashica Electro 35", "yashica-electro-35", "cb-yashica", ["35mm"], "rangefinder", 1966, 1972, "Fixed-lens rangefinder. 45mm f/1.7, aperture priority.", null, ["Rangefinder", "Aperture priority"]),
  cam("cam-yashica-fr", "Yashica FR", "yashica-fr", "cb-yashica", ["35mm"], "slr", 1975, 1979, "Contax/Yashica mount SLR with electronic shutter.", "Contax/Yashica", ["C/Y mount", "Electronic"]),
  cam("cam-yashica-lynx-14", "Yashica Lynx 14", "yashica-lynx-14", "cb-yashica", ["35mm"], "rangefinder", 1965, 1968, "Fixed 45mm f/1.4. Coupled rangefinder.", null, ["Rangefinder", "f/1.4"]),

  // Konica
  cam("cam-konica-hexar-af", "Konica Hexar AF", "konica-hexar-af", "cb-konica", ["35mm"], "point_and_shoot", 1993, 2003, "Silent mode, 35mm f/2. Premium compact.", null, ["Silent mode", "35mm f/2"]),
  cam("cam-konica-auto-s3", "Konica Auto S3", "konica-auto-s3", "cb-konica", ["35mm"], "rangefinder", 1965, 1968, "Hexanon 38mm f/1.8. Coupled rangefinder.", null, ["Rangefinder", "CdS meter"]),
  cam("cam-konica-hexar-rf", "Konica Hexar RF", "konica-hexar-rf", "cb-konica", ["35mm"], "rangefinder", 1999, 2003, "Leica M-mount with AE and 1/4000s.", "Leica M", ["M-mount", "Aperture priority"]),
  cam("cam-konica-t3", "Konica T3", "konica-t3", "cb-konica", ["35mm"], "slr", 1973, 1975, "Hexanon AR mount. Shutter-priority auto.", "Konica AR", ["Shutter priority", "AR mount"]),
  cam("cam-konica-c35", "Konica C35", "konica-c35", "cb-konica", ["35mm"], "viewfinder", 1968, 1972, "Compact viewfinder. Hexanon 38mm f/2.8.", null, ["Viewfinder", "Compact"]),

  // Ricoh
  cam("cam-ricoh-gr1", "Ricoh GR1", "ricoh-gr1", "cb-ricoh", ["35mm"], "point_and_shoot", 1996, 2001, "28mm f/2.8 compact. Snapshot king.", null, ["28mm", "Compact"]),
  cam("cam-ricoh-gr1s", "Ricoh GR1s", "ricoh-gr1s", "cb-ricoh", ["35mm"], "point_and_shoot", 1997, 2002, "GR1 with improved lens coating.", null, ["28mm", "Compact"]),
  cam("cam-ricoh-gr21", "Ricoh GR21", "ricoh-gr21", "cb-ricoh", ["35mm"], "point_and_shoot", 1999, 2001, "21mm f/3.5 ultra-wide compact.", null, ["21mm", "Ultra-wide"]),
  cam("cam-ricoh-500g", "Ricoh 500G", "ricoh-500g", "cb-ricoh", ["35mm"], "rangefinder", 1977, 1980, "Fixed 40mm f/2.7. Coupled rangefinder.", null, ["Rangefinder"]),

  // Zeiss
  cam("cam-zeiss-ikon-contessa", "Zeiss Ikon Contessa", "zeiss-ikon-contessa", "cb-zeiss", ["35mm"], "folding", 1953, 1958, "Folding 35mm with Tessar 45mm f/2.8.", null, ["Folding", "Tessar"]),
  cam("cam-zeiss-ikon-ikoflex", "Zeiss Ikon Ikoflex IIa", "zeiss-ikon-ikoflex-iia", "cb-zeiss", ["120"], "tlr", 1956, 1960, "Tessar 75mm f/3.5 TLR.", null, ["TLR", "Tessar"]),
  cam("cam-zeiss-super-ikonta", "Zeiss Super Ikonta 531", "zeiss-super-ikonta-531", "cb-zeiss", ["120"], "folding", 1936, 1955, "Folding 6x6 with coupled rangefinder.", null, ["Folding", "Rangefinder"]),

  // Polaroid
  cam("cam-polaroid-sx-70", "Polaroid SX-70", "polaroid-sx-70", "cb-polaroid", ["instant"], "instant", 1972, 1981, "Folding SLR instant. Land camera.", null, ["Instant", "SLR"]),
  cam("cam-polaroid-600", "Polaroid 600", "polaroid-600", "cb-polaroid", ["instant"], "instant", 1981, 2008, "600 film box camera. Integral film.", null, ["Instant", "600 film"]),
  cam("cam-polaroid-spectra", "Polaroid Spectra", "polaroid-spectra", "cb-polaroid", ["instant"], "instant", 1986, 2008, "Wide-format integral instant.", null, ["Instant", "Wide format"]),
  cam("cam-polaroid-land-250", "Polaroid Land 250", "polaroid-land-250", "cb-polaroid", ["instant"], "instant", 1967, 1972, "Pack film folding camera.", null, ["Instant", "Pack film"]),

  // Lomography
  cam("cam-lomo-lca", "Lomography LC-A", "lomography-lca", "cb-lomography", ["35mm"], "point_and_shoot", 1991, 2005, "Russian compact. Vignetting and saturation.", null, ["Creative", "Compact"]),
  cam("cam-lomo-lca-plus", "Lomography LCA+", "lomography-lca-plus", "cb-lomography", ["35mm"], "point_and_shoot", 2007, null, "Reissue with multiple exposure and cable release.", null, ["Creative", "Multi-exposure"]),
  cam("cam-lomo-diana-f", "Lomography Diana F+", "lomography-diana-f-plus", "cb-lomography", ["120"], "toy", 2007, null, "Plastic 120 camera. Pinhole and multiple formats.", null, ["Toy", "120"]),
  cam("cam-lomo-holga-120", "Lomography Holga 120", "lomography-holga-120", "cb-lomography", ["120"], "toy", 1982, null, "Plastic 120. Light leaks and soft focus.", null, ["Toy", "120"]),

  // Holga (separate brand)
  cam("cam-holga-120n", "Holga 120N", "holga-120n", "cb-holga", ["120"], "toy", 2001, null, "Plastic 6x6/6x4.5. Iconic lo-fi.", null, ["Toy", "120"]),
  cam("cam-holga-135", "Holga 135", "holga-135", "cb-holga", ["35mm"], "toy", 2009, null, "35mm Holga. Same plastic aesthetic.", null, ["Toy", "35mm"]),

  // Kodak
  cam("cam-kodak-retina-iiic", "Kodak Retina IIIC", "kodak-retina-iiic", "cb-kodak", ["35mm"], "rangefinder", 1954, 1960, "Folding 35mm with Schneider Xenon 50mm f/2.", null, ["Folding", "Rangefinder"]),
  cam("cam-kodak-pony-135", "Kodak Pony 135", "kodak-pony-135", "cb-kodak", ["35mm"], "viewfinder", 1949, 1959, "Simple viewfinder 35mm. Kodak Anastar lens.", null, ["Viewfinder"]),
  cam("cam-kodak-signet-35", "Kodak Signet 35", "kodak-signet-35", "cb-kodak", ["35mm"], "rangefinder", 1951, 1958, "Rangefinder with Ektar 44mm f/3.5.", null, ["Rangefinder"]),

  // Voigtländer
  cam("cam-voigtlander-bessa-r", "Voigtländer Bessa R", "voigtlander-bessa-r", "cb-voigtlander", ["35mm"], "rangefinder", 2000, 2004, "LTM mount. Coupled rangefinder, meter.", "Leica LTM", ["LTM", "Rangefinder"]),
  cam("cam-voigtlander-bessa-r2", "Voigtländer Bessa R2", "voigtlander-bessa-r2", "cb-voigtlander", ["35mm"], "rangefinder", 2002, 2005, "M-mount Bessa. 35/50/75/90 framelines.", "Leica M", ["M-mount", "Rangefinder"]),
  cam("cam-voigtlander-bessa-l", "Voigtländer Bessa L", "voigtlander-bessa-l", "cb-voigtlander", ["35mm"], "viewfinder", 1999, 2004, "LTM body without rangefinder. Use with accessory finder.", "Leica LTM", ["LTM", "Viewfinder"]),
  cam("cam-voigtlander-vito-ii", "Voigtländer Vito II", "voigtlander-vito-ii", "cb-voigtlander", ["35mm"], "viewfinder", 1949, 1955, "Compact viewfinder. Color-Skopar 50mm f/3.5.", null, ["Viewfinder", "Folding"]),

  // Bronica
  cam("cam-bronica-sqa", "Bronica SQ-A", "bronica-sqa", "cb-bronica", ["120"], "medium_format_slr", 1980, 1990, "6x6 SLR with interchangeable back. Zenzanon lenses.", "Bronica SQ", ["6x6", "Interchangeable back"]),
  cam("cam-bronica-etrsi", "Bronica ETR-Si", "bronica-etrsi", "cb-bronica", ["120"], "medium_format_slr", 1989, 2005, "6x4.5 SLR. AE finder, speed grip.", "Bronica ETR", ["6x4.5", "AE finder"]),
  cam("cam-bronica-gs-1", "Bronica GS-1", "bronica-gs-1", "cb-bronica", ["120"], "medium_format_slr", 1983, 2002, "6x7 SLR. Interchangeable back and finder.", "Bronica GS", ["6x7", "Interchangeable back"]),

  // Kiev / Soviet
  cam("cam-kiev-4", "Kiev 4", "kiev-4", "cb-kiev", ["35mm"], "rangefinder", 1957, 1985, "Contax II copy. Jupiter-8 50mm f/2.", "Contax/Kiev", ["Rangefinder", "Interchangeable lens"]),
  cam("cam-kiev-88", "Kiev 88", "kiev-88", "cb-kiev", ["120"], "medium_format_slr", 1986, 2009, "Hasselblad 1600F copy. 6x6.", "Kiev 88", ["6x6", "Interchangeable lens"]),
  cam("cam-zorki-4", "Zorki 4", "zorki-4", "cb-zorki", ["35mm"], "rangefinder", 1956, 1973, "Leica II copy. M39 mount.", "M39", ["Rangefinder", "M39"]),
  cam("cam-zorki-6", "Zorki 6", "zorki-6", "cb-zorki", ["35mm"], "rangefinder", 1959, 1966, "Zorki 4 with rapid wind lever.", "M39", ["Rangefinder", "M39"]),
  cam("cam-fed-2", "FED 2", "fed-2", "cb-fed", ["35mm"], "rangefinder", 1955, 1970, "Soviet Leica-style. Industar 26m 50mm f/2.8.", "M39", ["Rangefinder", "M39"]),
  cam("cam-fed-5", "FED 5", "fed-5", "cb-fed", ["35mm"], "rangefinder", 1977, 1990, "FED with built-in meter.", "M39", ["Rangefinder", "Metered"]),
  cam("cam-zenit-e", "Zenit E", "zenit-e", "cb-zenit", ["35mm"], "slr", 1965, 1982, "M39 screw mount SLR. Helios 44-2.", "M39", ["SLR", "M39"]),
  cam("cam-zenit-12", "Zenit 12", "zenit-12", "cb-zenit", ["35mm"], "slr", 1982, 1990, "M42 mount SLR. Built-in meter.", "M42", ["SLR", "M42"]),

  // Argus
  cam("cam-argus-c3", "Argus C3", "argus-c3", "cb-argus", ["35mm"], "rangefinder", 1939, 1966, "Brick. American rangefinder. Cintar 50mm f/3.5.", null, ["Rangefinder", "American"]),
  cam("cam-argus-c44", "Argus C44", "argus-c44", "cb-argus", ["35mm"], "rangefinder", 1956, 1958, "Interchangeable lens C3 successor.", "Argus C", ["Rangefinder", "Interchangeable"]),

  // Agfa
  cam("cam-agfa-optima-335", "Agfa Optima 335", "agfa-optima-335", "cb-agfa", ["35mm"], "viewfinder", 1959, 1963, "Sensor-controlled exposure. Solinar 50mm f/2.8.", null, ["Sensor", "Viewfinder"]),
  cam("cam-agfa-isolette", "Agfa Isolette", "agfa-isolette", "cb-agfa", ["120"], "folding", 1938, 1950, "Folding 6x6. Apotar or Solinar.", null, ["Folding", "6x6"]),

  // Large format
  cam("cam-sinar-f2", "Sinar F2", "sinar-f2", "cb-sinar", ["4x5", "8x10"], "large_format", 1981, 1994, "Modular monorail view camera.", null, ["Monorail", "4x5"]),
  cam("cam-toyo-field-45a", "Toyo Field 45A", "toyo-field-45a", "cb-toyo", ["4x5"], "large_format", 1986, 2006, "Metal field camera 4x5.", null, ["Field", "4x5"]),
  cam("cam-toyo-view-45g", "Toyo View 45G", "toyo-view-45g", "cb-toyo", ["4x5"], "large_format", 1990, 2005, "Monorail 4x5. Graflok back.", null, ["Monorail", "4x5"]),

  // Superheadz / toy
  cam("cam-superheadz-black-bird-fly", "Superheadz Black Bird Fly", "superheadz-black-bird-fly", "cb-superheadz", ["120"], "toy", 2005, null, "Twin-lens toy 120. 6x6.", null, ["Toy", "120"]),
  cam("cam-superheadz-wide-and-slim", "Superheadz Wide and Slim", "superheadz-wide-and-slim", "cb-superheadz", ["35mm"], "toy", 2000, null, "22mm plastic lens. Panoramic crop.", null, ["Toy", "35mm"]),
];
