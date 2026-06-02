import React, { useState } from "react";
import { clientPaths } from "./clients";

const clientEnvPrefixes = {
  BONITAS: "BHIP", HIP: "HIP", HMS: "HMS", ZMC: "ZMC", ZMG: "ZMG",
  ZMZ: "ZMZ", Ship: "SHIP", Bestmed: "BIT", MMI: "MMI", FML: "FML",
};

const selectableClients = Object.keys(clientPaths).filter(
  c => c !== "Test" && c !== "Regression" && c !== "ALL"
);

const envMap = { approval: "QA", approvalprod: "PROD", uat: "UAT", qa: "QA", prod: "PROD" };

const emailTypeOptions = [
  { value: "approval",    label: "Approval (to QA)" },
  { value: "approvalprod",label: "Approval (to PROD)" },
  { value: "uat",         label: "Deploy → UAT" },
  { value: "qa",          label: "Deploy → QA" },
  { value: "prod",        label: "Deploy → PROD" },
];

export default function DeploymentEmailPage({ onBack, showToast }) {
  const [recipient, setRecipient]         = useState("");
  const [scriptName, setScriptName]       = useState("");
  const [scriptContents, setScriptContents] = useState("");
  const [client, setClient]               = useState(selectableClients[0]);
  const [deployOnly, setDeployOnly]       = useState(false);
  const [emailType, setEmailType]         = useState("approval");

  const handleEmailTypeChange = (e) => {
    const newType = e.target.value;
    setEmailType(newType);
    if (newType === "approval" || newType === "approvalprod") setDeployOnly(false);
  };

  const getGreeting = () =>
    recipient.trim().toLowerCase() === "there" || !recipient.trim()
      ? "Hi There,"
      : `Hi ${recipient.trim()},`;

  const getBody = () => {
    const prefix   = clientEnvPrefixes[client] || client;
    const envType  = envMap[emailType] || "QA";
    const envLabel = prefix + envType;
    let intro = "", attachLine = "";

    if (emailType === "approval") {
      intro      = `Please find the deployment plan below for [Jira/Description], and please provide signoff to take the script to ${envLabel}.`;
      attachLine = "Diffs: link\nTesting: link";
    } else if (emailType === "approvalprod") {
      intro      = `Please find the deployment plan below for [Jira/Description], and please provide signoff to take the script to ${envLabel}.`;
      attachLine = "Client Signoff: Link\nTesting: link\nDiffs: link";
    } else if (emailType === "uat") {
      intro      = `Please can we deploy the below script from Test to UAT.`;
      attachLine = "Approval: link";
    } else if (emailType === "qa") {
      intro      = `Please can we deploy the below script from UAT to ${envLabel}.`;
      attachLine = "Approval: link";
    } else if (emailType === "prod") {
      intro      = `Please can we deploy the below script from ${prefix}QA to ${prefix}PROD as part of Weekly deployments on [Deployment Date].`;
      attachLine = "Approval: link";
    }
    const deployOnlyLine = deployOnly ? "\n\nNB: To only deploy the script and not run or deploy the items." : "";
    return `${getGreeting()}\n\n${intro}${deployOnlyLine}\n\nDeployment Plan: ${scriptName || "[plan name]"}\n\n${attachLine}\n\nOps:\n\n${scriptContents || "--Regression Version\nD(S): s_online_member_body.sql MAL"}\n\nKind Regards,`;
  };

  const copyEmail = () => {
    navigator.clipboard.writeText(getBody()).then(() => {
      if (showToast) showToast("Email copied to clipboard!", "success");
    });
  };

  return (
    <div className="fade-up" style={{ maxWidth: 820, margin: "0 auto" }}>

      {/* Header */}
      <div style={{ marginBottom: "2rem" }}>
        <h1 className="ds-section-title">Deployment Email</h1>
        <p style={{ color: "var(--text-muted)", margin: 0, fontSize: "0.95rem" }}>
          Build standardised deployment emails instantly — fill in the fields and copy.
        </p>
      </div>

      {/* Form Card */}
      <div className="glass-card" style={{ padding: "1.5rem", marginBottom: "1rem" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
          <div>
            <label className="ds-label">Recipient Name</label>
            <input
              value={recipient}
              onChange={e => setRecipient(e.target.value)}
              className="ds-input"
              placeholder="e.g. Aimee, Muhammad, There"
            />
          </div>
          <div>
            <label className="ds-label">Script / Plan Name</label>
            <input
              value={scriptName}
              onChange={e => setScriptName(e.target.value)}
              className="ds-input"
              placeholder="e.g. 20260327_690SC_regression.deploy"
            />
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
          <div>
            <label className="ds-label">Email Type</label>
            <select value={emailType} onChange={handleEmailTypeChange} className="ds-select">
              {emailTypeOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div>
            <label className="ds-label">Client</label>
            <select value={client} onChange={e => setClient(e.target.value)} className="ds-select">
              {selectableClients.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        {emailType !== "approval" && emailType !== "approvalprod" && (
          <label className="ds-checkbox-row" style={{ marginBottom: "1rem" }}>
            <input type="checkbox" checked={deployOnly} onChange={e => setDeployOnly(e.target.checked)} />
            <span style={{ fontSize: "0.9rem", color: "var(--text-muted)" }}>Deploy script <strong style={{ color: "var(--primary-light)" }}>ONLY</strong> (do not run)</span>
          </label>
        )}

        <div>
          <label className="ds-label">Script Contents (Ops)</label>
          <textarea
            value={scriptContents}
            onChange={e => setScriptContents(e.target.value)}
            className="ds-textarea"
            placeholder={"--Regression Version\nD(S): s_online_member_body.sql MAL"}
            style={{ minHeight: 120, fontFamily: "'JetBrains Mono', monospace", fontSize: "0.82rem" }}
          />
        </div>
      </div>

      {/* Preview + Copy */}
      <div className="glass-card" style={{ padding: "1.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem", flexWrap: "wrap", gap: 10 }}>
          <label className="ds-label" style={{ margin: 0 }}>Email Preview</label>
          <button onClick={copyEmail} className="ds-btn ds-btn-primary">
            Copy Email
          </button>
        </div>
        <textarea
          value={getBody()}
          readOnly
          className="ds-textarea"
          style={{
            minHeight: 420,
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "0.82rem",
            background: "rgba(0,0,0,0.25)",
            lineHeight: 1.75,
            resize: "vertical",
          }}
        />
      </div>
    </div>
  );
}
