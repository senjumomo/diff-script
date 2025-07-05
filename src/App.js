import React, { useState } from "react";

// Client paths including Test client with TEST environment
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
  Test: {
    TEST: "Q:\\iThrive\\test\\sql",
  },
};

const clients = Object.keys(clientPaths);
const environments = ["QA", "LIVE"]; // Normal envs

function App() {
  // Initialize environment based on initial client
  const initialClientA = clients[0];
  const initialClientB = clients[1];
  const initialEnvA = initialClientA === "Test" ? "TEST" : "QA";
  const initialEnvB = initialClientB === "Test" ? "TEST" : "LIVE";

  const [inputText, setInputText] = useState("");
  const [outputFiles, setOutputFiles] = useState("");
  const [clientA, setClientA] = useState(initialClientA);
  const [envA, setEnvA] = useState(initialEnvA);
  const [clientB, setClientB] = useState(initialClientB);
  const [envB, setEnvB] = useState(initialEnvB);
  const [diffCommands, setDiffCommands] = useState("");

  const extractFiles = (text) => {
    const matches = text.match(/\b[\w\-_]+\.sql\b/gi);
    return matches || [];
  };

  const updateOutputs = (
    text,
    clientAVal,
    envAVal,
    clientBVal,
    envBVal
  ) => {
    const files = extractFiles(text);
    setOutputFiles(files.join("\n"));

    const pathA =
      clientPaths[clientAVal] &&
      clientPaths[clientAVal][clientAVal === "Test" ? "TEST" : envAVal]
        ? clientPaths[clientAVal][clientAVal === "Test" ? "TEST" : envAVal]
        : "";

    const pathB =
      clientPaths[clientBVal] &&
      clientPaths[clientBVal][clientBVal === "Test" ? "TEST" : envBVal]
        ? clientPaths[clientBVal][clientBVal === "Test" ? "TEST" : envBVal]
        : "";

    if (files.length && pathA && pathB) {
      const diffs = files.map((file) => {
        const diffFile = file.replace(/\.sql$/i, ".diff");
        return `diff -iwc "${pathA}\\${file}" "${pathB}\\${file}" > ${diffFile}`;
      });
      setDiffCommands(diffs.join("\n"));
    } else {
      setDiffCommands("");
    }
  };

  const onInputChange = (e) => {
    const val = e.target.value;
    setInputText(val);
    updateOutputs(val, clientA, envA, clientB, envB);
  };

  const onClientAChange = (e) => {
    const val = e.target.value;
    setClientA(val);
    if (val === "Test") {
      setEnvA("TEST");
      updateOutputs(inputText, val, "TEST", clientB, envB);
    } else {
      setEnvA("QA");
      updateOutputs(inputText, val, "QA", clientB, envB);
    }
  };

  const onEnvAChange = (e) => {
    const val = e.target.value;
    setEnvA(val);
    updateOutputs(inputText, clientA, val, clientB, envB);
  };

  const onClientBChange = (e) => {
    const val = e.target.value;
    setClientB(val);
    if (val === "Test") {
      setEnvB("TEST");
      updateOutputs(inputText, clientA, envA, val, "TEST");
    } else {
      setEnvB("LIVE");
      updateOutputs(inputText, clientA, envA, val, "LIVE");
    }
  };

  const onEnvBChange = (e) => {
    const val = e.target.value;
    setEnvB(val);
    updateOutputs(inputText, clientA, envA, clientB, val);
  };

  const copyToClipboard = () => {
    if (!diffCommands.trim()) return;
    navigator.clipboard.writeText(diffCommands).then(() => {
      alert("Copied diff commands to clipboard!");
    });
  };

  const downloadBatFile = () => {
    if (!diffCommands.trim()) return;
    const blob = new Blob([diffCommands], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "diff_commands.bat";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>Paste your deployment scripts here:</h2>
      <textarea
        value={inputText}
        onChange={onInputChange}
        placeholder="Paste deployment script instructions here"
        style={styles.textarea}
      />

      <h2 style={{ ...styles.heading, marginTop: "2rem" }}>
        Extracted .sql filenames:
      </h2>
      <textarea
        value={outputFiles}
        readOnly
        style={{ ...styles.textarea, backgroundColor: "#222639" }}
      />

      <div style={styles.dropdownContainer}>
        <div style={styles.dropdownBox}>
          <label style={styles.label}>Client A:</label>
          <select value={clientA} onChange={onClientAChange} style={styles.select}>
            {clients.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {clientA !== "Test" && (
          <div style={styles.dropdownBox}>
            <label style={styles.label}>Environment A:</label>
            <select value={envA} onChange={onEnvAChange} style={styles.select}>
              {environments.map((e) => (
                <option key={e} value={e}>{e}</option>
              ))}
            </select>
          </div>
        )}

        <div style={styles.dropdownBox}>
          <label style={styles.label}>Client B:</label>
          <select value={clientB} onChange={onClientBChange} style={styles.select}>
            {clients.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {clientB !== "Test" && (
          <div style={styles.dropdownBox}>
            <label style={styles.label}>Environment B:</label>
            <select value={envB} onChange={onEnvBChange} style={styles.select}>
              {environments.map((e) => (
                <option key={e} value={e}>{e}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div style={{ textAlign: "center", marginTop: "2rem" }}>
        <h2 style={styles.heading}>Generated diff commands:</h2>
        <div style={styles.buttonGroup}>
          <button onClick={copyToClipboard} style={styles.copyButton}>
            Copy
          </button>
          <button onClick={downloadBatFile} style={styles.downloadButton}>
            Download .bat
          </button>
        </div>
      </div>

      <textarea
        value={diffCommands}
        readOnly
        style={styles.diffTextarea}
        spellCheck={false}
      />
    </div>
  );
}

const styles = {
  container: {
    padding: "2rem",
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    background: "#1e1e2f",
    minHeight: "100vh",
    color: "#eee",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  heading: {
    marginBottom: "0.5rem",
    fontWeight: "600",
    textAlign: "center",
  },
  textarea: {
    width: "100%",
    maxWidth: "600px",
    height: "150px",
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
  },
  diffTextarea: {
    width: "100%",
    maxWidth: "900px",
    height: "150px",
    padding: "0.75rem 1rem",
    fontSize: "1rem",
    borderRadius: "8px",
    border: "none",
    boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
    backgroundColor: "#222639",
    color: "#eee",
    resize: "vertical",
    whiteSpace: "nowrap",
    overflowX: "auto",
    fontFamily: "monospace",
  },
  dropdownContainer: {
    display: "flex",
    justifyContent: "center",
    gap: "1rem",
    flexWrap: "wrap",
    maxWidth: "900px",
    marginTop: "1rem",
  },
  dropdownBox: {
    display: "flex",
    flexDirection: "column",
    minWidth: "130px",
  },
  label: {
    marginBottom: "0.25rem",
    fontWeight: "600",
  },
  select: {
    padding: "0.5rem",
    fontSize: "1rem",
    borderRadius: "6px",
    backgroundColor: "#2c2c44",
    color: "#eee",
    border: "none",
    outline: "none",
  },
  buttonGroup: {
    display: "flex",
    gap: "1rem",
    justifyContent: "center",
    marginBottom: "0.5rem",
  },
  copyButton: {
    padding: "0.4rem 1rem",
    fontSize: "1rem",
    fontWeight: "600",
    borderRadius: "6px",
    border: "none",
    backgroundColor: "#3a8bff",
    color: "#fff",
    cursor: "pointer",
  },
  downloadButton: {
    padding: "0.4rem 1rem",
    fontSize: "1rem",
    fontWeight: "600",
    borderRadius: "6px",
    border: "none",
    backgroundColor: "#28c76f",
    color: "#fff",
    cursor: "pointer",
  },
};

export default App;
