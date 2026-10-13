import { describe, expect, it } from "vitest";

import { METHODOLOGY_COMPONENTS } from "@/lib/methodology";
import { csvCell, GET } from "./route";

const HEADER =
  "pillar,component_key,component,source,source_url,indicator_code,unit,points_available,source_kind,threshold_rule,fallback_rule,notes";

describe("methodology CSV route", () => {
  it("downloads one deterministic row per methodology component", async () => {
    const response = await GET();
    const body = await response.text();
    const lines = body.trimEnd().split("\r\n");

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("text/csv; charset=utf-8");
    expect(response.headers.get("content-disposition")).toBe(
      'attachment; filename="ai-trajectory-index-methodology-v3.csv"',
    );
    expect(lines[0]).toBe(HEADER);
    expect(lines).toHaveLength(METHODOLOGY_COMPONENTS.length + 1);
    expect(body).toContain("https://data.worldbank.org");
    expect(body).toContain("https://oecd.ai/en/");
  });

  it("quotes commas and doubles embedded quote characters", () => {
    expect(csvCell('Research, "measured"')).toBe('"Research, ""measured"""');
    expect(csvCell("plain")).toBe("plain");
  });
});
