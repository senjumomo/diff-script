import React, { useState } from "react";
import { clientPaths, clients, environments } from "./clients";

const isSingleEnvClient = (client) => client === "Test" || client === "Regression";
const getEnvForClient   = (client) =>
  client === "Test" ? "TEST" : client === "Regression" ? "REGRESSION" : "QA";

export default function ExistenceCheckPage({ onBack, showToast }) {
  const initialClient = clients[0];
  const [inputText, setInputText]   = useState("");
  const [outputFiles, setOutputFiles] = useState("");
  const [client, setClient]         = useState(initialClient);
  const [env, setEnv]               = useState(getEnvForClient(initialClient));
  const [batCommands, setBatCommands] = useState("");

  const extractFiles = (text) => {
    const matches = text.match(/\b[\w\-_]+\.sql\b/gi);
    if (!matches) return [];
    const seen = new Set();
    return matches.filter(f => {
      const key = f.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  };

  const updateOutputs = (text, clientVal, envVal) => {
    const files = extractFiles(text);
    setOutputFiles(files.join("\n"));
    const envKey = isSingleEnvClient(clientVal) ? getEnvForClient(clientVal) : envVal;
    const pathA  = clientPaths[clientVal]?.[envKey] ?? "";
    if (files.length && pathA) {
      const checks = files.map(
        file => `if exist "${pathA}\\${file}" (echo ${file} found) else (echo ${file} not found)`
      );
      setBatCommands(`@echo off\necho Checking files in ${pathA}\n\n${checks.join("\n")}\n\npause`);
    } else {
      setBatCommands("");
    }
  };

  const onInputChange  = (e) => { const val = e.target.value; setInputText(val); updateOutputs(val, client, env); };
  const onClientChange = (e) => { const val = e.target.value; setClient(val); const ne = getEnvForClient(val); setEnv(ne); updateOutputs(inputText, val, ne); };
  const onEnvChange    = (e) => { const val = e.target.value; setEnv(val); updateOutputs(inputText, client, val); };

  const copyToClipboard = () => {
    if (!batCommands.trim()) return;
    navigator.clipboard.writeText(batCommands).then(() => {
      if (showToast) showToast("Copied to clipboard!", "success");
    });
  };

  const downloadBatFile = () => {
    if (!batCommands.trim()) return;
    const blob = new Blob([batCommands], { type: "text/plain;charset=utf-8" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = "existence_check.bat";
    a.click();
    URL.revokeObjectURL(url);
    if (showToast) showToast("Batch file downloaded!", "success");
  };

  return (
    <div className="fade-up" style={{ maxWidth: 820, margin: "0 auto" }}>

      {/* Header */}
      <div style={{ marginBottom: "2rem" }}>
        <h1 className="ds-section-title">Existence Check</h1>
        <p style={{ color: "var(--text-muted)", margin: 0, fontSize: "0.95rem" }}>
          Generate a batch script to check if deployment files exist on a client environment.
        </p>
      </div>

      {/* Deployment Plan Input */}
      <div className="glass-card" style={{ padding: "1.5rem", marginBottom: "1rem" }}>
        <label className="ds-label">Deployment Plan</label>
        <textarea
          value={inputText}
          onChange={onInputChange}
          placeholder="Paste deployment script instructions here…"
          className="ds-textarea"
          style={{ minHeight: 160, fontFamily: "'JetBrains Mono', monospace", fontSize: "0.85rem" }}
        />
      </div>

      {/* Client / Env Selector */}
      <div className="glass-card" style={{ padding: "1.25rem", marginBottom: "1rem", display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "flex-end" }}>
        <div style={{ flex: 1, minWidth: 140 }}>
          <label className="ds-label">Client</label>
          <select value={client} onChange={onClientChange} className="ds-select">
            {clients.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        {!isSingleEnvClient(client) && (
          <div style={{ flex: 1, minWidth: 140 }}>
            <label className="ds-label">Environment</label>
            <select value={env} onChange={onEnvChange} className="ds-select">
              {environments.map(e => <option key={e} value={e}>{e}</option>)}
            </select>
          </div>
        )}
      </div>

      {/* Extracted Files */}
      {outputFiles && (
        <div className="glass-card" style={{ padding: "1.25rem", marginBottom: "1rem" }}>
          <label className="ds-label">Extracted .sql Filenames</label>
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
          <label className="ds-label" style={{ margin: 0 }}>Generated Check Commands</label>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={copyToClipboard} className="ds-btn ds-btn-primary" disabled={!batCommands.trim()}>
              Copy
            </button>
            <button onClick={downloadBatFile} className="ds-btn ds-btn-success" disabled={!batCommands.trim()}>
              Download .bat
            </button>
          </div>
        </div>
        <textarea
          value={batCommands}
          readOnly
          className="ds-textarea"
          style={{
            minHeight: 200,
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "0.8rem",
            whiteSpace: "nowrap",
            overflowX: "auto",
            background: "rgba(0,0,0,0.25)",
            lineHeight: 1.7,
          }}
          spellCheck={false}
        />
      </div>
    </div>
  );
}
