import React, { useState } from "react";
import PageHeader from "./PageHeader";
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

export default function DeploymentEmailPage({ showToast }) {
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
    <div className="page">

      <PageHeader
        eyebrow="Comms"
        title="Deployment Email"
        description="Build standardised deployment emails — fill in the fields and copy."
      />

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
          <label className="toggle-row" style={{ marginBottom: "1rem" }}>
            <input type="checkbox" checked={deployOnly} onChange={e => setDeployOnly(e.target.checked)} />
            <span className="toggle-track" />
            <span className="toggle-label">Deploy script <strong>ONLY</strong> (do not run)</span>
          </label>
        )}

        <div>
          <label className="ds-label">Script Contents (Ops)</label>
          <textarea
            value={scriptContents}
            onChange={e => setScriptContents(e.target.value)}
            className="ds-textarea ds-textarea--mono"
            placeholder={"--Regression Version\nD(S): s_online_member_body.sql MAL"}
            style={{ minHeight: 120 }}
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
        <div className="terminal">
          <div className="terminal__chrome">
            <span className="terminal__dot terminal__dot--violet" />
            <span className="terminal__dot terminal__dot--cyan" />
            <span className="terminal__dot terminal__dot--rose" />
            <span className="terminal__title">email_preview.txt</span>
          </div>
          <textarea
            value={getBody()}
            readOnly
            className="terminal__body terminal__body--readonly"
            style={{ minHeight: 420, resize: "vertical" }}
          />
        </div>
      </div>
    </div>
  );
}
