import type { Metadata } from "next";
import RegionDeepDive from "@/components/RegionDeepDive";
import { ASIA_PACIFIC } from "@/lib/regionConfigs";

export const metadata: Metadata = {
  title: "Asia-Pacific AI Deep-Dive — AI Trajectory Index",
  description: "AI readiness across Asia-Pacific: East Asia and Singapore lead, India surging, Southeast Asia emerging. Sub-regional breakdown and investment intelligence.",
};

export default function AsiaPacificPage() {
  return <RegionDeepDive config={ASIA_PACIFIC} />;
}
