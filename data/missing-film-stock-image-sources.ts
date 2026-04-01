export type ImageSourceType = "official" | "retailer" | "secondary";

export interface MissingFilmStockImageSource {
  slug: string;
  name: string;
  sourcePageUrl: string;
  sourceType: ImageSourceType;
  note: string;
}

export const missingFilmStockImageSources: MissingFilmStockImageSource[] = [
  { slug: "adox-chs-25-ii", name: "ADOX CHS 25 II", sourcePageUrl: "https://filmphotography.eu/en/adox-chs-25/", sourceType: "secondary", note: "Strongest film-specific page found." },
  { slug: "adox-scala-50", name: "ADOX SCALA 50", sourcePageUrl: "http://fotoimpex.com/films/adox-scala-50-bw-13536.html", sourceType: "retailer", note: "Fotoimpex product page." },
  { slug: "adox-scala-160", name: "ADOX SCALA 160", sourcePageUrl: "https://www.fotoimpex.com/films/adox-scala-160-bw-13536.html", sourceType: "retailer", note: "Fotoimpex product page." },
  { slug: "agfa-apx-25", name: "Agfa APX 25", sourcePageUrl: "https://buymorefilm.com/products/agfa-agfapan-apx-25-pro-35mm-film", sourceType: "retailer", note: "Expired-stock retailer page." },
  { slug: "agfa-scala-200x", name: "Agfa Scala 200x", sourcePageUrl: "https://buymorefilm.com/products/agfa-scala-200x-professional-vario-speed-100-1600-120-film", sourceType: "retailer", note: "Expired-stock retailer page." },
  { slug: "agfa-vista-plus-100", name: "AgfaPhoto Vista Plus 100", sourcePageUrl: "https://filmphotography.eu/en/agfaphoto-vista-plus-100/", sourceType: "secondary", note: "Best film-specific legacy page found." },
  { slug: "agfa-vista-plus-400", name: "AgfaPhoto Vista Plus 400", sourcePageUrl: "https://filmphotography.eu/en/agfaphoto-vista-plus-400/", sourceType: "secondary", note: "Accessible archival product page with visible box art." },
  { slug: "ferrania-ortho", name: "Ferrania Orto", sourcePageUrl: "https://cinestillfilm.com/products/orto-50black-and-white-negative-film-35mm", sourceType: "retailer", note: "Retailer product page with current box art." },
  { slug: "ferrania-solaris-fg-plus-100", name: "Ferrania Solaris FG Plus 100", sourcePageUrl: "https://filmphotography.eu/en/ferrania-solaris-fg-plus-100/", sourceType: "secondary", note: "Accessible archival product page with visible box art." },
  { slug: "ferrania-solaris-fg-plus-200", name: "Ferrania Solaris FG Plus 200", sourcePageUrl: "https://filmphotography.eu/en/ferrania-solaris-fg-plus-200/", sourceType: "secondary", note: "Accessible archival product page with visible box art." },
  { slug: "ferrania-solaris-fg-plus-400", name: "Ferrania Solaris FG Plus 400", sourcePageUrl: "https://buymorefilm.com/products/ferrania-solaris-400-135mm", sourceType: "retailer", note: "Expired-stock retailer page with visible box art." },
  { slug: "fujifilm-astia-100f", name: "Fujichrome Astia 100F", sourcePageUrl: "https://www.fujifilm.com.hk/products/professional_films/color_reversalfilms/astia_100f/", sourceType: "official", note: "Official Fujifilm Hong Kong page." },
  { slug: "fujifilm-fujicolor-100", name: "Fujicolor 100", sourcePageUrl: "https://www.fujifilm.com.hk/products/consumer_film/color_negativefilms_35mm/100/index.html", sourceType: "official", note: "Official Fujifilm Hong Kong page." },
  { slug: "fujifilm-neopan-400", name: "Neopan 400", sourcePageUrl: "https://buymorefilm.com/products/fuji-neopan-400-pro-135", sourceType: "retailer", note: "Accessible expired-stock retailer page." },
  { slug: "fujifilm-neopan-1600", name: "Neopan 1600", sourcePageUrl: "https://buymorefilm.com/products/fuji-neopan-1600-pro-135-film", sourceType: "retailer", note: "Accessible expired-stock retailer page." },
  { slug: "fujifilm-pro-160ns", name: "Fujicolor Pro 160NS", sourcePageUrl: "https://analoguewonderland.co.uk/products/fujifilm-pro-160-ns-120-film", sourceType: "retailer", note: "Retailer page for exact stock." },
  { slug: "fujifilm-pro-400", name: "Fujicolor Pro 400", sourcePageUrl: "https://www.fujifilm.com.hk/products/professional_films/color_negativefilms/pro_400h/", sourceType: "official", note: "Closest official match surfaced was Pro 400H." },
  { slug: "fujifilm-pro-800z", name: "Fujicolor Pro 800Z", sourcePageUrl: "https://www.fujifilm.com.hk/products/professional_films/color_negativefilms/pro_800z/", sourceType: "official", note: "Official Fujifilm Hong Kong page." },
  { slug: "fujifilm-provia-400x", name: "Provia 400X", sourcePageUrl: "https://www.fujifilm.com.hk/products/professional_films/color_reversalfilms/provia_400x/", sourceType: "official", note: "Official Fujifilm Hong Kong page." },
  { slug: "fujifilm-reala-ace-100", name: "Reala Ace 100", sourcePageUrl: "https://www.japanexposures.com/shop/film-analog/reala-ace-120-5-pack.html", sourceType: "retailer", note: "Retailer listing with pack image." },
  { slug: "fujifilm-superia-200", name: "Superia 200", sourcePageUrl: "https://www.fujifilm.com.hk/products/consumer_film/color_negativefilms_35mm/superia_200/", sourceType: "official", note: "Official Fujifilm Hong Kong page." },
  { slug: "fujifilm-superia-800", name: "Superia 800", sourcePageUrl: "https://www.fujifilm.com.hk/m/products/consumer_film/color_negativefilms_35mm/superia_xtra800/", sourceType: "official", note: "Official Fujifilm Hong Kong mobile page." },
  { slug: "fujifilm-superia-reala-100", name: "Superia Reala 100", sourcePageUrl: "https://www.fujifilm.com.hk/products/consumer_film/color_negativefilms_35mm/superia_reala/index.html", sourceType: "official", note: "Official Fujifilm Hong Kong page." },
  { slug: "fujifilm-velvia-100f", name: "Velvia 100F", sourcePageUrl: "https://www.fujifilm.com.hk/products/professional_films/color_reversalfilms/velvia_100f/", sourceType: "official", note: "Official Fujifilm Hong Kong page." },
  { slug: "kentmere-pan-200", name: "Kentmere Pan 200", sourcePageUrl: "https://www.ilfordphoto.com/kentmere-200-35mm", sourceType: "official", note: "Official Ilford/Harman page." },
  { slug: "kodak-bw400cn", name: "Kodak BW400CN", sourcePageUrl: "https://buymorefilm.com/products/kodak-bw400cn-35mm-film", sourceType: "retailer", note: "Accessible expired-stock retailer page." },
  { slug: "kodak-ektachrome-e100g", name: "Kodak Ektachrome E100G", sourcePageUrl: "https://buymorefilm.com/products/kodak-ektachrome-e100-g-pro-35mm-film", sourceType: "retailer", note: "Accessible retailer page with visible box art." },
  { slug: "kodak-ektachrome-e100vs", name: "Kodak Ektachrome E100VS", sourcePageUrl: "https://buymorefilm.com/products/kodak-ektachrome-e100vs-pro-35mm", sourceType: "retailer", note: "Accessible expired-stock retailer page." },
  { slug: "kodak-kodachrome-25", name: "Kodachrome 25", sourcePageUrl: "https://buymorefilm.com/products/kodak-kodachrome-25-v1-collectable", sourceType: "retailer", note: "Collectible stock page." },
  { slug: "kodak-kodachrome-64", name: "Kodachrome 64", sourcePageUrl: "https://buymorefilm.com/products/kodak-kodachrome-64-35mm", sourceType: "retailer", note: "Accessible expired-stock retailer page." },
  { slug: "kodak-kodachrome-200", name: "Kodachrome 200", sourcePageUrl: "https://berniesphotocenter.com/products/expired-kodak-kodachrome-200-slide-film", sourceType: "retailer", note: "Collectible retailer page with visible boxed stock." },
  { slug: "kodak-plus-x-pan-125", name: "Kodak Plus-X Pan 125", sourcePageUrl: "https://photofinity.nl/product/kodak-plus-x-pan-125/", sourceType: "retailer", note: "Accessible expired-stock retailer page." },
  { slug: "kodak-tri-x-professional-320", name: "Kodak Tri-X Professional 320", sourcePageUrl: "https://analoguewonderland.co.uk/products/kodak-tri-x-320-8x10-large-format-film-10-sheets", sourceType: "retailer", note: "Accessible sheet-film retailer page." },
  { slug: "kodak-vision3-50d", name: "Kodak Vision3 50D", sourcePageUrl: "https://www.kodak.com/en/motion/product/camera-films/50d-5203-7203/", sourceType: "official", note: "Official Kodak motion page." },
  { slug: "kodak-vision3-250d", name: "Kodak Vision3 250D", sourcePageUrl: "https://www.kodak.com/en/motion/product/camera-films/250d-5207-7207/", sourceType: "official", note: "Official Kodak motion page." },
  { slug: "kodak-vision3-500t", name: "Kodak Vision3 500T", sourcePageUrl: "https://www.kodak.com/en/motion/product/camera-films/500t-5219-7219/", sourceType: "official", note: "Official Kodak motion page." },
  { slug: "kosmo-foto-agent-shadow-400", name: "Kosmo Foto Agent Shadow 400", sourcePageUrl: "https://kosmofoto.com/product/kosmo-foto-agent-shadow-film/", sourceType: "official", note: "Official Kosmo Foto page." },
  { slug: "lomography-lomochrome-color-92", name: "LomoChrome Color '92", sourcePageUrl: "https://shop.lomography.com/us/film/lomochrome-color-92-35-mm-iso-400", sourceType: "official", note: "Official Lomography product page." },
  { slug: "lomography-lomochrome-color-92-sun-kissed", name: "LomoChrome Color '92 Sun-kissed", sourcePageUrl: "https://shop.lomography.com/us/lomochrome-color-92-sun-kissed-35-mm-iso-400", sourceType: "official", note: "Official Lomography product page." },
  { slug: "lomography-lomochrome-turquoise", name: "LomoChrome Turquoise XR 100-400", sourcePageUrl: "https://shop.lomography.com/us/2021-lomochrome-turquoise-35-mm-iso-100-400", sourceType: "official", note: "Official Lomography product page." },
  { slug: "lomography-redscale-xr", name: "Lomography Redscale XR 50-200", sourcePageUrl: "https://shop.lomography.com/us/lomography-redscale-xr-35-mm-iso-50-200", sourceType: "official", note: "Official Lomography product page." },
  { slug: "lucky-c200", name: "Lucky C200", sourcePageUrl: "https://dubblefilm.com/en-nl/products/lucky-color-c200", sourceType: "retailer", note: "Retailer page with current product imagery." },
  { slug: "lucky-shd-100", name: "Lucky SHD 100", sourcePageUrl: "https://analogueshop.com/products/lucky-shd-100-120mm", sourceType: "retailer", note: "Retailer page." },
  { slug: "lucky-shd-400", name: "Lucky SHD 400", sourcePageUrl: "https://analogueshop.com/products/lucky-shd-400", sourceType: "retailer", note: "Retailer page." },
  { slug: "orwo-un54", name: "ORWO UN54", sourcePageUrl: "https://www.orwo.shop/en-us/products/orwo-un54-35mm", sourceType: "official", note: "Official ORWO shop page." },
  { slug: "orwo-wolfen-nc400", name: "WOLFEN NC400", sourcePageUrl: "https://www.orwo.shop/products/wolfen-nc400-36exp", sourceType: "official", note: "Official ORWO shop page." },
  { slug: "rollei-atp-1-1", name: "Rollei ATP 1.1", sourcePageUrl: "https://filmphotography.eu/en/rollei-atp-1-1/", sourceType: "secondary", note: "Accessible archival product page with visible box art." },
  { slug: "rollei-crossbird-200", name: "Rollei Crossbird 200", sourcePageUrl: "https://www.rolleianalog.com/products/rollei-crossbird/?lang=en", sourceType: "official", note: "Official Rollei page." },
  { slug: "rollei-ortho-25-plus", name: "Rollei Ortho 25 Plus", sourcePageUrl: "https://www.rolleianalog.com/products/rollei-ortho-25-plus/?lang=en", sourceType: "official", note: "Official Rollei page." },
  { slug: "street-candy-atm-400", name: "Street Candy ATM 400", sourcePageUrl: "https://analoguewonderland.co.uk/products/street-candy-atm400-film-35mm-b-w-iso-400", sourceType: "retailer", note: "Accessible retailer page with visible product imagery." },
];
