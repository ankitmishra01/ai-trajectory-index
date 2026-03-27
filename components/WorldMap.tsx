"use client";

import { useState, useRef, useCallback } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  useMapContext,
} from "react-simple-maps";
import { ISO_NUMERIC_TO_SLUG } from "@/lib/slugToIso";
import { SLUG_TO_CENTROID } from "@/lib/centroids";

const GEO_URL =
  "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

export type MapMode = "view" | "select";

interface TooltipState {
  name: string;
  score: number | undefined;
  x: number;
  y: number;
}

interface Props {
  scores: Record<string, number>;
  countryNames: Record<string, string>;
  countryFlags: Record<string, string>;
  selectedSlugs: Set<string>;
  mode: MapMode;
  onSelectionChange: (slugs: string[]) => void;
  onCountryClick: (slug: string) => void;
}

function scoreColor(score: number | undefined, selected: boolean): string {
  if (selected) return "#60a5fa";
  if (score === undefined) return "#1c2847";
  if (score >= 80) return "#16a34a";
  if (score >= 60) return "#2563eb";
  if (score >= 40) return "#d97706";
  if (score >= 20) return "#ea580c";
  return "#dc2626";
}

// Ray-casting point-in-polygon test
function pointInPolygon(
  point: [number, number],
  polygon: [number, number][]
): boolean {
  const [x, y] = point;
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

// Convert a React mouse event on an SVG element to SVG-coordinate-space coords
function toSVGCoords(
  e: React.MouseEvent<SVGElement>,
  mapWidth: number,
  mapHeight: number
): [number, number] {
  const svgEl = (e.currentTarget as SVGElement).ownerSVGElement;
  if (!svgEl) return [0, 0];
  const rect = svgEl.getBoundingClientRect();
  return [
    (e.clientX - rect.left) * (mapWidth / rect.width),
    (e.clientY - rect.top) * (mapHeight / rect.height),
  ];
}

// ─── Inner component (has access to useMapContext) ───────────────────────────

function MapContent({
  scores,
  countryNames,
  selectedSlugs,
  mode,
  onSelectionChange,
  onCountryClick,
  onTooltip,
}: Omit<Props, "countryFlags"> & {
  onTooltip: (t: TooltipState | null) => void;
}) {
  const { projection, width, height } = useMapContext();
  const isDrawing = useRef(false);
  const rawPoints = useRef<[number, number][]>([]);
  const [lassoDisplay, setLassoDisplay] = useState<[number, number][]>([]);

  const flushLasso = useCallback(() => {
    if (rawPoints.current.length > 1) {
      setLassoDisplay([...rawPoints.current]);
    }
  }, []);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<SVGElement>) => {
      if (mode !== "select") return;
      e.preventDefault();
      isDrawing.current = true;
      rawPoints.current = [toSVGCoords(e, width, height)];
      setLassoDisplay([]);
    },
    [mode, width, height]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<SVGElement>) => {
      if (!isDrawing.current || mode !== "select") return;
      rawPoints.current.push(toSVGCoords(e, width, height));
      // Throttle SVG re-render to every 4 points
      if (rawPoints.current.length % 4 === 0) flushLasso();
    },
    [mode, width, height, flushLasso]
  );

  const handleMouseUp = useCallback(() => {
    if (!isDrawing.current) return;
    isDrawing.current = false;
    setLassoDisplay([]);

    const poly = rawPoints.current;
    if (poly.length < 6) {
      rawPoints.current = [];
      return;
    }

    // Hit-test all known country centroids
    const selected: string[] = [];
    for (const [slug, [lon, lat]] of Object.entries(SLUG_TO_CENTROID)) {
      const pt = projection([lon, lat]);
      if (!pt) continue;
      if (pointInPolygon(pt as [number, number], poly)) {
        selected.push(slug);
      }
    }

    rawPoints.current = [];
    onSelectionChange(selected);
  }, [projection, onSelectionChange]);

  return (
    <>
      {/* Country shapes */}
      <Geographies geography={GEO_URL}>
        {({ geographies }) =>
          geographies.map((geo) => {
            const slug = ISO_NUMERIC_TO_SLUG[Number(geo.id)];
            const score = slug ? scores[slug] : undefined;
            const isSelected = slug ? selectedSlugs.has(slug) : false;
            const fill = scoreColor(score, isSelected);

            return (
              <Geography
                key={geo.rsmKey}
                geography={geo}
                fill={fill}
                stroke="#0a0f1e"
                strokeWidth={0.4}
                style={{
                  default: { outline: "none" },
                  hover: {
                    fill: slug ? (isSelected ? "#93c5fd" : "#3b82f6") : "#243355",
                    outline: "none",
                    cursor: slug ? "pointer" : "default",
                    transition: "fill 120ms",
                  },
                  pressed: { outline: "none" },
                }}
                onClick={() => {
                  if (slug && mode === "view") onCountryClick(slug);
                }}
                onMouseEnter={(e: React.MouseEvent) => {
                  if (!slug) return;
                  onTooltip({
                    name: countryNames[slug] ?? slug,
                    score,
                    x: e.clientX,
                    y: e.clientY,
                  });
                }}
                onMouseLeave={() => onTooltip(null)}
              />
            );
          })
        }
      </Geographies>

      {/* Invisible capture rect for lasso drawing */}
      {mode === "select" && (
        <rect
          x={0}
          y={0}
          width={width}
          height={height}
          fill="transparent"
          style={{ cursor: "crosshair" }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        />
      )}

      {/* Lasso polygon */}
      {lassoDisplay.length > 1 && (
        <polygon
          points={lassoDisplay.map((p) => p.join(",")).join(" ")}
          fill="rgba(59,130,246,0.12)"
          stroke="#3b82f6"
          strokeWidth={1.5}
          strokeDasharray="6,3"
          pointerEvents="none"
        />
      )}
    </>
  );
}

// ─── Public component ────────────────────────────────────────────────────────

export default function WorldMap({
  scores,
  countryNames,
  countryFlags,
  selectedSlugs,
  mode,
  onSelectionChange,
  onCountryClick,
}: Props) {
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  return (
    <div className="relative w-full select-none">
      <ComposableMap
        width={900}
        height={460}
        projection="geoEqualEarth"
        projectionConfig={{ scale: 145, center: [10, 10] }}
        style={{ width: "100%", height: "auto" }}
      >
        <MapContent
          scores={scores}
          countryNames={countryNames}
          selectedSlugs={selectedSlugs}
          mode={mode}
          onSelectionChange={onSelectionChange}
          onCountryClick={onCountryClick}
          onTooltip={setTooltip}
        />
      </ComposableMap>

      {/* Score legend */}
      <div className="absolute bottom-3 left-3 flex items-center gap-1.5 bg-[#0a0f1e]/90 border border-[#1c2847] rounded-lg px-3 py-2 pointer-events-none">
        {[
          { color: "#dc2626", label: "0–20" },
          { color: "#ea580c", label: "20–40" },
          { color: "#d97706", label: "40–60" },
          { color: "#2563eb", label: "60–80" },
          { color: "#16a34a", label: "80–100" },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1">
            <div
              className="w-3 h-3 rounded-sm"
              style={{ backgroundColor: color }}
            />
            <span className="text-[10px] text-slate-400">{label}</span>
          </div>
        ))}
        <span className="text-[10px] text-slate-600 ml-1">AI Score</span>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="fixed z-50 pointer-events-none px-3 py-1.5 rounded-lg bg-[#0f1628] border border-[#1c2847] shadow-xl text-sm"
          style={{ left: tooltip.x + 14, top: tooltip.y - 36 }}
        >
          <span className="font-bold text-white">{tooltip.name}</span>
          {tooltip.score !== undefined && (
            <span className="text-slate-400 ml-2">{tooltip.score}/100</span>
          )}
          {countryFlags[
            Object.keys(countryNames).find(
              (k) => countryNames[k] === tooltip.name
            ) ?? ""
          ] && (
            <span className="ml-1">
              {
                countryFlags[
                  Object.keys(countryNames).find(
                    (k) => countryNames[k] === tooltip.name
                  ) ?? ""
                ]
              }
            </span>
          )}
        </div>
      )}
    </div>
  );
}
