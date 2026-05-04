export default function SkeletonCard() {
  return (
    <div style={{ background: "var(--dt-surface)", border: "1px solid var(--dt-border)", padding: 24, display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div className="skeleton" style={{ width: 80, height: 10 }} />
          <div className="skeleton" style={{ width: 40, height: 32 }} />
          <div className="skeleton" style={{ width: 120, height: 14 }} />
          <div className="skeleton" style={{ width: 80, height: 10 }} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
          <div className="skeleton" style={{ width: 56, height: 44 }} />
          <div className="skeleton" style={{ width: 32, height: 10 }} />
          <div className="skeleton" style={{ width: 48, height: 12 }} />
        </div>
      </div>
      <div className="skeleton" style={{ height: 40 }} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 6 }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i}>
            <div className="skeleton" style={{ height: 3 }} />
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
              <div className="skeleton" style={{ width: "45%", height: 8 }} />
              <div className="skeleton" style={{ width: "30%", height: 8 }} />
            </div>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 12, borderTop: "1px solid var(--dt-border)" }}>
        <div className="skeleton" style={{ width: 80, height: 10 }} />
        <div className="skeleton" style={{ width: 72, height: 18 }} />
        <div className="skeleton" style={{ width: 48, height: 10 }} />
      </div>
    </div>
  );
}
