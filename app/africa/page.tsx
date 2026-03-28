import type { Metadata } from "next";
import RegionDeepDive from "@/components/RegionDeepDive";
import { AFRICA } from "@/lib/regionConfigs";

export const metadata: Metadata = {
  title: "Africa AI Deep-Dive — AI Trajectory Index",
  description: "AI readiness across Africa: sub-regional breakdown, fastest-rising economies, pillar gap analysis, and high-momentum investment markets.",
};

export default function AfricaPage() {
  return <RegionDeepDive config={AFRICA} />;
}
