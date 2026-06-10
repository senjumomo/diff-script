import React, { useState } from "react";
import PageHeader from "./PageHeader";
import { clientPaths, clients, environments } from "./clients";

const isSingleEnvClient = (client) => client === "Test" || client === "Regression";
const getEnvForClient   = (client) =>
  client === "Test" ? "TEST" : client === "Regression" ? "REGRESSION" : "QA";

export default function CopyScriptPage({ showToast }) {
  const initialClient = clients[0];
  const [inputText, setInputText]     = useState("");
  const [targetPath, setTargetPath]   = useState("");
  const [client, setClient]           = useState(initialClient);
  const [env, setEnv]                 = useState(getEnvForClient(initialClient));
  const [outputFiles, setOutputFiles] = useState("");
  const [batCommands, setBatCommands] = useState("");

  const extractFiles = (text) => {
    const matches = text.match(/\b[\w\-_]+\.(sql|apx)\b/gi);
    if (!matches) return [];
    const seen = new Set();
    return matches.filter(f => {
      const key = f.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  };

  const getPathForFile = (basePath, fileName) => {
    if (fileName.toLowerCase().endsWith('.apx')) {
      return basePath.replace(/\\sql$/i, '\\apex');
    }
    return basePath;
  };

  const updateOutputs = (text, clientVal, envVal, targetVal) => {
    const files = extractFiles(text);
    setOutputFiles(files.join("\n"));
    
    const envKey = isSingleEnvClient(clientVal) ? getEnvForClient(clientVal) : envVal;
    const basePath = clientPaths[clientVal]?.[envKey] ?? "";

    if (files.length && basePath && targetVal.trim()) {
      const commands = [];
      commands.push("@echo off");
      commands.push(`echo Creating target directory if it doesn't exist...`);
      commands.push(`if not exist "${targetVal}" mkdir "${targetVal}"`);
      commands.push("");
      
      files.forEach(file => {
        const sourceDir = getPathForFile(basePath, file);
        commands.push(`copy /y "${sourceDir}\\${file}" "${targetVal}\\"`);
      });

      commands.push("");
      commands.push("echo Done copying files.");
      commands.push("pause");
      
      setBatCommands(commands.join("\n"));
    } else {
      setBatCommands("");
    }
  };

  const onInputChange = (e) => {
    const val = e.target.value;
    setInputText(val);
    updateOutputs(val, client, env, targetPath);
  };

  const onTargetPathChange = (e) => {
    const val = e.target.value;
    setTargetPath(val);
    updateOutputs(inputText, client, env, val);
  };

  const onClientChange = (e) => {
    const val = e.target.value;
    setClient(val);
    const ne = getEnvForClient(val);
    setEnv(ne);
    updateOutputs(inputText, val, ne, targetPath);
  };

  const onEnvChange = (e) => {
    const val = e.target.value;
    setEnv(val);
    updateOutputs(inputText, client, val, targetPath);
  };

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
    a.download = "copy_files.bat";
    a.click();
    URL.revokeObjectURL(url);
    if (showToast) showToast("Batch file downloaded!", "success");
  };

  return (
    <div className="page">
      <PageHeader
        eyebrow="Generator"
        title="Copy Script"
        description="Generate a batch script to copy deployment files from a client environment directory to a target directory."
      />

      {/* Deployment Plan Input */}
      <div className="glass-card" style={{ padding: "1.5rem", marginBottom: "1rem" }}>
        <label className="ds-label">Deployment Plan Instructions</label>
        <textarea
          value={inputText}
          onChange={onInputChange}
          placeholder="Paste deployment script instructions here…"
          className="ds-textarea ds-textarea--mono"
          style={{ minHeight: 160 }}
        />
      </div>

      {/* Source & Target Controls */}
      <div className="glass-card" style={{ padding: "1.25rem", marginBottom: "1rem" }}>
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginBottom: "1rem" }}>
          <div style={{ flex: 1, minWidth: 140 }}>
            <label className="ds-label">Source Client</label>
            <select value={client} onChange={onClientChange} className="ds-select">
              {clients.map(c => c !== "ALL" && <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          {!isSingleEnvClient(client) && (
            <div style={{ flex: 1, minWidth: 140 }}>
              <label className="ds-label">Source Environment</label>
              <select value={env} onChange={onEnvChange} className="ds-select">
                {environments.map(e => <option key={e} value={e}>{e}</option>)}
              </select>
            </div>
          )}
        </div>

        <div style={{ width: "100%" }}>
          <label className="ds-label">Target Path (On Your Local PC)</label>
          <input
            type="text"
            value={targetPath}
            onChange={onTargetPathChange}
            placeholder="e.g. C:\Deployments\Update_2026"
            className="ds-input"
          />
        </div>
      </div>

      {/* Extracted Files */}
      {outputFiles && (
        <div className="glass-card" style={{ padding: "1.25rem", marginBottom: "1rem" }}>
          <label className="ds-label">Extracted Filenames</label>
          <textarea
            value={outputFiles}
            readOnly
            className="ds-textarea ds-textarea--mono"
            style={{ minHeight: 80, resize: "vertical" }}
          />
        </div>
      )}

      {/* Generated Commands */}
      <div className="glass-card" style={{ padding: "1.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem", flexWrap: "wrap", gap: 10 }}>
          <label className="ds-label" style={{ margin: 0 }}>Generated Copy Commands</label>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={copyToClipboard} className="ds-btn ds-btn-primary" disabled={!batCommands.trim()}>
              Copy
            </button>
            <button onClick={downloadBatFile} className="ds-btn ds-btn-success" disabled={!batCommands.trim()}>
              Download .bat
            </button>
          </div>
        </div>
        <div className="terminal">
          <div className="terminal__chrome">
            <span className="terminal__dot terminal__dot--violet" />
            <span className="terminal__dot terminal__dot--cyan" />
            <span className="terminal__dot terminal__dot--rose" />
            <span className="terminal__title">copy_files.bat</span>
          </div>
          <textarea
            value={batCommands}
            readOnly
            className="terminal__body terminal__body--readonly terminal__body--scroll-x"
            style={{ minHeight: 200 }}
            spellCheck={false}
            placeholder="Commands will appear here after you paste instructions and enter a target path…"
          />
        </div>
      </div>
    </div>
  );
}
