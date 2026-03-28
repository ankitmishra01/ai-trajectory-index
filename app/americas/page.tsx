import type { Metadata } from "next";
import RegionDeepDive from "@/components/RegionDeepDive";
import { AMERICAS } from "@/lib/regionConfigs";

export const metadata: Metadata = {
  title: "Americas AI Deep-Dive — AI Trajectory Index",
  description: "AI readiness across the Americas: North America leads, Latin America rising. Sub-regional breakdown, fastest movers, and investment opportunities.",
};

export default function AmericasPage() {
  return <RegionDeepDive config={AMERICAS} />;
}
