"use client";

// Real score history from nightly snapshots (data/history/series.json via /api/history/[iso3]).
// No synthetic points: with one snapshot it says so and shows the single reading.
export interface HistoryPayload {
  history_start: string | null;
  latest_snapshot: string | null;
  snapshot_url: string | null;
  index_version: string;
  points: { date: string; total: number }[];
}

function fmtDate(d: string) {
  return new Date(`${d}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}

export default function ScoreHistory({ history, countryName }: { history: HistoryPayload | null; countryName: string }) {
  if (!history) return null;
  const pts = history.points;
  const width = 320, height = 72, pad = 6;
  const vals = pts.map((p) => p.total);
  const min = Math.min(...vals, 100), max = Math.max(...vals, 0);
  const lo = Math.max(0, Math.floor(min - 2)), hi = Math.min(100, Math.ceil(max + 2));
  const range = hi - lo || 1;
  const x = (i: number) => (pts.length === 1 ? width / 2 : pad + (i / (pts.length - 1)) * (width - 2 * pad));
  const y = (v: number) => pad + (1 - (v - lo) / range) * (height - 2 * pad);
  const change = pts.length > 1 ? Math.round((pts[pts.length - 1].total - pts[0].total) * 10) / 10 : null;

  return (
    <article className="card country-history" aria-label={`${countryName} score history`}>
      <header>
        <div>
          <p className="eyebrow">Score history</p>
          <h3>{pts.length > 1 ? `${change! > 0 ? "+" : ""}${change} points since ${fmtDate(pts[0].date)}` : pts.length === 1 ? `First snapshot: ${pts[0].total}/100 on ${fmtDate(pts[0].date)}` : "No snapshot yet"}</h3>
        </div>
        <span className="country-history-meta">
          {history.history_start ? `History starts ${fmtDate(history.history_start)}` : "No snapshots yet"} · {pts.length} snapshot{pts.length === 1 ? "" : "s"}
        </span>
      </header>
      {pts.length > 0 ? (
        <svg width="100%" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`Total score by snapshot date: ${pts.map((p) => `${p.date} ${p.total}`).join(", ")}`}>
          <line x1={pad} x2={width - pad} y1={height - pad} y2={height - pad} stroke="var(--ed-border, #e5e0d5)" strokeWidth={1} />
          {pts.length > 1 && <polyline points={pts.map((p, i) => `${x(i)},${y(p.total)}`).join(" ")} fill="none" stroke="var(--signal)" strokeWidth={1.75} strokeLinejoin="round" strokeLinecap="round" />}
          {pts.map((p, i) => <circle key={p.date} cx={x(i)} cy={y(p.total)} r={pts.length === 1 ? 4 : 2.5} fill="var(--signal)"><title>{`${fmtDate(p.date)}: ${p.total}/100`}</title></circle>)}
        </svg>
      ) : (
        <p className="country-history-note">No nightly snapshot includes this economy yet.</p>
      )}
      <p className="country-history-note">
        Scores are recomputed nightly from the live sources and stored as dated snapshots (index version {history.index_version}).
        {history.snapshot_url && <> Latest snapshot: <a href={history.snapshot_url} target="_blank" rel="noopener noreferrer">{history.latest_snapshot}</a>.</>}
      </p>
    </article>
  );
}
