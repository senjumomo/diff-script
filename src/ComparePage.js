import React, { useState } from "react";

function extractFileName(entry) {
  const match = entry.match(/\b(\S+\.\w+)\b/);
  return match ? match[1] : entry;
}

function parseEntities(text) {
  if (!text) return [];
  const parts = text
    .split(/\r?\n|,|;/)
    .map(s => s.trim())
    .filter(Boolean)
    .filter(s => !s.startsWith("--"));
  return Array.from(new Set(parts));
}

function parseFileNames(text) {
  if (!text) return [];
  const parts = text
    .split(/\r?\n|,|;/)
    .map(s => s.trim())
    .filter(Boolean)
    .filter(s => !s.startsWith("--"))
    .map(extractFileName);
  return Array.from(new Set(parts));
}

const TABS = [
  { id: "missingInA", label: "Plan 1 missing" },
  { id: "missingInB", label: "Plan 2 missing" },
  { id: "common",     label: "Common" },
];

export default function ComparePage({ onBack, showToast }) {
  const [planA, setPlanA]               = useState("");
  const [planB, setPlanB]               = useState("");
  const [activeTab, setActiveTab]       = useState("missingInA");
  const [onlyInA, setOnlyInA]           = useState([]);
  const [onlyInB, setOnlyInB]           = useState([]);
  const [commonEntities, setCommonEntities] = useState([]);
  const [compared, setCompared]         = useState(false);

  const compare = () => {
    const a = parseEntities(planA);
    const b = parseEntities(planB);
    const setA = new Set(a);
    const setB = new Set(b);
    setOnlyInA(a.filter(x => !setB.has(x)));
    setOnlyInB(b.filter(x => !setA.has(x)));
    const fileNamesA = parseFileNames(planA);
    const fileNamesB = new Set(parseFileNames(planB));
    setCommonEntities(fileNamesA.filter(x => fileNamesB.has(x)));
    setCompared(true);
  };

  const clear = () => {
    setPlanA(""); setPlanB("");
    setOnlyInA([]); setOnlyInB([]); setCommonEntities([]);
    setCompared(false);
  };

  const copy = (arr) => {
    navigator.clipboard.writeText(arr.join("\n"));
    if (showToast) showToast("Copied to clipboard!", "success");
  };

  const activeData = activeTab === "missingInA" ? onlyInB : activeTab === "missingInB" ? onlyInA : commonEntities;

  return (
    <div className="fade-up" style={{ maxWidth: 1060, margin: "0 auto" }}>

      {/* Header */}
      <div style={{ marginBottom: "2rem" }}>
        <h1 className="ds-section-title">Compare Plans</h1>
        <p style={{ color: "var(--text-muted)", margin: 0, fontSize: "0.95rem" }}>
          Paste two deployment plans to find differences and common entities.
        </p>
      </div>

      {/* Input cards side by side */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
        {[
          { label: "Plan 1", value: planA, onChange: e => setPlanA(e.target.value), placeholder: "Paste Plan 1 here…" },
          { label: "Plan 2", value: planB, onChange: e => setPlanB(e.target.value), placeholder: "Paste Plan 2 here…" },
        ].map(({ label, value, onChange, placeholder }) => (
          <div key={label} className="glass-card" style={{ padding: "1.25rem" }}>
            <label className="ds-label">{label}</label>
            <textarea
              value={value}
              onChange={onChange}
              placeholder={placeholder}
              className="ds-textarea"
              style={{ minHeight: 280, fontFamily: "'JetBrains Mono', monospace", fontSize: "0.82rem", resize: "vertical" }}
            />
          </div>
        ))}
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: 8, marginBottom: "1.5rem" }}>
        <button onClick={compare} className="ds-btn ds-btn-primary">
          ⚡ Compare
        </button>
        <button onClick={clear} className="ds-btn ds-btn-ghost">
          Clear
        </button>
      </div>

      {/* Results */}
      {compared && (
        <div className="glass-card fade-up" style={{ padding: "1.5rem" }}>
          {/* Tab pills */}
          <div className="tab-pills" style={{ marginBottom: "1.25rem" }}>
            {TABS.map(tab => {
              const count = tab.id === "missingInA" ? onlyInB.length : tab.id === "missingInB" ? onlyInA.length : commonEntities.length;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`tab-pill${activeTab === tab.id ? " active" : ""}`}
                >
                  {tab.label}
                  <span style={{
                    marginLeft: 6,
                    padding: "1px 7px",
                    borderRadius: 99,
                    fontSize: "0.7rem",
                    fontWeight: 700,
                    background: activeTab === tab.id ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.06)",
                    color: activeTab === tab.id ? "#fff" : "var(--text-muted)",
                  }}>{count}</span>
                </button>
              );
            })}
          </div>

          {/* Result list */}
          <div style={{ maxHeight: 400, overflowY: "auto", minHeight: 120 }}>
            {activeData.length === 0 ? (
              <div style={{ color: "var(--text-faint)", fontStyle: "italic", padding: "1rem 0.75rem", fontSize: "0.9rem" }}>
                No items to show.
              </div>
            ) : (
              activeData.map(it => (
                <div key={it} className="result-item" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.82rem" }}>
                  {it}
                </div>
              ))
            )}
          </div>

          {/* Copy button */}
          <div style={{ marginTop: "1rem", paddingTop: "0.75rem", borderTop: "1px solid var(--border)" }}>
            <button onClick={() => copy(activeData)} className="ds-btn ds-btn-ghost" disabled={activeData.length === 0}>
              Copy {activeData.length} items
            </button>
          </div>
        </div>
      )}
    </div>
  );
}