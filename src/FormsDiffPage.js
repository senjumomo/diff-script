import React, { useState, useMemo, useCallback } from "react";
import JSZip from "jszip";
import PageHeader from "./PageHeader";
import { clientPaths, clients, environments, getFormsPath } from "./clients";

const filteredClients = clients.filter(c => c !== "ALL");

const isSingleEnvClient = (client) =>
  client === "Test" || client === "Regression";

const getEnvForClient = (client) =>
  client === "Test"
    ? "TEST"
    : client === "Regression"
    ? "REGRESSION"
    : "QA";

export default function FormsDiffPage({ showToast }) {
  const initialClientA = filteredClients[0];
  const initialClientB = filteredClients[1] || filteredClients[0];
  const initialEnvA = getEnvForClient(initialClientA);
  const initialEnvB = getEnvForClient(initialClientB);

  const [inputText, setInputText]             = useState("");
  const [clientA, setClientA]                 = useState(initialClientA);
  const [envA, setEnvA]                       = useState(initialEnvA);
  const [clientB, setClientB]                 = useState(initialClientB);
  const [envB, setEnvB]                       = useState(initialEnvB);
  const [diffAllQA, setDiffAllQA]             = useState(false);
  const [diffAllProd, setDiffAllProd]         = useState(false);
  const [outputSubfolder, setOutputSubfolder] = useState("diffs");
  const [isZipping, setIsZipping]             = useState(false);

  const extractFmbFiles = (text) => {
    const matches = text.match(/\b[\w\-_]+(?:\.fmb)?\b/gi);
    if (!matches) return [];
    const seen = new Set();
    const result = [];
    matches.forEach(item => {
      const trimmed = item.trim();
      if (!trimmed || trimmed.toLowerCase() === "fmb" || trimmed.length < 3) return;
      const fmbName = trimmed.toLowerCase().endsWith(".fmb") ? trimmed : `${trimmed}.fmb`;
      const key = fmbName.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        result.push(fmbName);
      }
    });
    return result;
  };

  const detectedForms = useMemo(() => extractFmbFiles(inputText), [inputText]);

  const sourceFormsPath = useMemo(() => {
    const envKey = isSingleEnvClient(clientA) ? getEnvForClient(clientA) : envA;
    const rawPath = clientPaths[clientA]?.[envKey] || "";
    return getFormsPath(rawPath);
  }, [clientA, envA]);

  const targetFormsPath = useMemo(() => {
    const envKey = isSingleEnvClient(clientB) ? getEnvForClient(clientB) : envB;
    const rawPath = clientPaths[clientB]?.[envKey] || "";
    return getFormsPath(rawPath);
  }, [clientB, envB]);

  const folderName = outputSubfolder.trim() || "diffs";

  const generateBatchScript = useCallback(() => {
    if (!detectedForms.length) return "";

    const lines = [];
    lines.push("@echo off");
    lines.push("setlocal enabledelayedexpansion");
    lines.push('cd /d "%~dp0"');
    lines.push("");
    lines.push("REM ========================================================");
    lines.push("REM  Oracle Forms Diff Script");
    lines.push(`REM  Generated: ${new Date().toLocaleString()}`);
    lines.push(`REM  Source: ${clientA} (${isSingleEnvClient(clientA) ? getEnvForClient(clientA) : envA})`);
    if (diffAllQA) {
      lines.push(`REM  Target: All QA Environments`);
    } else if (diffAllProd) {
      lines.push(`REM  Target: All LIVE Environments`);
    } else {
      lines.push(`REM  Target: ${clientB} (${isSingleEnvClient(clientB) ? getEnvForClient(clientB) : envB})`);
    }
    lines.push(`REM  Forms to diff: ${detectedForms.length}`);
    lines.push("REM ========================================================");
    lines.push("");
    lines.push("REM ==== Set Directories (Separates Diffs from _src/_tgt reports) ====");
    lines.push(`set "DIFF_DIR=%~dp0${folderName}"`);
    lines.push('set "WORK_DIR=%~dp0work"');
    lines.push('if not exist "!DIFF_DIR!" mkdir "!DIFF_DIR!"');
    lines.push('if not exist "!WORK_DIR!" mkdir "!WORK_DIR!"');
    lines.push("");
    lines.push("REM ==== Set Oracle Forms 12c Environment & Library Paths ====");
    lines.push('if exist "C:\\Oracle\\product\\fb01" (');
    lines.push('    set "ORACLE_HOME=C:\\Oracle\\product\\fb01"');
    lines.push('    set "PATH=C:\\Oracle\\product\\fb01\\bin;!PATH!"');
    lines.push(")");
    lines.push('if exist "C:\\Oracle\\config\\applications\\fb01\\Forms1" (');
    lines.push('    set "FORMS_INSTANCE=C:\\Oracle\\config\\applications\\fb01\\Forms1"');
    lines.push(")");
    lines.push("");
    lines.push("REM ==== Discover Compiler (frmcmp) ====");
    lines.push('if exist "C:\\Oracle\\product\\fb01\\bin\\frmcmp.exe" (');
    lines.push('    set "FRMCMP_BIN=C:\\Oracle\\product\\fb01\\bin\\frmcmp.exe"');
    lines.push(') else if exist "%~dp0frmcmp12.lnk" (');
    lines.push('    set "FRMCMP_BIN=%~dp0frmcmp12.lnk"');
    lines.push(') else if exist "\\\\oldfort\\Public\\dev\\iThrive\\test\\Form Diff\\frmcmp12.lnk" (');
    lines.push('    set "FRMCMP_BIN=\\\\oldfort\\Public\\dev\\iThrive\\test\\Form Diff\\frmcmp12.lnk"');
    lines.push(") else (");
    lines.push('    set "FRMCMP_BIN=frmcmp"');
    lines.push(")");
    lines.push("");
    lines.push("REM ==== Discover Diff Tool ====");
    lines.push('if exist "%~dp0diff.exe" (');
    lines.push('    set "DIFF_BIN=%~dp0diff.exe"');
    lines.push(') else if exist "L:\\unixutils\\diff.exe" (');
    lines.push('    set "DIFF_BIN=L:\\unixutils\\diff.exe"');
    lines.push(') else if exist "\\\\oldfort\\Public\\dev\\iThrive\\test\\Form Diff\\diff.exe" (');
    lines.push('    set "DIFF_BIN=\\\\oldfort\\Public\\dev\\iThrive\\test\\Form Diff\\diff.exe"');
    lines.push(") else (");
    lines.push('    set "DIFF_BIN=diff"');
    lines.push(")");
    lines.push("");
    lines.push("echo.");
    lines.push("echo ========================================================");
    lines.push("echo  Starting Oracle Forms Diff");
    lines.push('echo  Diff Output Folder: "!DIFF_DIR!"');
    lines.push('echo  Work / Reports Folder: "!WORK_DIR!"');
    lines.push("echo ========================================================");
    lines.push("");

    const srcPath = sourceFormsPath;

    if (diffAllQA || diffAllProd) {
      const targetEnv = diffAllQA ? "QA" : "LIVE";
      const targetClients = filteredClients.filter(c => {
        if (c === clientA) return false;
        return clientPaths[c]?.[targetEnv] !== undefined;
      });

      targetClients.forEach(tClient => {
        const rawTgt = clientPaths[tClient]?.[targetEnv] || "";
        const tPath = getFormsPath(rawTgt);

        lines.push(`REM ========================================================`);
        lines.push(`REM Route: ${clientA} -> ${tClient} (${targetEnv})`);
        lines.push(`REM ========================================================`);
        lines.push(`set "SRC_DIR=${srcPath}"`);
        lines.push(`set "TGT_DIR=${tPath}"`);
        lines.push(`set "FORMS_PATH=%~dp0;!SRC_DIR!;!TGT_DIR!;C:\\Oracle\\product\\fb01\\forms"`);
        lines.push(`echo.`);
        lines.push(`echo === Comparing to ${tClient} (${targetEnv}) ===`);
        lines.push("");

        detectedForms.forEach(formFile => {
          const baseName = formFile.replace(/\.fmb$/i, "");
          const targetTag = `${baseName}_${clientA}_to_${tClient}`;

          lines.push(`echo [FORM] ${formFile} (${clientA} vs ${tClient})...`);
          lines.push(`if not exist "!SRC_DIR!\\${formFile}" (`);
          lines.push(`    echo [ERROR] Source file not found: "!SRC_DIR!\\${formFile}"`);
          lines.push(`    goto skip_${targetTag}`);
          lines.push(`)`);
          lines.push(`if not exist "!TGT_DIR!\\${formFile}" (`);
          lines.push(`    echo [ERROR] Target file not found: "!TGT_DIR!\\${formFile}"`);
          lines.push(`    goto skip_${targetTag}`);
          lines.push(`)`);
          lines.push(`copy /y "!SRC_DIR!\\${formFile}" "!WORK_DIR!\\${targetTag}_src.fmb" >nul`);
          lines.push(`copy /y "!TGT_DIR!\\${formFile}" "!WORK_DIR!\\${targetTag}_tgt.fmb" >nul`);
          lines.push(`"!FRMCMP_BIN!" logon=no MODULE="!WORK_DIR!\\${targetTag}_src.fmb" batch=yes module_type=FORM compile_all=no forms_doc=yes window_state=minimize`);
          lines.push(`"!FRMCMP_BIN!" logon=no MODULE="!WORK_DIR!\\${targetTag}_tgt.fmb" batch=yes module_type=FORM compile_all=no forms_doc=yes window_state=minimize`);
          lines.push(`if not exist "!WORK_DIR!\\${targetTag}_src.txt" (`);
          lines.push(`    echo [ERROR] Failed to generate !WORK_DIR!\\${targetTag}_src.txt`);
          lines.push(`)`);
          lines.push(`if not exist "!WORK_DIR!\\${targetTag}_tgt.txt" (`);
          lines.push(`    echo [ERROR] Failed to generate !WORK_DIR!\\${targetTag}_tgt.txt`);
          lines.push(`)`);
          lines.push(`"!DIFF_BIN!" -wic "!WORK_DIR!\\${targetTag}_src.txt" "!WORK_DIR!\\${targetTag}_tgt.txt" > "!DIFF_DIR!\\${targetTag}.diff"`);
          lines.push(`if exist "!DIFF_DIR!\\${targetTag}.diff" (`);
          lines.push(`    echo [SUCCESS] Generated: !DIFF_DIR!\\${targetTag}.diff`);
          lines.push(`)`);
          lines.push(`if exist "!WORK_DIR!\\${targetTag}_src.fmb" del "!WORK_DIR!\\${targetTag}_src.fmb"`);
          lines.push(`if exist "!WORK_DIR!\\${targetTag}_tgt.fmb" del "!WORK_DIR!\\${targetTag}_tgt.fmb"`);
          lines.push(`if exist "!WORK_DIR!\\${targetTag}_src.err" del "!WORK_DIR!\\${targetTag}_src.err"`);
          lines.push(`if exist "!WORK_DIR!\\${targetTag}_tgt.err" del "!WORK_DIR!\\${targetTag}_tgt.err"`);
          lines.push(`:skip_${targetTag}`);
          lines.push("");
        });
      });
    } else {
      const tgtPath = targetFormsPath;
      lines.push(`set "SRC_DIR=${srcPath}"`);
      lines.push(`set "TGT_DIR=${tgtPath}"`);
      lines.push(`set "FORMS_PATH=%~dp0;!SRC_DIR!;!TGT_DIR!;C:\\Oracle\\product\\fb01\\forms"`);
      lines.push("");

      detectedForms.forEach(formFile => {
        const baseName = formFile.replace(/\.fmb$/i, "");

        lines.push(`echo [FORM] Comparing ${formFile}...`);
        lines.push(`if not exist "!SRC_DIR!\\${formFile}" (`);
        lines.push(`    echo [ERROR] Source file not found: "!SRC_DIR!\\${formFile}"`);
        lines.push(`    goto skip_${baseName}`);
        lines.push(`)`);
        lines.push(`if not exist "!TGT_DIR!\\${formFile}" (`);
        lines.push(`    echo [ERROR] Target file not found: "!TGT_DIR!\\${formFile}"`);
        lines.push(`    goto skip_${baseName}`);
        lines.push(`)`);
        lines.push(`copy /y "!SRC_DIR!\\${formFile}" "!WORK_DIR!\\${baseName}_src.fmb" >nul`);
        lines.push(`copy /y "!TGT_DIR!\\${formFile}" "!WORK_DIR!\\${baseName}_tgt.fmb" >nul`);
        lines.push(`"!FRMCMP_BIN!" logon=no MODULE="!WORK_DIR!\\${baseName}_src.fmb" batch=yes module_type=FORM compile_all=no forms_doc=yes window_state=minimize`);
        lines.push(`"!FRMCMP_BIN!" logon=no MODULE="!WORK_DIR!\\${baseName}_tgt.fmb" batch=yes module_type=FORM compile_all=no forms_doc=yes window_state=minimize`);
        lines.push(`if not exist "!WORK_DIR!\\${baseName}_src.txt" (`);
        lines.push(`    echo [ERROR] Failed to generate !WORK_DIR!\\${baseName}_src.txt. Check !WORK_DIR!\\${baseName}_src.err if present.`);
        lines.push(`)`);
        lines.push(`if not exist "!WORK_DIR!\\${baseName}_tgt.txt" (`);
        lines.push(`    echo [ERROR] Failed to generate !WORK_DIR!\\${baseName}_tgt.txt. Check !WORK_DIR!\\${baseName}_tgt.err if present.`);
        lines.push(`)`);
        lines.push(`"!DIFF_BIN!" -wic "!WORK_DIR!\\${baseName}_src.txt" "!WORK_DIR!\\${baseName}_tgt.txt" > "!DIFF_DIR!\\${baseName}.diff"`);
        lines.push(`if exist "!DIFF_DIR!\\${baseName}.diff" (`);
        lines.push(`    echo [SUCCESS] Generated: !DIFF_DIR!\\${baseName}.diff`);
        lines.push(`)`);
        lines.push(`if exist "!WORK_DIR!\\${baseName}_src.fmb" del "!WORK_DIR!\\${baseName}_src.fmb"`);
        lines.push(`if exist "!WORK_DIR!\\${baseName}_tgt.fmb" del "!WORK_DIR!\\${baseName}_tgt.fmb"`);
        lines.push(`if exist "!WORK_DIR!\\${baseName}_src.err" del "!WORK_DIR!\\${baseName}_src.err"`);
        lines.push(`if exist "!WORK_DIR!\\${baseName}_tgt.err" del "!WORK_DIR!\\${baseName}_tgt.err"`);
        lines.push(`:skip_${baseName}`);
        lines.push("");
      });
    }

    if (!diffAllQA && !diffAllProd && detectedForms.length === 1) {
      const singleBase = detectedForms[0].replace(/\.fmb$/i, "");
      lines.push('if exist "%~dp0ExamDiff.exe" (');
      lines.push('    echo.');
      lines.push('    echo Opening visual comparison in ExamDiff...');
      lines.push(`    start "" "%~dp0ExamDiff.exe" "!WORK_DIR!\\${singleBase}_src.txt" "!WORK_DIR!\\${singleBase}_tgt.txt"`);
      lines.push(')');
    }

    lines.push("echo.");
    lines.push("echo ========================================================");
    lines.push("echo  Diffing complete!");
    lines.push('echo  - Diff files saved in: "!DIFF_DIR!"');
    lines.push('echo  - Source/Target reports in: "!WORK_DIR!"');
    lines.push("echo ========================================================");
    lines.push('start "" explorer.exe "!DIFF_DIR!"');
    lines.push("pause");

    return lines.join("\n");
  }, [detectedForms, sourceFormsPath, targetFormsPath, clientA, envA, clientB, envB, diffAllQA, diffAllProd, folderName]);

  const batContent = useMemo(() => generateBatchScript(), [generateBatchScript]);

  const copyToClipboard = () => {
    if (!batContent.trim()) return;
    navigator.clipboard.writeText(batContent).then(() => {
      if (showToast) showToast("Forms diff script copied!", "success");
    });
  };

  const downloadBatFile = () => {
    if (!batContent.trim()) return;
    const blob = new Blob([batContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `forms_diff_${clientA}_${diffAllQA ? "ALL_QA" : diffAllProd ? "ALL_LIVE" : clientB}.bat`;
    a.click();
    URL.revokeObjectURL(url);
    if (showToast) showToast("Forms diff .bat downloaded!", "success");
  };

  const downloadZipBundle = async () => {
    if (!batContent.trim()) return;
    setIsZipping(true);
    try {
      const zip = new JSZip();
      const batFilename = `run_diff.bat`;
      zip.file(batFilename, batContent);

      const publicUrl = process.env.PUBLIC_URL || "";
      const toolFiles = ["diff.exe", "ExamDiff.exe", "frmcmp12.lnk"];

      for (const tool of toolFiles) {
        try {
          const res = await fetch(`${publicUrl}/tools/${tool}`);
          if (res.ok) {
            const blob = await res.blob();
            zip.file(tool, blob);
          }
        } catch (err) {
          console.warn(`Could not bundle ${tool}:`, err);
        }
      }

      const zipBlob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `forms_diff_package_${clientA}_vs_${diffAllQA ? "ALL_QA" : diffAllProd ? "ALL_LIVE" : clientB}.zip`;
      a.click();
      URL.revokeObjectURL(url);
      if (showToast) showToast("ZIP package downloaded (contains diff.exe, ExamDiff, & run_diff.bat)!", "success");
    } catch (err) {
      console.error("ZIP creation error:", err);
      if (showToast) showToast("Failed to create ZIP package", "error");
    } finally {
      setIsZipping(false);
    }
  };

  const onClientAChange = (e) => {
    const val = e.target.value;
    setClientA(val);
    setEnvA(getEnvForClient(val));
  };

  const onClientBChange = (e) => {
    const val = e.target.value;
    setClientB(val);
    setEnvB(getEnvForClient(val));
  };

  const onDiffAllQAToggle = () => {
    const val = !diffAllQA;
    setDiffAllQA(val);
    if (val) setDiffAllProd(false);
  };

  const onDiffAllProdToggle = () => {
    const val = !diffAllProd;
    setDiffAllProd(val);
    if (val) setDiffAllQA(false);
  };

  const routeLabel = diffAllQA
    ? `${clientA} → All QA`
    : diffAllProd
    ? `${clientA} → All LIVE`
    : `${clientA} (${isSingleEnvClient(clientA) ? getEnvForClient(clientA) : envA}) → ${clientB} (${isSingleEnvClient(clientB) ? getEnvForClient(clientB) : envB})`;

  const renderClientPanel = (tag, tagClass, clientVal, onClientChange, envVal, onEnvChange, formsPath) => (
    <div className="glow-card">
      <div className="glow-card__inner">
        <span className={`panel-tag panel-tag--${tagClass}`} style={{ marginBottom: 12, display: "inline-block" }}>
          {tag}
        </span>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 8 }}>
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
        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", wordBreak: "break-all" }}>
          <span style={{ fontWeight: 600 }}>Forms folder: </span>
          <code className="mono">{formsPath || "Not defined"}</code>
        </div>
      </div>
    </div>
  );

  return (
    <div className="page page--home">
      <div className="page-top">
        <PageHeader
          eyebrow="Generator"
          title="Forms Diff"
          description="Extract .fmb forms from your deployment plan and generate automated Oracle Forms diff packages with bundled tools."
        />
        <div className="metric-strip">
          <div className="metric-card">
            <span className="metric-card__value">{detectedForms.length || "—"}</span>
            <span className="metric-card__label">.FMB Forms</span>
          </div>
          <div className="metric-card">
            <span className="metric-card__value">{batContent ? "Ready" : "—"}</span>
            <span className="metric-card__label">Status</span>
          </div>
          <div className="metric-card" style={{ minWidth: 140, textAlign: "left" }}>
            <span className="metric-card__value metric-card__value--text mono">{routeLabel}</span>
            <span className="metric-card__label">Route</span>
          </div>
        </div>
      </div>

      <div className="bento">
        {/* Input Card */}
        <section className="bento__plan glow-card">
          <div className="glow-card__inner" style={{ height: "100%", display: "flex", flexDirection: "column" }}>
            <label className="ds-label">Deployment plan / Forms list</label>
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Paste deployment plan or .fmb files here (e.g. man_auth.fmb, allocations.fmb)..."
              className="ds-textarea ds-textarea--mono"
              style={{ flex: 1, minHeight: 220 }}
            />
          </div>
        </section>

        {/* Source & Target Configuration */}
        <aside className="bento__config flow-grid">
          {renderClientPanel("Source", "from", clientA, onClientAChange, envA, (e) => setEnvA(e.target.value), sourceFormsPath)}
          {!(diffAllQA || diffAllProd) && (
            <>
              <div className="flow-arrow" aria-hidden="true">→</div>
              {renderClientPanel("Target", "to", clientB, onClientBChange, envB, (e) => setEnvB(e.target.value), targetFormsPath)}
            </>
          )}
          <div className="glow-card">
            <div className="glow-card__inner" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
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

              <div style={{ marginTop: 4, paddingTop: 8, borderTop: "1px solid var(--border)" }}>
                <label className="ds-label" style={{ fontSize: "0.72rem" }}>Diff Output Subfolder</label>
                <input
                  type="text"
                  value={outputSubfolder}
                  onChange={(e) => setOutputSubfolder(e.target.value)}
                  placeholder="diffs"
                  className="ds-input"
                  style={{ fontSize: "0.8rem", padding: "6px 10px" }}
                />
              </div>

              <div style={{ marginTop: 4, paddingTop: 8, borderTop: "1px solid var(--border)", fontSize: "0.78rem", color: "var(--text-muted)" }}>
                <span style={{ color: "var(--accent)", fontWeight: 600 }}>Zip Bundle Includes:</span>
                <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 4 }}>
                  <span className="stat-chip" style={{ fontSize: "0.7rem", padding: "2px 6px" }}>diff.exe</span>
                  <span className="stat-chip" style={{ fontSize: "0.7rem", padding: "2px 6px" }}>ExamDiff.exe</span>
                  <span className="stat-chip" style={{ fontSize: "0.7rem", padding: "2px 6px" }}>frmcmp12.lnk</span>
                  <span className="stat-chip" style={{ fontSize: "0.7rem", padding: "2px 6px" }}>run_diff.bat</span>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Detected Forms List */}
        {detectedForms.length > 0 && (
          <div className="bento__output glow-card">
            <div className="glow-card__inner">
              <div className="panel-header">
                <label className="ds-label" style={{ margin: 0 }}>Detected Oracle Forms (.fmb)</label>
                <span className="stat-chip stat-chip--accent">{detectedForms.length} detected</span>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, maxHeight: 120, overflowY: "auto", padding: "4px 0" }}>
                {detectedForms.map((form) => (
                  <span
                    key={form}
                    className="stat-chip"
                    style={{ background: "rgba(255, 255, 255, 0.08)", color: "var(--text-primary)", fontFamily: "monospace" }}
                  >
                    {form}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Generated Batch Commands */}
        <section className="bento__output glow-card">
          <div className="glow-card__inner">
            <div className="panel-header">
              <label className="ds-label" style={{ margin: 0 }}>Generated Forms Diff Batch Script</label>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button
                  type="button"
                  onClick={downloadZipBundle}
                  className="ds-btn ds-btn-primary"
                  disabled={!batContent.trim() || isZipping}
                  title="Download a self-contained ZIP bundle with diff.exe, ExamDiff.exe, and run_diff.bat"
                >
                  {isZipping ? "Creating ZIP..." : "📦 Download ZIP Bundle"}
                </button>
                <button
                  type="button"
                  onClick={downloadBatFile}
                  className="ds-btn ds-btn-success"
                  disabled={!batContent.trim()}
                >
                  Download .bat
                </button>
                <button
                  type="button"
                  onClick={copyToClipboard}
                  className="ds-btn ds-btn-ghost"
                  disabled={!batContent.trim()}
                >
                  Copy Script
                </button>
              </div>
            </div>
            <div className="terminal">
              <div className="terminal__chrome">
                <span className="terminal__dot terminal__dot--violet" />
                <span className="terminal__dot terminal__dot--cyan" />
                <span className="terminal__dot terminal__dot--rose" />
                <span className="terminal__title">run_diff.bat</span>
              </div>
              <textarea
                value={batContent}
                readOnly
                className="terminal__body terminal__body--readonly terminal__body--scroll-x"
                style={{ minHeight: 260, maxHeight: 420 }}
                spellCheck={false}
                placeholder="Forms diff batch script will appear here once you paste your plan containing .fmb files…"
              />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
