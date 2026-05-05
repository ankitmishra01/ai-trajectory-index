// Maps our custom slugs to ISO 3166-1 alpha-3 codes used by IMF and OECD APIs
export const SLUG_TO_ISO3: Record<string, string> = {
  // Americas
  usa: "USA", canada: "CAN", mexico: "MEX", brazil: "BRA", argentina: "ARG",
  chile: "CHL", colombia: "COL", peru: "PER", venezuela: "VEN", ecuador: "ECU",
  bolivia: "BOL", paraguay: "PRY", uruguay: "URY", guatemala: "GTM", honduras: "HND",
  "el-salvador": "SLV", nicaragua: "NIC", "costa-rica": "CRI", panama: "PAN",
  cuba: "CUB", jamaica: "JAM", haiti: "HTI", "dominican-republic": "DOM",
  "trinidad-tobago": "TTO", barbados: "BRB", guyana: "GUY", suriname: "SUR",
  bahamas: "BHS", belize: "BLZ",

  // Europe
  uk: "GBR", germany: "DEU", france: "FRA", italy: "ITA", spain: "ESP",
  poland: "POL", netherlands: "NLD", belgium: "BEL", sweden: "SWE", norway: "NOR",
  denmark: "DNK", finland: "FIN", switzerland: "CHE", austria: "AUT", portugal: "PRT",
  ireland: "IRL", "czech-republic": "CZE", hungary: "HUN", romania: "ROU",
  greece: "GRC", ukraine: "UKR", russia: "RUS", turkey: "TUR", slovakia: "SVK",
  slovenia: "SVN", croatia: "HRV", serbia: "SRB", bulgaria: "BGR", belarus: "BLR",
  moldova: "MDA", albania: "ALB", "north-macedonia": "MKD", "bosnia-herzegovina": "BIH",
  kosovo: "XKX", montenegro: "MNE", luxembourg: "LUX", malta: "MLT", cyprus: "CYP",
  iceland: "ISL", estonia: "EST", latvia: "LVA", lithuania: "LTU", andorra: "AND",
  "san-marino": "SMR", liechtenstein: "LIE", monaco: "MCO",

  // Asia-Pacific
  china: "CHN", japan: "JPN", "south-korea": "KOR", india: "IND", australia: "AUS",
  "new-zealand": "NZL", singapore: "SGP", taiwan: "TWN", indonesia: "IDN",
  malaysia: "MYS", thailand: "THA", philippines: "PHL", vietnam: "VNM",
  pakistan: "PAK", bangladesh: "BGD", "sri-lanka": "LKA", myanmar: "MMR",
  cambodia: "KHM", laos: "LAO", mongolia: "MNG", nepal: "NPL", bhutan: "BTN",
  maldives: "MDV", afghanistan: "AFG", kazakhstan: "KAZ", uzbekistan: "UZB",
  turkmenistan: "TKM", kyrgyzstan: "KGZ", tajikistan: "TJK", azerbaijan: "AZE",
  armenia: "ARM", georgia: "GEO", "papua-new-guinea": "PNG", fiji: "FJI",
  "solomon-islands": "SLB", vanuatu: "VUT", samoa: "WSM", tonga: "TON",
  kiribati: "KIR", "marshall-islands": "MHL", palau: "PLW", nauru: "NRU",
  tuvalu: "TUV", "timor-leste": "TLS", brunei: "BRN", "north-korea": "PRK",

  // Middle East
  uae: "ARE", israel: "ISR", "saudi-arabia": "SAU", qatar: "QAT", kuwait: "KWT",
  bahrain: "BHR", oman: "OMN", jordan: "JOR", lebanon: "LBN", iraq: "IRQ",
  iran: "IRN", syria: "SYR", yemen: "YEM", palestine: "PSE",

  // North Africa
  egypt: "EGY", morocco: "MAR", tunisia: "TUN", algeria: "DZA", libya: "LBY",

  // Sub-Saharan Africa
  "south-africa": "ZAF", nigeria: "NGA", kenya: "KEN", ethiopia: "ETH", ghana: "GHA",
  rwanda: "RWA", tanzania: "TZA", uganda: "UGA", cameroon: "CMR", senegal: "SEN",
  "ivory-coast": "CIV", angola: "AGO", zimbabwe: "ZWE", zambia: "ZMB", namibia: "NAM",
  botswana: "BWA", mauritius: "MUS", seychelles: "SYC", "cape-verde": "CPV",
  benin: "BEN", togo: "TGO", "sierra-leone": "SLE", liberia: "LBR", gambia: "GMB",
  guinea: "GIN", "guinea-bissau": "GNB", gabon: "GAB", drc: "COD", chad: "TCD",
  sudan: "SDN", "south-sudan": "SSD", somalia: "SOM", eritrea: "ERI", djibouti: "DJI",
  comoros: "COM", madagascar: "MDG", malawi: "MWI", mali: "MLI", niger: "NER",
  "burkina-faso": "BFA", lesotho: "LSO", eswatini: "SWZ", mauritania: "MRT",
  burundi: "BDI", "central-african-republic": "CAF", "equatorial-guinea": "GNQ",
};

// Reverse mapping: ISO3 → slug
export const ISO3_TO_SLUG: Record<string, string> = Object.fromEntries(
  Object.entries(SLUG_TO_ISO3).map(([slug, iso3]) => [iso3, slug])
);
