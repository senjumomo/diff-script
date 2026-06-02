import React, { useState } from 'react';
import PageHeader from './PageHeader';
import { clients } from './clients';

const clientIndicatorMap = {
  HIP: "P", Bestmed: "B", MMS: "M", MMI: "A", HMS: "Z", FML: "Z",
  ZMC: "C", ZMZ: "I", Ship: "S", Regression: "S", ZMG: "G", BONITAS: "N",
};

function DeploymentValidationPage({ showToast }) {
  const [planText, setPlanText]           = useState("");
  const [selectedClient, setSelectedClient] = useState(clients[0] || "");
  const [issues, setIssues]               = useState(null); // null = not yet run

  const expectedIndicator = selectedClient === 'ALL' ? 'ALL' : (clientIndicatorMap[selectedClient] || "");

  function validatePlan() {
    const expected = clientIndicatorMap[selectedClient];
    const lines    = planText.split(/\r?\n/);
    const issuesList = [];

    lines.forEach((line, idx) => {
      const m = line.match(/\(([A-Za-z])\)/);
      if (m) {
        const found = m[1].toUpperCase();
        if (selectedClient === 'ALL') {
          issuesList.push({ line: idx + 1, text: line.trim(), msg: 'Remove indicator (X) when deploying to ALL' });
        } else if (expected && found !== expected.toUpperCase()) {
          issuesList.push({ line: idx + 1, text: line.trim(), msg: 'Wrong client indicator' });
        }
      }
      const fileMatch = line.match(/\b([\w-]+(?:_body|_pkg)?\.sql)\b/i);
      if (fileMatch) {
        const filename  = fileMatch[1];
        const isPackage = /_body\.sql$|_pkg\.sql$/i.test(filename) || /package/i.test(line);
        if (isPackage && !/\bMAL\b/i.test(line)) {
          issuesList.push({ line: idx + 1, text: line.trim(), msg: 'Missing MAL parameter' });
        }
      }
    });

    if (!planText.trim()) {
      setIssues([{ line: '—', text: 'No plan text provided.', msg: '' }]);
      return;
    }

    // Group by line
    const grouped = {};
    issuesList.forEach(it => {
      if (!grouped[it.line]) grouped[it.line] = { line: it.line, texts: new Set(), msgs: new Set() };
      grouped[it.line].texts.add(it.text);
      grouped[it.line].msgs.add(it.msg);
    });

    const merged = Object.values(grouped).map(g => ({
      line: g.line,
      text: Array.from(g.texts).join(' | '),
      msg:  Array.from(g.msgs).join('\n'),
    }));

    setIssues(merged);
    if (merged.length === 0) {
      if (showToast) showToast("No issues found — plan looks good!", "success");
    } else {
      if (showToast) showToast(`${merged.length} issue${merged.length > 1 ? 's' : ''} found`, "error");
    }
  }

  return (
    <div className="page">

      <PageHeader
        eyebrow="Quality"
        title="Deployment Validation"
        description="Validates client indicators and MAL parameters in your deployment plan."
      />

      <div className="panel info-banner">
        <strong>What this checks:</strong>
        {" "}Deployment indicator <code>(X)</code> matches the selected client,
        and package files include the <code>MAL</code> parameter.
      </div>

      {/* Controls row */}
      <div className="glass-card" style={{ padding: "1.25rem", marginBottom: "1rem", display: "flex", gap: "1rem", alignItems: "flex-end", flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 160 }}>
          <label className="ds-label">Client</label>
          <select value={selectedClient} onChange={e => setSelectedClient(e.target.value)} className="ds-select">
            {clients.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: "0.78rem", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--text-muted)" }}>Expected indicator</span>
          <span className="ds-badge ds-badge-primary mono" style={{ fontSize: "0.85rem", padding: "4px 12px" }}>
            {expectedIndicator || "—"}
          </span>
        </div>
        <button onClick={validatePlan} className="ds-btn ds-btn-primary">
          Validate Plan
        </button>
      </div>

      {/* Textarea */}
      <div className="glass-card" style={{ padding: "1.5rem", marginBottom: "1rem" }}>
        <label className="ds-label">Deployment Plan</label>
        <textarea
          value={planText}
          onChange={e => setPlanText(e.target.value)}
          placeholder="Paste deployment plan here…"
          className="ds-textarea ds-textarea--mono"
          style={{ minHeight: 220 }}
        />
      </div>

      {/* Results */}
      {issues !== null && (
        <div className="glass-card fade-up" style={{ padding: "1.5rem" }}>
          {issues.length === 0 ? (
            <div style={{ display: "flex", alignItems: "center", gap: 10, color: "var(--success)", fontWeight: 600 }}>
              <span className="mono">OK</span>
              No issues found — plan looks good!
            </div>
          ) : (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: "1rem" }}>
                <span className="ds-badge ds-badge-danger">{issues.length} issue{issues.length > 1 ? 's' : ''}</span>
                <span style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>Review the items below</span>
              </div>
              <table className="val-table">
                <thead>
                  <tr>
                    <th style={{ width: 60 }}>Line</th>
                    <th>Detail</th>
                    <th>Issue</th>
                  </tr>
                </thead>
                <tbody>
                  {issues.map((it, i) => (
                    <tr key={i}>
                      <td>
                        <span className="ds-badge ds-badge-danger" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                          {it.line}
                        </span>
                      </td>
                      <td style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.8rem", color: "var(--text-muted)" }}>
                        {it.text}
                      </td>
                      <td style={{ whiteSpace: "pre-wrap" }}>
                        {it.msg && (
                          <span style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 5,
                            padding: "3px 10px",
                            borderRadius: 99,
                            background: "rgba(239,68,68,0.12)",
                            border: "1px solid rgba(239,68,68,0.35)",
                            color: "#f87171",
                            fontSize: "0.78rem",
                            fontWeight: 600,
                          }}>
                            ⚠ {it.msg}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default DeploymentValidationPage;
