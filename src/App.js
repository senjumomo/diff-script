import React, { useState, useCallback, useMemo } from "react";
import ComparePage from "./ComparePage";
import ExistenceCheckPage from "./ExistenceCheckPage";
import DeploymentEmailPage from "./DeploymentEmailPage";
import SideMenu from "./SideMenu";
import PageHeader from "./PageHeader";
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
  const iconLabel = (type) => (type === "success" ? "OK" : type === "error" ? "!" : "i");
  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast toast-${t.type}`} onClick={() => onRemove(t.id)} style={{ cursor: "pointer" }}>
          <span className="toast-icon">{iconLabel(t.type)}</span>
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

  const fileCount = useMemo(
    () => (outputFiles ? outputFiles.split("\n").filter(Boolean).length : 0),
    [outputFiles]
  );
  const commandCount = useMemo(
    () => (diffCommands ? diffCommands.split("\n").filter(l => l.trim().startsWith("diff ")).length : 0),
    [diffCommands]
  );

  const routeLabel = diffAllQA
    ? `${clientA} → All QA`
    : diffAllProd
    ? `${clientA} → All LIVE`
    : `${clientA} (${envA}) → ${clientB} (${envB})`;

  const renderClientPanel = (tag, tagClass, clientVal, onClientChange, envVal, onEnvChange) => (
    <div className="glow-card">
      <div className="glow-card__inner">
        <span className={`panel-tag panel-tag--${tagClass}`} style={{ marginBottom: 12, display: "inline-block" }}>
          {tag}
        </span>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 110 }}>
            <label className="ds-label">Client</label>
            <select value={clientVal} onChange={onClientChange} className="ds-select">
              {filteredClients.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          {!isSingleEnvClient(clientVal) && (
            <div style={{ flex: 1, minWidth: 110 }}>
              <label className="ds-label">Environment</label>
              <select value={envVal} onChange={onEnvChange} className="ds-select">
                {environments.map(e => <option key={e} value={e}>{e}</option>)}
              </select>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      <div className="app-bg" aria-hidden="true">
        <div className="aurora aurora-1" />
        <div className="aurora aurora-2" />
        <div className="aurora aurora-3" />
        <div className="grain" />
      </div>
      <div className="app-shell">
        <SideMenu currentPage={page} onNavigate={setPage} />
        <main className="app-main">
          {page === "compare" ? (
            <ComparePage showToast={showToast} />
          ) : page === "existence" ? (
            <ExistenceCheckPage showToast={showToast} />
          ) : page === "email" ? (
            <DeploymentEmailPage showToast={showToast} />
          ) : page === "validation" ? (
            <DeploymentValidationPage showToast={showToast} />
          ) : (
            <div className="page page--home">
              <div className="page-top">
                <PageHeader
                  eyebrow="Generator"
                  title="Diff Script"
                  description="Paste your deployment plan — files and batch diff commands generate live."
                />
                <div className="metric-strip">
                  <div className="metric-card">
                    <span className="metric-card__value">{fileCount || "—"}</span>
                    <span className="metric-card__label">Files</span>
                  </div>
                  <div className="metric-card">
                    <span className="metric-card__value">{commandCount || "—"}</span>
                    <span className="metric-card__label">Commands</span>
                  </div>
                  <div className="metric-card" style={{ minWidth: 140, textAlign: "left" }}>
                    <span className="metric-card__value metric-card__value--text mono">{routeLabel}</span>
                    <span className="metric-card__label">Route</span>
                  </div>
                </div>
              </div>

              <div className="bento">
                <section className="bento__plan glow-card">
                  <div className="glow-card__inner" style={{ height: "100%", display: "flex", flexDirection: "column" }}>
                    <label className="ds-label">Deployment plan</label>
                    <textarea
                      value={inputText}
                      onChange={onInputChange}
                      placeholder="Paste deployment script instructions here…"
                      className="ds-textarea ds-textarea--mono"
                      style={{ flex: 1, minHeight: 220 }}
                    />
                  </div>
                </section>

                <aside className="bento__config flow-grid">
                  {renderClientPanel("Source", "from", clientA, onClientAChange, envA, onEnvAChange)}
                  {!(diffAllQA || diffAllProd) && (
                    <>
                      <div className="flow-arrow" aria-hidden="true">→</div>
                      {renderClientPanel("Target", "to", clientB, onClientBChange, envB, onEnvBChange)}
                    </>
                  )}
                  <div className="glow-card">
                    <div className="glow-card__inner" style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      <label className="toggle-row">
                        <input type="checkbox" checked={diffAllQA} onChange={onDiffAllQAToggle} />
                        <span className="toggle-track" />
                        <span className="toggle-label">Diff <strong>all QA</strong></span>
                      </label>
                      <label className="toggle-row">
                        <input type="checkbox" checked={diffAllProd} onChange={onDiffAllProdToggle} />
                        <span className="toggle-track" />
                        <span className="toggle-label">Diff <strong>all LIVE</strong></span>
                      </label>
                    </div>
                  </div>
                </aside>

                {outputFiles && (
                  <div className="bento__output glow-card">
                    <div className="glow-card__inner">
                      <div className="panel-header">
                        <label className="ds-label" style={{ margin: 0 }}>Extracted files</label>
                        <span className="stat-chip stat-chip--accent">{fileCount} detected</span>
                      </div>
                      <textarea value={outputFiles} readOnly className="ds-textarea ds-textarea--mono" style={{ minHeight: 64 }} />
                    </div>
                  </div>
                )}

                <section className="bento__output glow-card">
                  <div className="glow-card__inner">
                    <div className="panel-header">
                      <label className="ds-label" style={{ margin: 0 }}>Generated output</label>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button type="button" onClick={copyToClipboard} className="ds-btn ds-btn-primary" disabled={!diffCommands.trim()}>
                          Copy
                        </button>
                        <button type="button" onClick={downloadBatFile} className="ds-btn ds-btn-success" disabled={!diffCommands.trim()}>
                          Download .bat
                        </button>
                      </div>
                    </div>
                    <div className="terminal">
                      <div className="terminal__chrome">
                        <span className="terminal__dot terminal__dot--violet" />
                        <span className="terminal__dot terminal__dot--cyan" />
                        <span className="terminal__dot terminal__dot--rose" />
                        <span className="terminal__title">diff_commands.bat</span>
                      </div>
                      <textarea
                        value={diffCommands}
                        readOnly
                        className="terminal__body terminal__body--readonly terminal__body--scroll-x"
                        style={{ minHeight: 240, maxHeight: 420 }}
                        spellCheck={false}
                        placeholder="Commands appear here after you paste a plan…"
                      />
                    </div>
                  </div>
                </section>
              </div>
            </div>
          )}
        </main>
      </div>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </>
  );
}

export default App;
