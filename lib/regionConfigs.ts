// ── Region Deep-Dive Configuration ──────────────────────────────────────────
// Each config drives the shared RegionDeepDive component.

export interface RegionConfig {
  id: string;
  name: string;
  emoji: string;
  accentColor: string;
  accentRgb: string;
  tagline: string;
  description: string;
  /** Matches country.region from /api/scores. Array = multiple DB regions merged. */
  dataRegions: string[];
  /** Optional secondary filter on slugs (e.g., Africa vs Middle East from the same DB region). */
  slugAllowlist?: Set<string>;
  /** slug → sub-region label */
  subregions: Record<string, string>;
  subregionOrder: string[];
  subregionColors: Record<string, string>;
  opportunityLabel: string;
  opportunityDescription: string;
  /** Max total_score to qualify as an opportunity market */
  opportunityMaxScore: number;
}

// ── Americas ────────────────────────────────────────────────────────────────
export const AMERICAS: RegionConfig = {
  id: "americas",
  name: "Americas",
  emoji: "🌎",
  accentColor: "#f59e0b",
  accentRgb: "245,158,11",
  tagline: "From Silicon Valley to São Paulo",
  description:
    "The Americas spans the world's most advanced AI ecosystem (USA, Canada) down to rapidly digitising emerging markets across Latin America and the Caribbean. A continent of extremes — and massive opportunity.",
  dataRegions: ["Americas"],
  subregions: {
    // North America
    usa: "North America", canada: "North America", mexico: "North America",
    // Central America
    guatemala: "Central America", honduras: "Central America", "el-salvador": "Central America",
    nicaragua: "Central America", "costa-rica": "Central America", panama: "Central America",
    belize: "Central America",
    // Caribbean
    cuba: "Caribbean", "dominican-republic": "Caribbean", haiti: "Caribbean",
    jamaica: "Caribbean", "trinidad-and-tobago": "Caribbean", bahamas: "Caribbean",
    barbados: "Caribbean", "antigua-and-barbuda": "Caribbean", "saint-lucia": "Caribbean",
    grenada: "Caribbean", "saint-vincent-and-the-grenadines": "Caribbean",
    "saint-kitts-and-nevis": "Caribbean",
    // South America
    brazil: "South America", argentina: "South America", chile: "South America",
    colombia: "South America", peru: "South America", venezuela: "South America",
    ecuador: "South America", bolivia: "South America", paraguay: "South America",
    uruguay: "South America", guyana: "South America", suriname: "South America",
  },
  subregionOrder: ["North America", "South America", "Central America", "Caribbean"],
  subregionColors: {
    "North America": "#f59e0b",
    "South America": "#22c55e",
    "Central America": "#3b82f6",
    Caribbean: "#8b5cf6",
  },
  opportunityLabel: "High-Growth Emerging Markets",
  opportunityDescription: "Latin American and Caribbean countries with positive momentum and room to grow",
  opportunityMaxScore: 65,
};

// ── Europe ──────────────────────────────────────────────────────────────────
export const EUROPE: RegionConfig = {
  id: "europe",
  name: "Europe",
  emoji: "🌍",
  accentColor: "#3b82f6",
  accentRgb: "59,130,246",
  tagline: "Regulatory leadership meets deep research capability",
  description:
    "Europe leads on AI governance and research output while navigating the tension between regulation and innovation. Northern and Western Europe anchor the continent; Eastern Europe is closing the gap rapidly.",
  dataRegions: ["Europe"],
  subregions: {
    // Northern Europe
    sweden: "Northern Europe", norway: "Northern Europe", denmark: "Northern Europe",
    finland: "Northern Europe", iceland: "Northern Europe",
    estonia: "Northern Europe", latvia: "Northern Europe", lithuania: "Northern Europe",
    // Western Europe
    germany: "Western Europe", france: "Western Europe", "united-kingdom": "Western Europe",
    netherlands: "Western Europe", belgium: "Western Europe", austria: "Western Europe",
    switzerland: "Western Europe", luxembourg: "Western Europe", ireland: "Western Europe",
    // Southern Europe
    spain: "Southern Europe", italy: "Southern Europe", portugal: "Southern Europe",
    greece: "Southern Europe", cyprus: "Southern Europe", malta: "Southern Europe",
    // Eastern Europe
    poland: "Eastern Europe", "czech-republic": "Eastern Europe", hungary: "Eastern Europe",
    romania: "Eastern Europe", bulgaria: "Eastern Europe", croatia: "Eastern Europe",
    slovakia: "Eastern Europe", slovenia: "Eastern Europe", serbia: "Eastern Europe",
    ukraine: "Eastern Europe", belarus: "Eastern Europe", moldova: "Eastern Europe",
    "north-macedonia": "Eastern Europe", albania: "Eastern Europe",
    "bosnia-and-herzegovina": "Eastern Europe", montenegro: "Eastern Europe",
    kosovo: "Eastern Europe",
  },
  subregionOrder: ["Northern Europe", "Western Europe", "Southern Europe", "Eastern Europe"],
  subregionColors: {
    "Northern Europe": "#3b82f6",
    "Western Europe": "#8b5cf6",
    "Southern Europe": "#f59e0b",
    "Eastern Europe": "#06b6d4",
  },
  opportunityLabel: "Rising Eastern European Markets",
  opportunityDescription: "Eastern European nations with strong positive momentum and growing tech ecosystems",
  opportunityMaxScore: 72,
};

// ── Asia-Pacific ─────────────────────────────────────────────────────────────
export const ASIA_PACIFIC: RegionConfig = {
  id: "asia-pacific",
  name: "Asia-Pacific",
  emoji: "🌏",
  accentColor: "#22c55e",
  accentRgb: "34,197,94",
  tagline: "Where the next AI superpowers are being built",
  description:
    "Asia-Pacific is home to the most dynamic AI race outside the US — China and Singapore lead, India is surging, and Southeast Asia is becoming an AI manufacturing and services powerhouse.",
  dataRegions: ["Asia-Pacific"],
  subregions: {
    // East Asia
    china: "East Asia", japan: "East Asia", "south-korea": "East Asia",
    taiwan: "East Asia", mongolia: "East Asia",
    // Southeast Asia
    singapore: "Southeast Asia", malaysia: "Southeast Asia", thailand: "Southeast Asia",
    indonesia: "Southeast Asia", vietnam: "Southeast Asia", philippines: "Southeast Asia",
    myanmar: "Southeast Asia", cambodia: "Southeast Asia", laos: "Southeast Asia",
    brunei: "Southeast Asia", "timor-leste": "Southeast Asia",
    // South Asia
    india: "South Asia", pakistan: "South Asia", bangladesh: "South Asia",
    "sri-lanka": "South Asia", nepal: "South Asia", bhutan: "South Asia",
    maldives: "South Asia", afghanistan: "South Asia",
    // Oceania
    australia: "Oceania", "new-zealand": "Oceania", "papua-new-guinea": "Oceania",
    fiji: "Oceania", "solomon-islands": "Oceania", vanuatu: "Oceania",
    samoa: "Oceania", tonga: "Oceania",
    // Central Asia
    kazakhstan: "Central Asia", uzbekistan: "Central Asia",
    kyrgyzstan: "Central Asia", tajikistan: "Central Asia",
    turkmenistan: "Central Asia",
    // Caucasus (often grouped with Asia-Pacific in this dataset)
    georgia: "Central Asia", armenia: "Central Asia", azerbaijan: "Central Asia",
  },
  subregionOrder: ["East Asia", "Southeast Asia", "South Asia", "Oceania", "Central Asia"],
  subregionColors: {
    "East Asia": "#22c55e",
    "Southeast Asia": "#3b82f6",
    "South Asia": "#f59e0b",
    Oceania: "#8b5cf6",
    "Central Asia": "#06b6d4",
  },
  opportunityLabel: "Emerging AI Powerhouses",
  opportunityDescription: "Fast-rising Asian markets with strong momentum that are rapidly closing the gap with regional leaders",
  opportunityMaxScore: 70,
};

// ── Middle East ──────────────────────────────────────────────────────────────
// This is a sub-filter of the "Middle East & Africa" DB region
const MIDDLE_EAST_SLUGS = new Set([
  // Gulf Cooperation Council
  "saudi-arabia", "uae", "qatar", "kuwait", "bahrain", "oman",
  // Levant
  "israel", "jordan", "lebanon", "syria", "iraq", "palestine",
  // North Africa / MENA (non-sub-Saharan)
  "iran", "turkey", "yemen", "afghanistan",
]);

export const MIDDLE_EAST: RegionConfig = {
  id: "middle-east",
  name: "Middle East",
  emoji: "🕌",
  accentColor: "#f59e0b",
  accentRgb: "245,158,11",
  tagline: "Gulf states racing toward AI-powered economies",
  description:
    "The Gulf states are deploying sovereign AI strategies and massive capital, positioning the Middle East as a future hub for AI infrastructure. Saudi Arabia, UAE and Qatar lead regional government AI spending globally.",
  dataRegions: ["Middle East & Africa"],
  slugAllowlist: MIDDLE_EAST_SLUGS,
  subregions: {
    // Gulf
    "saudi-arabia": "Gulf (GCC)", uae: "Gulf (GCC)", qatar: "Gulf (GCC)",
    kuwait: "Gulf (GCC)", bahrain: "Gulf (GCC)", oman: "Gulf (GCC)",
    // Levant
    israel: "Levant", jordan: "Levant", lebanon: "Levant",
    syria: "Levant", iraq: "Levant", palestine: "Levant",
    // Greater Middle East
    iran: "Greater Middle East", turkey: "Greater Middle East",
    yemen: "Greater Middle East", afghanistan: "Greater Middle East",
  },
  subregionOrder: ["Gulf (GCC)", "Levant", "Greater Middle East"],
  subregionColors: {
    "Gulf (GCC)": "#f59e0b",
    Levant: "#3b82f6",
    "Greater Middle East": "#8b5cf6",
  },
  opportunityLabel: "Strategic AI Investment Markets",
  opportunityDescription: "Gulf and regional markets with high government AI commitment and growing digital infrastructure",
  opportunityMaxScore: 75,
};

// ── Africa ───────────────────────────────────────────────────────────────────
const AFRICA_SLUGS = new Set([
  "egypt", "morocco", "tunisia", "algeria", "libya", "sudan",
  "kenya", "ethiopia", "tanzania", "uganda", "rwanda", "mozambique",
  "madagascar", "somalia", "eritrea", "djibouti", "malawi", "zambia",
  "comoros", "burundi",
  "nigeria", "ghana", "senegal", "ivory-coast", "cameroon", "mali",
  "burkina-faso", "guinea", "benin", "togo", "sierra-leone", "liberia",
  "mauritania", "niger", "chad", "gambia", "guinea-bissau", "cape-verde",
  "south-africa", "zimbabwe", "angola", "namibia", "botswana", "eswatini",
  "lesotho", "mauritius", "seychelles",
  "democratic-republic-of-the-congo", "republic-of-the-congo",
  "central-african-republic", "gabon", "equatorial-guinea",
  "sao-tome-and-principe",
]);

export const AFRICA: RegionConfig = {
  id: "africa",
  name: "Africa",
  emoji: "🌍",
  accentColor: "#22c55e",
  accentRgb: "34,197,94",
  tagline: "The continent with the most to gain from AI",
  description:
    "Africa's AI trajectory is shaped by a young population, rapid mobile adoption, and growing government AI commitments. Kenya, Morocco, South Africa, and Rwanda lead — but the fastest movers may surprise you.",
  dataRegions: ["Middle East & Africa"],
  slugAllowlist: AFRICA_SLUGS,
  subregions: {
    egypt: "North Africa", morocco: "North Africa", tunisia: "North Africa",
    algeria: "North Africa", libya: "North Africa", sudan: "North Africa",
    kenya: "East Africa", ethiopia: "East Africa", tanzania: "East Africa",
    uganda: "East Africa", rwanda: "East Africa", mozambique: "East Africa",
    madagascar: "East Africa", somalia: "East Africa", eritrea: "East Africa",
    djibouti: "East Africa", malawi: "East Africa", zambia: "East Africa",
    comoros: "East Africa", burundi: "East Africa",
    nigeria: "West Africa", ghana: "West Africa", senegal: "West Africa",
    "ivory-coast": "West Africa", cameroon: "West Africa", mali: "West Africa",
    "burkina-faso": "West Africa", guinea: "West Africa", benin: "West Africa",
    togo: "West Africa", "sierra-leone": "West Africa", liberia: "West Africa",
    mauritania: "West Africa", niger: "West Africa", chad: "West Africa",
    gambia: "West Africa", "guinea-bissau": "West Africa", "cape-verde": "West Africa",
    "south-africa": "Southern Africa", zimbabwe: "Southern Africa",
    angola: "Southern Africa", namibia: "Southern Africa",
    botswana: "Southern Africa", eswatini: "Southern Africa",
    lesotho: "Southern Africa", mauritius: "Southern Africa",
    seychelles: "Southern Africa",
    "democratic-republic-of-the-congo": "Central Africa",
    "republic-of-the-congo": "Central Africa",
    "central-african-republic": "Central Africa",
    gabon: "Central Africa", "equatorial-guinea": "Central Africa",
    "sao-tome-and-principe": "Central Africa",
  },
  subregionOrder: ["North Africa", "East Africa", "West Africa", "Southern Africa", "Central Africa"],
  subregionColors: {
    "North Africa": "#f59e0b",
    "East Africa": "#22c55e",
    "West Africa": "#3b82f6",
    "Southern Africa": "#8b5cf6",
    "Central Africa": "#06b6d4",
  },
  opportunityLabel: "High-Momentum Markets",
  opportunityDescription: "Developing African nations with strong positive trajectory — the highest-conviction AI opportunity on the continent",
  opportunityMaxScore: 60,
};

export const ALL_REGION_CONFIGS: RegionConfig[] = [
  AMERICAS, EUROPE, ASIA_PACIFIC, MIDDLE_EAST, AFRICA,
];
