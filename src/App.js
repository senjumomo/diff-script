import React, { useState, useCallback } from "react";
import { FaGithub } from "react-icons/fa";
import ComparePage from "./ComparePage";
import ExistenceCheckPage from "./ExistenceCheckPage";
import DeploymentEmailPage from "./DeploymentEmailPage";
import SideMenu from "./SideMenu";
import DeploymentValidationPage from "./DeploymentValidationPage";
import { clientPaths, clients, environments } from "./clients";

// Exclude the special 'ALL' pseudo-client from app-wide client lists
const filteredClients = clients.filter(c => c !== 'ALL');

const isSingleEnvClient = (client) =>
  client === "Test" || client === "Regression";

const getEnvForClient = (client) =>
  client === "Test"
    ? "TEST"
    : client === "Regression"
    ? "REGRESSION"
    : "QA";

// ─── Toast System ─────────────────────────────────────────
let _toastId = 0;

function ToastContainer({ toasts, onRemove }) {
  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast toast-${t.type}`} onClick={() => onRemove(t.id)} style={{ cursor: "pointer" }}>
          <span className="toast-icon">{t.type === "success" ? "✓" : t.type === "error" ? "✕" : "ℹ"}</span>
          {t.message}
        </div>
      ))}
    </div>
  );
}

function App() {
  const initialClientA = filteredClients[0];
  const initialClientB = filteredClients[1];
  const initialEnvA = getEnvForClient(initialClientA);
  const initialEnvB = getEnvForClient(initialClientB);

  const [inputText, setInputText]     = useState("");
  const [outputFiles, setOutputFiles] = useState("");
  const [clientA, setClientA]         = useState(initialClientA);
  const [envA, setEnvA]               = useState(initialEnvA);
  const [clientB, setClientB]         = useState(initialClientB);
  const [envB, setEnvB]               = useState(initialEnvB);
  const [diffCommands, setDiffCommands] = useState("");
  const [diffAllQA, setDiffAllQA]     = useState(false);
  const [diffAllProd, setDiffAllProd] = useState(false);
  const [page, setPage]               = useState("home");
  const [toasts, setToasts]           = useState([]);

  const showToast = useCallback((message, type = "success", duration = 2600) => {
    const id = ++_toastId;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const extractFiles = (text) => {
    const matches = text.match(/\b[\w\-_]+\.(sql|apx)\b/gi);
    return matches || [];
  };

  const getPathForFile = (basePath, fileName) => {
    if (fileName.toLowerCase().endsWith('.apx')) {
      return basePath.replace(/\\sql$/i, '\\apex');
    }
    return basePath;
  };

  const updateOutputs = (text, clientAVal, envAVal, clientBVal, envBVal, diffAllQAMode, diffAllProdMode) => {
    const files = extractFiles(text);
    setOutputFiles(files.join("\n"));

    const pathA = clientPaths[clientAVal]?.[envAVal] || "";

    if (!files.length || !pathA) { setDiffCommands(""); return; }

    if (diffAllQAMode || diffAllProdMode) {
      const targetEnv = diffAllQAMode ? "QA" : "LIVE";
      const targetClients = filteredClients.filter(c => {
        if (c === clientAVal) return false;
        return clientPaths[c]?.[targetEnv] !== undefined;
      });
      if (targetClients.length === 0) { setDiffCommands(""); return; }
      let allCommands = [];
      targetClients.forEach(targetClient => {
        const basePathB = clientPaths[targetClient][targetEnv];
        allCommands.push(`\nREM ========================================`);
        allCommands.push(`REM ${clientAVal} (${envAVal}) → ${targetClient} (${targetEnv})`);
        allCommands.push(`REM ========================================`);
        files.forEach(file => {
          const pathB = getPathForFile(basePathB, file);
          const pathAForFile = getPathForFile(pathA, file);
          const diffFile = `${clientAVal}_to_${targetClient}_${file.replace(/\.(sql|apx)$/i, ".diff")}`;
          allCommands.push(`diff -iwc "${pathB}\\${file}" "${pathAForFile}\\${file}" > ${diffFile}`);
        });
      });
      setDiffCommands(allCommands.join("\n"));
    } else {
      const basePathB = clientPaths[clientBVal]?.[envBVal] || "";
      if (basePathB) {
        const diffs = files.map((file) => {
          const pathB = getPathForFile(basePathB, file);
          const pathAForFile = getPathForFile(pathA, file);
          const diffFile = file.replace(/\.(sql|apx)$/i, ".diff");
          return `diff -iwc "${pathB}\\${file}" "${pathAForFile}\\${file}" > ${diffFile}`;
        });
        setDiffCommands(diffs.join("\n"));
      } else {
        setDiffCommands("");
      }
    }
  };

  const onInputChange = (e) => {
    const val = e.target.value;
    setInputText(val);
    updateOutputs(val, clientA, envA, clientB, envB, diffAllQA, diffAllProd);
  };

  const onClientAChange = (e) => {
    const val = e.target.value;
    setClientA(val);
    const env = getEnvForClient(val);
    setEnvA(env);
    updateOutputs(inputText, val, env, clientB, envB, diffAllQA, diffAllProd);
  };

  const onEnvAChange = (e) => {
    const val = e.target.value;
    setEnvA(val);
    updateOutputs(inputText, clientA, val, clientB, envB, diffAllQA, diffAllProd);
  };

  const onClientBChange = (e) => {
    const val = e.target.value;
    setClientB(val);
    const env = getEnvForClient(val);
    setEnvB(env);
    updateOutputs(inputText, clientA, envA, val, env, diffAllQA, diffAllProd);
  };

  const onEnvBChange = (e) => {
    const val = e.target.value;
    setEnvB(val);
    updateOutputs(inputText, clientA, envA, clientB, val, diffAllQA, diffAllProd);
  };

  const onDiffAllQAToggle = () => {
    const newValue = !diffAllQA;
    setDiffAllQA(newValue);
    if (newValue) setDiffAllProd(false);
    updateOutputs(inputText, clientA, envA, clientB, envB, newValue, false);
  };

  const onDiffAllProdToggle = () => {
    const newValue = !diffAllProd;
    setDiffAllProd(newValue);
    if (newValue) setDiffAllQA(false);
    updateOutputs(inputText, clientA, envA, clientB, envB, false, newValue);
  };

  const copyToClipboard = () => {
    if (!diffCommands.trim()) return;
    navigator.clipboard.writeText(diffCommands).then(() => showToast("Diff commands copied!", "success"));
  };

  const downloadBatFile = () => {
    if (!diffCommands.trim()) return;
    const blob = new Blob([diffCommands], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `diff_commands_${envA}_${envB}.bat`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("Batch file downloaded!", "success");
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-base)", position: "relative" }}>
      {/* Animated mesh background */}
      <div className="mesh-bg">
        <div className="mesh-blob mesh-blob-1" />
        <div className="mesh-blob mesh-blob-2" />
        <div className="mesh-blob mesh-blob-3" />
      </div>

      {/* Layout */}
      <div style={{ position: "relative", zIndex: 1 }}>
        <SideMenu currentPage={page} onNavigate={setPage} />

        <div style={{ marginLeft: 232, padding: "2.5rem 2rem 4rem", minHeight: "100vh" }}>
          {page === "compare" ? (
            <ComparePage showToast={showToast} onBack={() => setPage("home")} />
          ) : page === "existence" ? (
            <ExistenceCheckPage showToast={showToast} onBack={() => setPage("home")} />
          ) : page === "email" ? (
            <DeploymentEmailPage showToast={showToast} onBack={() => setPage("home")} />
          ) : page === "validation" ? (
            <DeploymentValidationPage showToast={showToast} />
          ) : (
            <div className="fade-up" style={{ maxWidth: 860, margin: "0 auto" }}>

              {/* Page Header */}
              <div style={{ marginBottom: "2rem" }}>
                <h1 className="ds-section-title">Diff Script</h1>
                <p style={{ color: "var(--text-muted)", margin: 0, fontSize: "0.95rem" }}>
                  Paste your deployment plan to auto-generate diff commands.
                </p>
              </div>

              {/* Input Card */}
              <div className="glass-card" style={{ padding: "1.5rem", marginBottom: "1.5rem" }}>
                <label className="ds-label">Deployment Plan</label>
                <textarea
                  value={inputText}
                  onChange={onInputChange}
                  placeholder="Paste deployment script instructions here…"
                  className="ds-textarea"
                  style={{ minHeight: 180, fontFamily: "'JetBrains Mono', monospace", fontSize: "0.85rem", resize: "vertical" }}
                />
              </div>

              {/* Options + Client config grid */}
              <div style={{ display: "grid", gridTemplateColumns: diffAllQA || diffAllProd ? "1fr" : "1fr 1fr", gap: "1rem", marginBottom: "1.5rem" }}>

                {/* Deploying From */}
                <div className="glass-card" style={{ padding: "1.25rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "1rem" }}>
                    <span style={{ fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "#818cf8" }}>⬆ Deploying From</span>
                  </div>
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <div style={{ flex: 1, minWidth: 120 }}>
                      <label className="ds-label">Client A</label>
                      <select value={clientA} onChange={onClientAChange} className="ds-select">
                        {filteredClients.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    {!isSingleEnvClient(clientA) && (
                      <div style={{ flex: 1, minWidth: 120 }}>
                        <label className="ds-label">Environment A</label>
                        <select value={envA} onChange={onEnvAChange} className="ds-select">
                          {environments.map(e => <option key={e} value={e}>{e}</option>)}
                        </select>
                      </div>
                    )}
                  </div>
                </div>

                {/* Deploying To */}
                {!(diffAllQA || diffAllProd) && (
                  <div className="glass-card" style={{ padding: "1.25rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "1rem" }}>
                      <span style={{ fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "#34d399" }}>⬇ Deploying To</span>
                    </div>
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                      <div style={{ flex: 1, minWidth: 120 }}>
                        <label className="ds-label">Client B</label>
                        <select value={clientB} onChange={onClientBChange} className="ds-select">
                          {filteredClients.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                      {!isSingleEnvClient(clientB) && (
                        <div style={{ flex: 1, minWidth: 120 }}>
                          <label className="ds-label">Environment B</label>
                          <select value={envB} onChange={onEnvBChange} className="ds-select">
                            {environments.map(e => <option key={e} value={e}>{e}</option>)}
                          </select>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Toggles */}
              <div className="glass-card" style={{ padding: "1.25rem", marginBottom: "1.5rem", display: "flex", gap: "2rem", flexWrap: "wrap" }}>
                <label className="ds-checkbox-row">
                  <input type="checkbox" checked={diffAllQA} onChange={onDiffAllQAToggle} />
                  <span style={{ fontSize: "0.9rem", color: "var(--text-muted)", fontWeight: 500 }}>
                    Diff against <strong style={{ color: "#818cf8" }}>all QA</strong> environments
                  </span>
                </label>
                <label className="ds-checkbox-row">
                  <input type="checkbox" checked={diffAllProd} onChange={onDiffAllProdToggle} />
                  <span style={{ fontSize: "0.9rem", color: "var(--text-muted)", fontWeight: 500 }}>
                    Diff against <strong style={{ color: "#818cf8" }}>all LIVE</strong> environments
                  </span>
                </label>
              </div>

              {/* Extracted Files */}
              {outputFiles && (
                <div className="glass-card" style={{ padding: "1.25rem", marginBottom: "1.5rem" }}>
                  <label className="ds-label">Extracted .sql / .apx files</label>
                  <textarea
                    value={outputFiles}
                    readOnly
                    className="ds-textarea"
                    style={{ minHeight: 80, background: "rgba(255,255,255,0.02)", fontFamily: "'JetBrains Mono', monospace", fontSize: "0.82rem", resize: "vertical" }}
                  />
                </div>
              )}

              {/* Generated Commands */}
              <div className="glass-card" style={{ padding: "1.5rem" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem", flexWrap: "wrap", gap: 10 }}>
                  <label className="ds-label" style={{ margin: 0 }}>Generated Diff Commands</label>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={copyToClipboard} className="ds-btn ds-btn-primary" disabled={!diffCommands.trim()}>
                      Copy
                    </button>
                    <button onClick={downloadBatFile} className="ds-btn ds-btn-success" disabled={!diffCommands.trim()}>
                      Download .bat
                    </button>
                  </div>
                </div>
                <textarea
                  value={diffCommands}
                  readOnly
                  className="ds-textarea"
                  style={{
                    minHeight: 280,
                    maxHeight: 500,
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: "0.8rem",
                    resize: "vertical",
                    whiteSpace: "nowrap",
                    overflowX: "auto",
                    background: "rgba(0,0,0,0.25)",
                    lineHeight: 1.7,
                  }}
                  spellCheck={false}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Floating GitHub */}
      <a
        href="https://github.com/senjumomo"
        target="_blank"
        rel="noopener noreferrer"
        className="github-pulse-btn"
        style={{
          position: 'fixed',
          right: 24,
          bottom: 24,
          zIndex: 5000,
          color: '#ff2fa0',
          background: 'rgba(35,36,58,0.9)',
          backdropFilter: 'blur(12px)',
          borderRadius: '50%',
          width: 52,
          height: 52,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 28,
          textDecoration: 'none',
          border: '1px solid rgba(255,47,160,0.3)',
          transition: 'background 0.2s, color 0.2s',
        }}
        aria-label="My GitHub"
      >
        <FaGithub />
      </a>

      {/* Toast container */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}

export default App;
