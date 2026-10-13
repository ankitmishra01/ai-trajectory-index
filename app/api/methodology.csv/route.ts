import { METHODOLOGY_COMPONENTS } from "@/lib/methodology";

const HEADERS = [
  "pillar",
  "component_key",
  "component",
  "source",
  "source_url",
  "indicator_code",
  "unit",
  "points_available",
  "source_kind",
  "threshold_rule",
  "fallback_rule",
  "notes",
] as const;

export const csvCell = (value: unknown) => {
  const text = String(value ?? "");
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

export async function GET() {
  const rows = METHODOLOGY_COMPONENTS.map((item) =>
    [
      item.pillar,
      item.key,
      item.label,
      item.source,
      item.sourceUrl,
      item.indicatorCode,
      item.unit,
      item.pointsAvailable,
      item.sourceKind,
      item.thresholdRule,
      item.fallbackRule,
      item.notes,
    ]
      .map(csvCell)
      .join(","),
  );
  const csv = [HEADERS.join(","), ...rows].join("\r\n") + "\r\n";

  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition":
        'attachment; filename="ai-trajectory-index-methodology-v3.csv"',
      "Cache-Control": "public, max-age=86400, immutable",
    },
  });
}
