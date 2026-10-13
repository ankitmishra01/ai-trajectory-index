import { PILLAR_METADATA } from "@/lib/methodology";
import type { PillarKey, ScoreComponentProvenance } from "@/lib/types";

const statusLabel = {
  live: "Live",
  enriched: "Enriched",
  policy: "Policy",
  fallback: "Fallback",
} as const;

function formatValue(component: ScoreComponentProvenance) {
  if (component.value === null) return "Not available";
  if (typeof component.value === "boolean") return component.value ? "Yes" : "No";
  const value = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(component.value);
  return component.unit ? `${value} ${component.unit}` : value;
}

export default function PillarProvenance({ pillar, components }: { pillar: PillarKey; components: ScoreComponentProvenance[] }) {
  const label = PILLAR_METADATA[pillar].label;
  return (
    <details className="pillar-provenance">
      <summary>View score inputs <span aria-hidden="true">+</span></summary>
      {components.length === 0 ? (
        <p className="provenance-unavailable">Detailed inputs could not be loaded. The published pillar score remains available above.</p>
      ) : (
        <div className="provenance-table-wrap" role="region" aria-label={`${label} score inputs`} tabIndex={0}>
          <table className="provenance-table">
            <caption>{label} score inputs and contributions</caption>
            <thead><tr><th scope="col">Input</th><th scope="col">Value</th><th scope="col">Year</th><th scope="col">Source</th><th scope="col">Contribution</th><th scope="col">Status</th></tr></thead>
            <tbody>
              {components.map((component) => (
                <tr key={component.key}>
                  <th scope="row">{component.label}{component.substitution && <small>{component.substitution}</small>}</th>
                  <td>{formatValue(component)}</td>
                  <td>{component.year ?? "Not reported"}</td>
                  <td><a href={component.sourceUrl} target="_blank" rel="noopener noreferrer">{component.source}</a></td>
                  <td className="provenance-points">{component.pointsEarned.toFixed(1)} / {component.pointsAvailable} pts</td>
                  <td><span className={`provenance-status status-${component.status}`}>{statusLabel[component.status]}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </details>
  );
}
