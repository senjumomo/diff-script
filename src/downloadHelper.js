/**
 * Helper to download or save files.
 * In Tauri desktop app: Opens a native Windows "Save As..." dialog and saves the file.
 * In browser: Triggers standard browser download via <a download>.
 */
export async function saveOrDownloadFile({ filename, content, mimeType = "text/plain;charset=utf-8", filters }) {
  // Check if running inside Tauri desktop app
  const isTauri = typeof window !== "undefined" && Boolean(window.__TAURI_INTERNALS__);

  if (isTauri) {
    try {
      const { save } = await import("@tauri-apps/plugin-dialog");
      const { writeTextFile, writeFile } = await import("@tauri-apps/plugin-fs");

      // Extract file extension for default filter if none provided
      const ext = filename.split(".").pop();
      const dialogFilters = filters || (ext ? [{ name: `${ext.toUpperCase()} File`, extensions: [ext] }] : []);

      const filePath = await save({
        defaultPath: filename,
        filters: dialogFilters,
      });

      if (!filePath) {
        // User cancelled dialog
        return { cancelled: true };
      }

      if (typeof content === "string") {
        await writeTextFile(filePath, content);
      } else if (content instanceof Blob) {
        const buffer = await content.arrayBuffer();
        await writeFile(filePath, new Uint8Array(buffer));
      } else if (content instanceof Uint8Array || ArrayBuffer.isView(content)) {
        await writeFile(filePath, new Uint8Array(content.buffer || content));
      } else {
        await writeTextFile(filePath, String(content));
      }

      return { success: true, path: filePath };
    } catch (err) {
      console.warn("Tauri native save failed, falling back to browser download:", err);
    }
  }

  // Browser fallback
  try {
    const blob = content instanceof Blob
      ? content
      : new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return { success: true };
  } catch (err) {
    console.error("Browser download failed:", err);
    return { error: err };
  }
}
