import React, { useState } from "react";

function parseEntities(text) {
  if (!text) return [];
  // Split on newlines, commas, semicolons and trim; remove empties
  // Also ignore lines that start with SQL-style comments: --
  const parts = text
    .split(/\r?\n|,|;/)
    .map((s) => s.trim())
    .filter(Boolean)
    .filter((s) => !s.startsWith("--"));
  // Deduplicate and normalize
  const set = new Set(parts.map((p) => p));
  return Array.from(set);
}

export default function ComparePage({ onBack }) {
  const [planA, setPlanA] = useState("");
  const [planB, setPlanB] = useState("");
  const [onlyInA, setOnlyInA] = useState([]);
  const [onlyInB, setOnlyInB] = useState([]);

  const compare = () => {
    const a = parseEntities(planA);
    const b = parseEntities(planB);
    const setA = new Set(a);
    const setB = new Set(b);

    const aNotB = a.filter((x) => !setB.has(x));
    const bNotA = b.filter((x) => !setA.has(x));

    setOnlyInA(aNotB);
    setOnlyInB(bNotA);
  };

  const copy = (arr) => {
    const txt = arr.join("\n");
    navigator.clipboard.writeText(txt);
    alert("Copied to clipboard");
  };

  const clear = () => {
    setPlanA("");
    setPlanB("");
    setOnlyInA([]);
    setOnlyInB([]);
  };

  return (
    <div style={styles.container}>
      <div style={styles.headerRow}>
        <button onClick={onBack} style={styles.backButton}>← Back</button>
        <h2 style={{ margin: 0 }}>Compare Deployment Plans</h2>
      </div>

      <div style={styles.inputsRow}>
        <div style={styles.inputBox}>
          <label style={styles.label}>Plan 1</label>
          <textarea
            value={planA}
            onChange={(e) => setPlanA(e.target.value)}
            placeholder="Paste plan 1 here (one entity per line or comma separated)"
            style={styles.textarea}
          />
        </div>

        <div style={styles.inputBox}>
          <label style={styles.label}>Plan 2</label>
          <textarea
            value={planB}
            onChange={(e) => setPlanB(e.target.value)}
            placeholder="Paste plan 2 here"
            style={styles.textarea}
          />
        </div>
      </div>

      <div style={{ marginTop: 0 }}>
        <button onClick={compare} style={styles.compareButton}>Compare</button>
        <button onClick={clear} style={styles.clearButton}>Clear</button>
      </div>

      <div style={styles.resultsRow}>
        <div style={styles.resultBox}>
          <h3>Plan 1 doesn't have (from Plan 2)</h3>
          <div style={styles.resultList}>
            {onlyInB.length === 0 ? <i style={{ opacity: 0.7 }}>No differences</i> : null}
            {onlyInB.map((it) => (
              <div key={it} style={styles.resultItem}>{it}</div>
            ))}
          </div>
          <div style={{ marginTop: 8 }}>
            <button onClick={() => copy(onlyInB)} style={styles.smallButton}>Copy</button>
          </div>
        </div>

        <div style={styles.resultBox}>
          <h3>Plan 2 doesn't have (from Plan 1)</h3>
          <div style={styles.resultList}>
            {onlyInA.length === 0 ? <i style={{ opacity: 0.7 }}>No differences</i> : null}
            {onlyInA.map((it) => (
              <div key={it} style={styles.resultItem}>{it}</div>
            ))}
          </div>
          <div style={{ marginTop: 8 }}>
            <button onClick={() => copy(onlyInA)} style={styles.smallButton}>Copy</button>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    width: "100%",
    maxWidth: 1100,
    color: "#eee",
    display: "flex",
    flexDirection: "column",
    gap: 24,
    alignItems: "center",
  },
  headerRow: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
  backButton: {
    padding: "0.35rem 0.6rem",
    borderRadius: 6,
    backgroundColor: "#3a8bff",
    border: "none",
    color: "#fff",
    cursor: "pointer",
  },
  inputsRow: {
    display: "flex",
    gap: 28,
    width: "100%",
    justifyContent: "center",
  },
  inputBox: {
    flex: "0 0 48%",
    minWidth: 360,
    backgroundColor: "#222639",
    padding: 16,
    borderRadius: 8,
  },
  textarea: {
    width: "calc(100% - 0px)",
    minHeight: 340,
    padding: 12,
    borderRadius: 8,
    border: "none",
    backgroundColor: "#2c2c44",
    color: "#eee",
    resize: "vertical",
    boxSizing: "border-box",
  },
  label: { fontWeight: 600, marginBottom: 6, display: "block", color: "#eee" },
  compareButton: {
    padding: "0.5rem 0.9rem",
    borderRadius: 6,
    backgroundColor: "#28c76f",
    border: "none",
    color: "#fff",
    cursor: "pointer",
    marginRight: 8,
  },
  clearButton: {
    padding: "0.5rem 0.9rem",
    borderRadius: 6,
    backgroundColor: "#ff6b6b",
    border: "none",
    color: "#fff",
    cursor: "pointer",
  },
  resultsRow: {
    display: "flex",
    gap: 28,
    width: "100%",
    justifyContent: "center",
  },
  resultBox: {
    flex: "0 0 48%",
    minWidth: 360,
    backgroundColor: "#222639",
    padding: 16,
    borderRadius: 8,
  },
  resultList: {
    marginTop: 8,
    maxHeight: 520,
    overflowY: "auto",
    minHeight: 200,
  },
  resultItem: {
    padding: "0.25rem 0",
    borderBottom: "1px solid rgba(255,255,255,0.03)",
  },
  smallButton: {
    padding: "0.35rem 0.6rem",
    borderRadius: 6,
    backgroundColor: "#3a8bff",
    border: "none",
    color: "#fff",
    cursor: "pointer",
  },
};