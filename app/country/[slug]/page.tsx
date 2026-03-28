import { Metadata } from "next";
import { notFound } from "next/navigation";
import staticData from "@/data/countries.json";
import CountryPageClient from "@/components/CountryPageClient";
import type { ScoredCountry } from "@/lib/types";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://ai-index.ankitmishra.ca";

function scoreBandLabel(score: number): string {
  if (score >= 80) return "Leading";
  if (score >= 60) return "Advanced";
  if (score >= 40) return "Developing";
  return "Nascent";
}

export async function generateMetadata(
  { params }: { params: { slug: string } }
): Promise<Metadata> {
  const country = staticData.countries.find((c) => c.slug === params.slug);
  if (!country) {
    return { title: "Country Not Found — AI Trajectory Index" };
  }

  const tier    = scoreBandLabel(country.total_score);
  const delta   = country.projected_score_2028 - country.total_score;
  const deltaStr = delta > 0 ? `+${delta}` : String(delta);

  // Rank within all countries (approx from static data)
  const ranked  = [...staticData.countries].sort((a, b) => b.total_score - a.total_score);
  const rank    = ranked.findIndex((c) => c.slug === params.slug) + 1;

  const title       = `${country.name} — AI Trajectory Index | ${country.total_score}/100 (#${rank} Global)`;
  const description = `${tier} · ${country.trajectory_label} trajectory · Projected ${country.projected_score_2028}/100 by 2028 (${deltaStr} pts). See how 186 economies rank on AI readiness across Infrastructure, Talent, Governance, Investment and Economic Readiness.`;
  const url         = `${SITE_URL}/country/${params.slug}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      siteName: "AI Trajectory Index",
      type: "article",
      images: [
        {
          url: `${SITE_URL}/og-default.png`,
          width: 1200,
          height: 630,
          alt: `${country.name} AI Trajectory Index`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [`${SITE_URL}/og-default.png`],
    },
    alternates: {
      canonical: url,
    },
  };
}

export default function CountryPage({ params }: { params: { slug: string } }) {
  const staticCountry = staticData.countries.find((c) => c.slug === params.slug);
  if (!staticCountry) notFound();

  const initialCountry: ScoredCountry = { ...staticCountry, data_source: "fallback" as const };

  return <CountryPageClient slug={params.slug} initialCountry={initialCountry} />;
}
