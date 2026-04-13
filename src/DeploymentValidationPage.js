import React from 'react';


import { useState } from 'react';
import { clients } from './clients';

const textareaStyle = {
  width: "100%",
  maxWidth: "600px",
  height: "240px",
  padding: "0.75rem 1rem",
  fontSize: "1rem",
  borderRadius: "8px",
  border: "none",
  boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
  backgroundColor: "#2c2c44",
  color: "#eee",
  resize: "vertical",
  whiteSpace: "pre-wrap",
  overflowWrap: "break-word",
  display: "block",
  margin: "0 auto 24px auto"
};

const selectStyle = {
  padding: "0.5rem",
  fontSize: "1rem",
  borderRadius: "6px",
  backgroundColor: "#2c2c44",
  color: "#eee",
  border: "none",
  outline: "none",
};

function DeploymentValidationPage() {
  const [planText, setPlanText] = useState("");
  const [selectedClient, setSelectedClient] = useState(clients[0] || "");
  const [issues, setIssues] = useState([]);

  const clientIndicatorMap = {
    HIP: "P",
    Bestmed: "B",
    MMS: "M",
    MMI: "A",
    HMS: "Z",
    FML: "Z",
    ZMC: "C",
    ZMZ: "I",
    Ship: "S",
    Regression: "S",
    ZMG: "G",
    BONITAS: "N",
  };

  const resultStyle = {
    width: "100%",
    maxWidth: "900px",
    minHeight: "120px",
    padding: "0.75rem 1rem",
    fontSize: "1rem",
    borderRadius: "8px",
    border: "none",
    boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
    backgroundColor: "#222639",
    color: "#eee",
    resize: "vertical",
    whiteSpace: "pre-wrap",
    overflowWrap: "break-word",
    fontFamily: "monospace",
    marginTop: 12,
  };

  const buttonStyle = {
    padding: "0.5rem 1rem",
    fontSize: "1rem",
    fontWeight: "600",
    borderRadius: "6px",
    border: "none",
    backgroundColor: "#3a8bff",
    color: "#fff",
    cursor: "pointer",
    marginLeft: 8,
  };

  const expectedIndicator = selectedClient === 'ALL' ? 'ALL' : (clientIndicatorMap[selectedClient] || "");
  const indicatorBadge = {
    marginLeft: 8,
    background: "#3a8bff",
    color: "#fff",
    padding: "4px 8px",
    borderRadius: 6,
    fontWeight: 700,
  };

  function validatePlan() {
    const expected = clientIndicatorMap[selectedClient];
    const skipIndicatorCheck = selectedClient === 'ALL';
    const lines = planText.split(/\r?\n/);
    const indicators = [];
    const issuesList = [];

    lines.forEach((line, idx) => {
      const m = line.match(/\(([A-Za-z])\)/);
      if (m) {
        const found = m[1].toUpperCase();
        indicators.push({ line: idx + 1, found, text: line });
        if (selectedClient === 'ALL') {
          // If deploying to ALL, indicators should not be present
          issuesList.push({ line: idx + 1, text: line.trim(), msg: 'Remove indicator (X) when deploying to ALL' });
        } else if (expected && found !== expected.toUpperCase()) {
          issuesList.push({ line: idx + 1, text: line.trim(), msg: 'wrong client indicator' });
        }
      }
      // package detection: filenames that look like package body or package files
      const fileMatch = line.match(/\b([\w\-]+(?:_body|_pkg)?\.sql)\b/i);
      if (fileMatch) {
        const filename = fileMatch[1];
        const isPackage = /_body\.sql$|_pkg\.sql$/i.test(filename) || /package/i.test(line);
        if (isPackage) {
          const hasMAL = /\bMAL\b/i.test(line);
          if (!hasMAL) {
            // record as package missing MAL
            issuesList.push({ line: idx + 1, text: line.trim(), msg: 'missing MAL parameter' });
          }
        }
      }
    });
    // Set issues state for table rendering
    if (!planText.trim()) {
      setIssues([{ line: '-', text: 'No plan text provided.', msg: '' }]);
      return;
    }

    if (issuesList.length === 0) {
      setIssues([]);
      return;
    }

    // Group issues by line so multiple issues on same line show in one row
    const grouped = {};
    issuesList.forEach(it => {
      const key = it.line;
      if (!grouped[key]) grouped[key] = { line: it.line, texts: new Set(), msgs: new Set() };
      grouped[key].texts.add(it.text);
      grouped[key].msgs.add(it.msg);
    });

    const merged = Object.values(grouped).map(g => ({
      line: g.line,
      text: Array.from(g.texts).join(' | '),
      msg: Array.from(g.msgs).join('\n')
    }));

    setIssues(merged);
  }

  return (
    <div style={{
      width: "100%",
      maxWidth: 900,
      margin: "0 auto",
      padding: "2rem",
      color: "#eee",
      display: "flex",
      flexDirection: "column",
      alignItems: "center"
    }}>
      <h1 style={{ marginBottom: 12, textAlign: "center" }}>Deployment Validation</h1>
      <h3 style={{ textAlign: "center", fontSize: "1.25rem", fontWeight: 600, marginBottom: 18 }}>
        Paste your deployment scripts here:
      </h3>
      <div style={{ maxWidth: 720, textAlign: 'center', color: '#bcd', marginBottom: 16 }}>
        <div style={{ display: 'inline-block', textAlign: 'left', background: '#23243a', padding: '0.75rem 1rem', borderRadius: 8 }}>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>What this validator checks</div>
          <ul style={{ margin: 0, paddingLeft: '1.2rem' }}>
            <li>Deployment indicator — verifies the (X) indicator matches the selected client.</li>
            <li>Package files — ensures package deployments include the <strong>MAL</strong> parameter.</li>
          </ul>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
        <label style={{ fontWeight: 700 }}>Client:</label>
        <select value={selectedClient} onChange={e => setSelectedClient(e.target.value)} style={selectStyle}>
          {clients.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <div style={{ display: 'flex', alignItems: 'center', marginLeft: 8 }}>
          <div style={{ color: '#b0b8d8', fontWeight: 700, marginRight: 6 }}>Indicator:</div>
          <div style={indicatorBadge}>{expectedIndicator || '—'}</div>
        </div>
        <button onClick={() => validatePlan()} style={buttonStyle}>Validate</button>
      </div>

      <textarea
        value={planText}
        onChange={e => setPlanText(e.target.value)}
        placeholder="Paste deployment plan here..."
        style={textareaStyle}
      />
      {/* Results table */}
      {issues.length === 0 ? (
        <div style={{ color: '#28c76f', fontWeight: 700, marginTop: 12 }}>No issues found.</div>
      ) : (
        <div style={{ width: '100%', maxWidth: 900, marginTop: 12 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '8px', borderBottom: '2px solid #3a8bff' }}>Line</th>
                  <th style={{ textAlign: 'left', padding: '8px', borderBottom: '2px solid #3a8bff' }}>Detail</th>
                  <th style={{ textAlign: 'left', padding: '8px', borderBottom: '2px solid #3a8bff' }}>Issue</th>
                </tr>
            </thead>
            <tbody>
              {issues.map((it, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #2c2c44' }}>
                  <td style={{ padding: '8px' }}>{it.line}</td>
                  <td style={{ padding: '8px', fontFamily: 'monospace' }}>{it.text}</td>
                  <td style={{ padding: '8px', color: '#ff6b6b', whiteSpace: 'pre-wrap' }}>{it.msg}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default DeploymentValidationPage;
