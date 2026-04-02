import React, { useState } from "react";

const clientPaths = {
  Bestmed: {
    QA: "Q:\\BestMed\\qa\\sql",
    LIVE: "Q:\\BestMed\\live",
  },
  Ship: {
    QA: "Q:\\SHIP\\qa\\sql",
    LIVE: "Q:\\SHIP\\live\\sql",
  },
  ZMG: {
    QA: "Q:\\ZimGen\\qa\\sql",
    LIVE: "Q:\\ZimGen\\live\\sql",
  },
  ZMZ: {
    QA: "Q:\\ZSIC\\qa\\sql",
    LIVE: "Q:\\ZSIC\\live\\sql",
  },
  HMS: {
    QA: "Q:\\Zimbabwe\\qa\\sql",
    LIVE: "Q:\\Zimbabwe\\live\\sql",
  },
  ZMC: {
    QA: "Q:\\CIMAS\\qa\\sql",
    LIVE: "Q:\\CIMAS\\live\\sql",
  },
  HIP: {
    QA: "Q:\\iThrive\\qa\\sql",
    LIVE: "Q:\\iThrive\\live\\sql",
  },
  MMI: {
    QA: "Q:\\MMI_Africa\\qa\\sql",
    LIVE: "Q:\\MMI_Africa\\live\\sql",
  },
  FML: {
    QA: "Q:\\FML\\qa\\sql",
    LIVE: "Q:\\FML\\live\\sql",
  },
  BONITAS: {
    QA: "Q:\\Bonitas\\qa\\sql",
    LIVE: "Q:\\Bonitas\\live\\sql",
  },
  Test: {
    TEST: "Q:\\iThrive\\test\\sql",
  },
  Regression: {
    REGRESSION: "Q:\\SHIP\\qa\\regression\\deployed\\sql",
  },
};

const clients = Object.keys(clientPaths);
const environments = ["QA", "LIVE"];

const isSingleEnvClient = (client) => client === "Test" || client === "Regression";

const getEnvForClient = (client) =>
  client === "Test" ? "TEST" : client === "Regression" ? "REGRESSION" : "QA";

export default function ExistanceCheckPage({ onBack }) {
  const initialClient = clients[0];
  const [inputText, setInputText] = useState("");
  const [outputFiles, setOutputFiles] = useState("");
  const [client, setClient] = useState(initialClient);
  const [env, setEnv] = useState(getEnvForClient(initialClient));
  const [batCommands, setBatCommands] = useState("");

  const extractFiles = (text) => {
    const matches = text.match(/\b[\w\-_]+\.sql\b/gi);
    if (!matches) return [];
    const seen = new Set();
    return matches.filter((f) => {
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
    const pathA = clientPaths[clientVal]?.[envKey] ?? "";

    if (files.length && pathA) {
      const checks = files.map(
        (file) => `if exist "${pathA}\\${file}" (echo ${file} found) else (echo ${file} not found)`
      );
      setBatCommands(`@echo off\necho Checking files in ${pathA}\n\n${checks.join("\n")}\n\npause`);
    } else {
      setBatCommands("");
    }
  };

  const onInputChange = (e) => {
    const val = e.target.value;
    setInputText(val);
    updateOutputs(val, client, env);
  };

  const onClientChange = (e) => {
    const val = e.target.value;
    setClient(val);
    const newEnv = getEnvForClient(val);
    setEnv(newEnv);
    updateOutputs(inputText, val, newEnv);
  };

  const onEnvChange = (e) => {
    const val = e.target.value;
    setEnv(val);
    updateOutputs(inputText, client, val);
  };

  const copyToClipboard = () => {
    if (!batCommands.trim()) return;
    navigator.clipboard.writeText(batCommands).then(() => alert("Copied to clipboard!"));
  };

  const downloadBatFile = () => {
    if (!batCommands.trim()) return;
    const blob = new Blob([batCommands], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "existance_check.bat";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={styles.container}>
      <div style={styles.headerRow}>
        <button onClick={onBack} style={styles.backButton}>← Back</button>
        <h2 style={{ margin: 0 }}>Existance Check</h2>
      </div>

      <div style={styles.section}>
        <label style={styles.label}>Paste deployment plan:</label>
        <textarea
          value={inputText}
          onChange={onInputChange}
          placeholder="Paste deployment script instructions here"
          style={styles.textarea}
        />
      </div>

      <div style={styles.section}>
        <label style={styles.label}>Extracted .sql filenames:</label>
        <textarea
          value={outputFiles}
          readOnly
          style={{ ...styles.textarea, backgroundColor: "#222639" }}
        />
      </div>

      <div style={styles.dropdownContainer}>
        <div style={styles.dropdownBox}>
          <label style={styles.label}>Client:</label>
          <select value={client} onChange={onClientChange} style={styles.select}>
            {clients.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        {!isSingleEnvClient(client) && (
          <div style={styles.dropdownBox}>
            <label style={styles.label}>Environment:</label>
            <select value={env} onChange={onEnvChange} style={styles.select}>
              {environments.map((e) => (
                <option key={e} value={e}>{e}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div style={styles.section}>
        <label style={styles.label}>Generated existance check commands:</label>
        <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
          <button onClick={copyToClipboard} style={styles.actionButton}>Copy</button>
          <button onClick={downloadBatFile} style={{ ...styles.actionButton, backgroundColor: "#28c76f" }}>
            Download .bat
          </button>
        </div>
        <textarea
          value={batCommands}
          readOnly
          style={{ ...styles.textarea, fontFamily: "monospace", whiteSpace: "nowrap", overflowX: "auto", minHeight: 180 }}
          spellCheck={false}
        />
      </div>
    </div>
  );
}

const styles = {
  container: {
    width: "100%",
    maxWidth: 900,
    color: "#eee",
    display: "flex",
    flexDirection: "column",
    gap: 20,
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
  section: {
    width: "100%",
    display: "flex",
    flexDirection: "column",
  },
  label: {
    fontWeight: 600,
    marginBottom: 6,
    color: "#eee",
  },
  textarea: {
    width: "100%",
    minHeight: 130,
    padding: "0.75rem 1rem",
    fontSize: "1rem",
    borderRadius: 8,
    border: "none",
    backgroundColor: "#2c2c44",
    color: "#eee",
    resize: "vertical",
    boxSizing: "border-box",
  },
  dropdownContainer: {
    display: "flex",
    gap: 16,
    flexWrap: "wrap",
    width: "100%",
  },
  dropdownBox: {
    display: "flex",
    flexDirection: "column",
    minWidth: 130,
  },
  select: {
    padding: "0.5rem",
    fontSize: "1rem",
    borderRadius: 6,
    backgroundColor: "#2c2c44",
    color: "#eee",
    border: "none",
    outline: "none",
  },
  actionButton: {
    padding: "0.4rem 1rem",
    fontSize: "1rem",
    fontWeight: 600,
    borderRadius: 6,
    border: "none",
    backgroundColor: "#3a8bff",
    color: "#fff",
    cursor: "pointer",
  },
};
