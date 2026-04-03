import React, { useState } from "react";


// Map client name to environment prefix for email (special cases for BONITAS → BHIP, etc)
const clientEnvPrefixes = {
  BONITAS: "BHIP",
  HIP: "HIP",
  HMS: "HMS",
  ZMC: "ZMC",
  ZMG: "ZMG",
  ZMZ: "ZMZ",
  Ship: "SHIP",
  Bestmed: "BIT",
  MMI: "MMI",
  FML: "FML",
};

// Import clientPaths from App.js (copy-paste, since no module system)
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

// Build environment options like ZMCQA, ZMCPROD, BHIPQA, BHIPPROD, etc.
const selectableClients = Object.keys(clientPaths).filter((client) => client !== "Test" && client !== "Regression");

const envMap = {
  approval: "QA",
  approvalprod: "PROD",
  uat: "UAT",
  qa: "QA",
  prod: "PROD"
};

export default function DeploymentEmailPage({ onBack }) {

  const [recipient, setRecipient] = useState("");
  const [scriptName, setScriptName] = useState("");
  const [scriptContents, setScriptContents] = useState("");
  const [client, setClient] = useState(selectableClients[0]);
  const [deployOnly, setDeployOnly] = useState(false);
  const [emailType, setEmailType] = useState("approval"); // approval, uat, qa

  // Clear deployOnly if switching to approval or approvalprod
  const handleEmailTypeChange = (e) => {
    const newType = e.target.value;
    setEmailType(newType);
    if (newType === "approval" || newType === "approvalprod") {
      setDeployOnly(false);
    }
  };

  const getGreeting = () => {
    if (recipient.trim().toLowerCase() === "there" || !recipient.trim()) return "Hi There,";
    return `Hi ${recipient.trim()},`;
  };

  const getBody = () => {
    let intro = "";
    let attachLine = "";
    const prefix = clientEnvPrefixes[client] || client;
    const envType = envMap[emailType] || "QA";
    const envLabel = prefix + envType;
    if (emailType === "approval") {
      intro = `Please find the deployment plan below for [Jira/Description], and please provide signoff to take the script to ${envLabel}.`;
      attachLine = "Diffs: link\nTesting: link";
    } else if (emailType === "approvalprod") {
      intro = `Please find the deployment plan below for [Jira/Description], and please provide signoff to take the script to ${envLabel}.`;
      attachLine = "Client Signoff: Link\nTesting: link\nDiffs: link";
    } else if (emailType === "uat") {
      intro = `Please can we deploy the below script from Test to UAT.`;
      attachLine = "Approval: link";
    } else if (emailType === "qa") {
      intro = `Please can we deploy the below script from UAT to ${envLabel}.`;
      attachLine = "Approval: link";
    } else if (emailType === "prod") {
      // For PROD, show source as QA and target as PROD, with date placeholder
      const sourceEnv = prefix + "QA";
      const targetEnv = prefix + "PROD";
      intro = `Please can we deploy the below script from ${sourceEnv} to ${targetEnv} as part of Weekly deployments on [Deployment Date].`;
      attachLine = "Approval: link";
    }
    let deployOnlyLine = deployOnly ? "\n\nNB: To only deploy the script and not run or deploy the items." : "";
    return `${getGreeting()}

${intro}${deployOnlyLine}

Deployment Plan: ${scriptName || "[plan name]"}

${attachLine}

Ops:\n\n${scriptContents || "--Regression Version\nD(S): s_online_member_body.sql MAL"}

Kind Regards,`;
  };

  return (
    <div style={styles.container}>
      <div style={styles.headerRow}>
        <h2 style={{ margin: 0, textAlign: "center", width: "100%" }}>Deployment Email Builder</h2>
      </div>
      <div style={styles.formRow}>
        <label style={styles.label}>Recipient Name:</label>
        <input value={recipient} onChange={e => setRecipient(e.target.value)} style={styles.input} placeholder="e.g. Aimee, Muhammad, There" />
      </div>
      <div style={styles.formRow}>
        <label style={styles.label}>Script/Plan Name:</label>
        <input value={scriptName} onChange={e => setScriptName(e.target.value)} style={styles.input} placeholder="e.g. 20260327_690SC_MMH10435_regression_versions.deploy" />
      </div>
      <div style={{...styles.formRow, flexDirection: "row", gap: 24, alignItems: "flex-end"}}>
        <div style={{flex: 1, display: "flex", flexDirection: "column"}}>
          <label style={styles.label}>Email Type:</label>
          <select value={emailType} onChange={handleEmailTypeChange} style={styles.input}>
            <option value="approval">Approval (to QA)</option>
            <option value="approvalprod">Approval (to PROD)</option>
            <option value="uat">Deploy to UAT</option>
            <option value="qa">Deploy to QA</option>
            <option value="prod">Deploy to PROD</option>
          </select>
        </div>
        <div style={{flex: 1, display: "flex", flexDirection: "column"}}>
          <label style={styles.label}>Client:</label>
          <select value={client} onChange={e => setClient(e.target.value)} style={styles.input}>
            {selectableClients.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>
      {(emailType !== "approval" && emailType !== "approvalprod") && (
        <div style={styles.formRow}>
          <label style={styles.label}><input type="checkbox" checked={deployOnly} onChange={e => setDeployOnly(e.target.checked)} /> Deploy script ONLY</label>
        </div>
      )}
      <div style={styles.formRow}>
        <label style={styles.label}>Script Contents (Ops):</label>
        <textarea value={scriptContents} onChange={e => setScriptContents(e.target.value)} style={styles.textarea} placeholder={"--Regression Version\nD(S): s_online_member_body.sql MAL"} />
      </div>
      <div style={styles.formRow}>
        <button onClick={() => {navigator.clipboard.writeText(getBody()); alert("Email copied!");}} style={styles.copyButton}>Copy Email</button>
      </div>
      <div style={styles.formRow}>
        <label style={styles.label}>Preview:</label>
        <textarea value={getBody()} readOnly style={{...styles.textarea, backgroundColor: "#222639", minHeight: 500}} />
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
    marginLeft: 220, // SideMenu width
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
  formRow: {
    width: "100%",
    marginBottom: 14,
    display: "flex",
    flexDirection: "column",
  },
  label: {
    fontWeight: 600,
    marginBottom: 6,
    color: "#eee",
  },
  input: {
    padding: "0.5rem",
    fontSize: "1rem",
    borderRadius: 6,
    backgroundColor: "#2c2c44",
    color: "#eee",
    border: "none",
    outline: "none",
    marginBottom: 2,
  },
  textarea: {
    width: "100%",
    minHeight: 50,
    padding: "0.75rem 1rem",
    fontSize: "1rem",
    borderRadius: 8,
    border: "none",
    backgroundColor: "#2c2c44",
    color: "#eee",
    resize: "vertical",
    boxSizing: "border-box",
    fontFamily: "inherit",
  },
  copyButton: {
    padding: "0.4rem 1rem",
    fontSize: "1rem",
    fontWeight: 600,
    borderRadius: 6,
    border: "none",
    backgroundColor: "#3a8bff",
    color: "#fff",
    cursor: "pointer",
    marginTop: 8,
    alignSelf: "flex-start",
  },
};
