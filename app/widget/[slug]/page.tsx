import { notFound } from "next/navigation";
import staticData from "@/data/countries.json";

// Minimal embeddable widget — designed to be used as an iframe src
// Usage: <iframe src="https://ai-trajectory-index.vercel.app/widget/usa" width="300" height="260" />

const PILLARS = [
  { key: "infrastructure",     label: "Infrastructure",      color: "#3B5BA5" },
  { key: "talent",             label: "Talent",              color: "#7A4F8C" },
  { key: "governance",         label: "Governance",          color: "#3F7A4D" },
  { key: "investment",         label: "Investment",          color: "#B58A2E" },
  { key: "economic_readiness", label: "Economic Readiness",  color: "#8B4A3F" },
] as const;

function scoreColor(score: number): string {
  if (score >= 80) return "#3F7A4D";
  if (score >= 60) return "#3B5BA5";
  if (score >= 40) return "#B58A2E";
  return "#A8513D";
}

function scoreBand(score: number): string {
  if (score >= 80) return "Leading";
  if (score >= 60) return "Advanced";
  if (score >= 40) return "Developing";
  return "Nascent";
}

// Simple SVG semicircle gauge (no client JS needed)
function Gauge({ score }: { score: number }) {
  const r = 44, cx = 60, cy = 60;
  const total = Math.PI * r; // half circumference
  const filled = (score / 100) * total;
  const gap = total - filled;
  const color = scoreColor(score);
  return (
    <svg viewBox="0 0 120 70" width="120" height="70" style={{ overflow: "visible" }}>
      {/* Track */}
      <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
        fill="none" stroke="#EBE5D5" strokeWidth="8" strokeLinecap="round" />
      {/* Fill */}
      <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
        fill="none" stroke={color} strokeWidth="8" strokeLinecap="round"
        strokeDasharray={`${filled} ${gap}`} />
      <text x={cx} y={cy - 2} textAnchor="middle" fill={color}
        style={{ fontSize: 22, fontWeight: 900, fontFamily: "Inter, sans-serif" }}>
        {score}
      </text>
      <text x={cx} y={cy + 13} textAnchor="middle" fill="#6B6354"
        style={{ fontSize: 9, fontFamily: "Inter, sans-serif" }}>
        / 100
      </text>
    </svg>
  );
}

export default function WidgetPage({ params }: { params: { slug: string } }) {
  const country = staticData.countries.find((c) => c.slug === params.slug);
  if (!country) notFound();

  const band  = scoreBand(country.total_score);
  const color = scoreColor(country.total_score);

  return (
    <main aria-label={`${country.name} AI Trajectory Index widget`} style={{ background: "#FBF9F4", color: "#1F1C14", fontFamily: "ui-sans-serif, system-ui, sans-serif", padding: 16, minHeight: "100vh", borderTop: "4px solid #D64528" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 28 }}>{country.flag}</span>
            <div>
              <p style={{ fontFamily: "Georgia, serif", fontWeight: 700, fontSize: 16, color: "#1F1C14" }}>{country.name}</p>
              <p style={{ fontSize: 11, color: "#6B6354", marginTop: 1 }}>{country.region}</p>
            </div>
            <div style={{ marginLeft: "auto", textAlign: "center" }}>
              <Gauge score={country.total_score} />
            </div>
          </div>

          {/* Tier badge + trajectory */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{
              fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 4,
              background: `${color}20`, color, border: `1px solid ${color}44`,
            }}>
              {band}
            </span>
            <span style={{ fontSize: 10, color: "#6B6354" }}>
              {country.trajectory_label}
            </span>
          </div>

          {/* 2028 Projection bar */}
          {(() => {
            const delta = country.projected_score_2028 - country.total_score;
            const projColor = delta >= 0 ? "#4ade80" : "#f87171";
            return (
              <div style={{ background: "#F5F1E8", border: "1px solid #EBE5D5", padding: "8px 10px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 9, color: "#6B6354", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    2028 Projection
                  </span>
                  <span style={{ fontSize: 11, fontWeight: 900, color: projColor }}>
                    {country.projected_score_2028}/100{" "}
                    <span style={{ fontSize: 9, fontWeight: 700 }}>
                      ({delta > 0 ? "+" : ""}{delta})
                    </span>
                  </span>
                </div>
                <div style={{ height: 4, background: "#EBE5D5", borderRadius: 2, overflow: "hidden", position: "relative" }}>
                  <div style={{ position: "absolute", height: "100%", width: `${country.total_score}%`, background: "#A89E84", borderRadius: 2 }} />
                  <div style={{ position: "absolute", height: "100%", width: `${country.projected_score_2028}%`, background: projColor, borderRadius: 2, opacity: 0.7 }} />
                </div>
              </div>
            );
          })()}

          {/* Pillar bars */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {PILLARS.map(({ key, label, color: c }) => {
              const score = country.scores[key].score;
              return (
                <div key={key}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                    <span style={{ fontSize: 10, color: "#3D3829" }}>{label}</span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: c }}>{score}/20</span>
                  </div>
                  <div style={{ height: 4, background: "#EBE5D5", borderRadius: 2, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${(score / 20) * 100}%`, background: c, borderRadius: 2 }} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <p style={{ fontSize: 9, color: "#6B6354", textAlign: "center", marginTop: 4 }}>
            AI Trajectory Index · ai-trajectory-index.vercel.app
          </p>
        </div>
    </main>
  );
}
