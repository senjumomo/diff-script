import React, { useState } from "react";
import { FaGithub } from "react-icons/fa";
import ComparePage from "./ComparePage";


// Client paths including Test and Regression clients with single environments
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
  Test: {
    TEST: "Q:\\iThrive\\test\\sql",
  },
  Regression: {
    REGRESSION: "Q:\\SHIP\\qa\\regression\\deployed\\sql",
  },
};

const clients = Object.keys(clientPaths);
const environments = ["QA", "LIVE"];

const isSingleEnvClient = (client) =>
  client === "Test" || client === "Regression";

const getEnvForClient = (client) =>
  client === "Test"
    ? "TEST"
    : client === "Regression"
    ? "REGRESSION"
    : "QA";

function App() {
  const initialClientA = clients[0];
  const initialClientB = clients[1];
  const initialEnvA = getEnvForClient(initialClientA);
  const initialEnvB = getEnvForClient(initialClientB);

  const [inputText, setInputText] = useState("");
  const [outputFiles, setOutputFiles] = useState("");
  const [clientA, setClientA] = useState(initialClientA);
  const [envA, setEnvA] = useState(initialEnvA);
  const [clientB, setClientB] = useState(initialClientB);
  const [envB, setEnvB] = useState(initialEnvB);
  const [diffCommands, setDiffCommands] = useState("");
  const [diffAllQA, setDiffAllQA] = useState(false);
  const [diffAllProd, setDiffAllProd] = useState(false);
  const [showCompare, setShowCompare] = useState(false);

  const extractFiles = (text) => {
    const matches = text.match(/\b[\w\-_]+\.sql\b/gi);
    return matches || [];
  };

  const updateOutputs = (text, clientAVal, envAVal, clientBVal, envBVal, diffAllQAMode, diffAllProdMode) => {
    const files = extractFiles(text);
    setOutputFiles(files.join("\n"));

    const pathA = clientPaths[clientAVal]?.[envAVal] || "";

    if (!files.length || !pathA) {
      setDiffCommands("");
      return;
    }

    if (diffAllQAMode || diffAllProdMode) {
      // Determine target environment based on which toggle is active
      const targetEnv = diffAllQAMode ? "QA" : "LIVE";
      
      // Diff against all other clients in the target environment
      const targetClients = clients.filter(c => {
        // Exclude the source client
        if (c === clientAVal) return false;
        // Check if the target client has the target environment
        const hasEnv = clientPaths[c]?.[targetEnv];
        return hasEnv !== undefined;
      });

      if (targetClients.length === 0) {
        setDiffCommands("");
        return;
      }

      let allCommands = [];
      
      targetClients.forEach(targetClient => {
        const pathB = clientPaths[targetClient][targetEnv];
        allCommands.push(`\nREM ========================================`);
        allCommands.push(`REM ${clientAVal} (${envAVal}) → ${targetClient} (${targetEnv})`);
        allCommands.push(`REM ========================================`);
        
        files.forEach(file => {
          const diffFile = `${clientAVal}_to_${targetClient}_${file.replace(/\.sql$/i, ".diff")}`;
          allCommands.push(`diff -iwc "${pathA}\\${file}" "${pathB}\\${file}" > ${diffFile}`);
        });
      });

      setDiffCommands(allCommands.join("\n"));
    } else {
      // Original single diff logic
      const pathB = clientPaths[clientBVal]?.[envBVal] || "";
      
      if (pathB) {
        const diffs = files.map((file) => {
          const diffFile = file.replace(/\.sql$/i, ".diff");
          return `diff -iwc "${pathA}\\${file}" "${pathB}\\${file}" > ${diffFile}`;
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
    if (newValue) setDiffAllProd(false); // Only one can be active
    updateOutputs(inputText, clientA, envA, clientB, envB, newValue, false);
  };

  const onDiffAllProdToggle = () => {
    const newValue = !diffAllProd;
    setDiffAllProd(newValue);
    if (newValue) setDiffAllQA(false); // Only one can be active
    updateOutputs(inputText, clientA, envA, clientB, envB, false, newValue);
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
    a.download = `diff_commands_${envA}_${envB}.bat`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={styles.container}>
      <div style={styles.nav}>
        <button onClick={() => setShowCompare(false)} style={styles.navButton}>Home</button>
        <button onClick={() => setShowCompare(true)} style={styles.navButton}>Compare Plans</button>
      </div>

      {showCompare ? (
        <ComparePage onBack={() => setShowCompare(false)} />
      ) : (
        <>

      {/* GitHub clickable text */}
      <a
        href="https://github.com/senjumomo"
        target="_blank"
        rel="noopener noreferrer"
        style={styles.githubLink}
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <FaGithub size={28} /> {/* adjust the size as you like */}
          <div style={{ marginTop: '5px', fontSize: '14px' }}>My GitHub</div>
        </div>
      </a>

      <h2 style={styles.heading}>Paste your deployment scripts here:</h2>
      
      <div style={styles.topContainer}>
        <textarea
          value={inputText}
          onChange={onInputChange}
          placeholder="Paste deployment script instructions here"
          style={styles.textarea}
        />
      </div>

      <div style={styles.optionsPaneContainer}>
        <div style={styles.optionsPane}>
          <h3 style={styles.optionsPaneTitle}>Options</h3>
          
          {/* Toggle for diff all QA clients */}
          <div style={styles.toggleBox}>
            <label style={styles.label}>
              <input
                type="checkbox"
                checked={diffAllQA}
                onChange={onDiffAllQAToggle}
                style={styles.checkbox}
              />
              Diff against all QA environments
            </label>
          </div>

          {/* Toggle for diff all LIVE clients */}
          <div style={styles.toggleBox}>
            <label style={styles.label}>
              <input
                type="checkbox"
                checked={diffAllProd}
                onChange={onDiffAllProdToggle}
                style={styles.checkbox}
              />
              Diff against all LIVE environments
            </label>
          </div>
        </div>
      </div>

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

        {!isSingleEnvClient(clientA) && (
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

        {!isSingleEnvClient(clientB) && (
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
        </>
      )}
    </div>
  );
}

const styles = {
  githubLink: {
    color: "#eee",
    textDecoration: "none",
    fontWeight: "bold",
    fontSize: "1rem",
    marginBottom: "1rem",
    transition: "color 0.2s",
  },
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
  nav: {
    width: "100%",
    maxWidth: 900,
    display: "flex",
    gap: 8,
    justifyContent: "flex-start",
    marginBottom: 12,
  },
  navButton: {
    padding: "0.35rem 0.6rem",
    borderRadius: 6,
    backgroundColor: "#3a3f5a",
    border: "none",
    color: "#fff",
    cursor: "pointer",
  },
  textarea: {
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
  },
  diffTextarea: {
    width: "100%",
    maxWidth: "900px",
    minHeight: "420px",
    maxHeight: "900px",
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
  topContainer: {
    display: "flex",
    justifyContent: "center",
    width: "100%",
    alignItems: "center",
  },
  optionsPaneContainer: {
    position: "fixed",
    right: "2rem",
    top: "50%",
    transform: "translateY(-50%)",
    zIndex: 1000,
  },
  dropdownContainer: {
    display: "flex",
    justifyContent: "center",
    gap: "1rem",
    flexWrap: "wrap",
    maxWidth: "900px",
    marginTop: "1rem",
  },
  optionsPane: {
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
    padding: "1.5rem",
    backgroundColor: "#2c2c44",
    borderRadius: "8px",
    boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
    minWidth: "250px",
    maxWidth: "300px",
    height: "fit-content",
  },
  optionsPaneTitle: {
    margin: "0 0 0.5rem 0",
    fontSize: "1.2rem",
    fontWeight: "600",
    color: "#eee",
    borderBottom: "2px solid #3a8bff",
    paddingBottom: "0.5rem",
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
  toggleBox: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    minWidth: "200px",
    padding: "0.5rem",
    backgroundColor: "#2c2c44",
    borderRadius: "6px",
  },
  checkbox: {
    marginRight: "0.5rem",
    width: "18px",
    height: "18px",
    cursor: "pointer",
  },
};

export default App;
