import type { Metadata } from "next";
import RegionDeepDive from "@/components/RegionDeepDive";
import { MIDDLE_EAST } from "@/lib/regionConfigs";

export const metadata: Metadata = {
  title: "Middle East AI Deep-Dive — AI Trajectory Index",
  description: "AI readiness across the Middle East: Gulf states lead with massive government AI investment. UAE, Saudi Arabia, Qatar driving sovereign AI strategies.",
};

export default function MiddleEastPage() {
  return <RegionDeepDive config={MIDDLE_EAST} />;
}
