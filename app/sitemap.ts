import type { MetadataRoute } from "next";
import countriesData from "@/data/countries.json";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://ai-index.ankitmishra.ca";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date().toISOString();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE_URL,                  lastModified: now, changeFrequency: "daily",   priority: 1.0 },
    { url: `${BASE_URL}/adoption`,    lastModified: now, changeFrequency: "daily",   priority: 0.9 },
    { url: `${BASE_URL}/map`,         lastModified: now, changeFrequency: "weekly",  priority: 0.8 },
    { url: `${BASE_URL}/methodology`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE_URL}/americas`,    lastModified: now, changeFrequency: "weekly",  priority: 0.7 },
    { url: `${BASE_URL}/europe`,      lastModified: now, changeFrequency: "weekly",  priority: 0.7 },
    { url: `${BASE_URL}/africa`,      lastModified: now, changeFrequency: "weekly",  priority: 0.7 },
    { url: `${BASE_URL}/middle-east`, lastModified: now, changeFrequency: "weekly",  priority: 0.7 },
    { url: `${BASE_URL}/asia-pacific`,lastModified: now, changeFrequency: "weekly",  priority: 0.7 },
  ];

  const countryRoutes: MetadataRoute.Sitemap = countriesData.countries.map((c) => ({
    url: `${BASE_URL}/country/${c.slug}`,
    lastModified: now,
    changeFrequency: "daily",
    priority: 0.8,
  }));

  return [...staticRoutes, ...countryRoutes];
}
