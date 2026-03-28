import type { Metadata } from "next";
import RegionDeepDive from "@/components/RegionDeepDive";
import { EUROPE } from "@/lib/regionConfigs";

export const metadata: Metadata = {
  title: "Europe AI Deep-Dive — AI Trajectory Index",
  description: "AI readiness across Europe: Northern and Western Europe lead, Eastern Europe closing the gap. Sub-regional breakdown, fastest movers, and investment opportunities.",
};

export default function EuropePage() {
  return <RegionDeepDive config={EUROPE} />;
}
