// ============================================================
//  EvidenceUpload.jsx — React Frontend Component
//  Handles: Image only | File only | Both
//  Drop into your existing React project
// ============================================================

import { useState } from "react";
import axios from "axios";
import { API_URL } from '../config/api';

const API_BASE = API_URL;

export default function EvidenceUpload({ caseId, investigatorName }) {
  const [imageFile,  setImageFile]  = useState(null);
  const [dataFile,   setDataFile]   = useState(null);
  const [loading,    setLoading]    = useState(false);
  const [result,     setResult]     = useState(null);
  const [error,      setError]      = useState(null);
  const [preview,    setPreview]    = useState(null);

  // Image file selected
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setImageFile(file);
    if (file) setPreview(URL.createObjectURL(file));
  };

  // Data file selected
  const handleDataChange = (e) => {
    setDataFile(e.target.files[0]);
  };

  // Submit — works for image-only, file-only, or both
  const handleSubmit = async () => {
    if (!imageFile && !dataFile) {
      setError("Please upload at least one file — image or forensic data.");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append("caseId",           caseId || "CASE-" + Date.now());
    formData.append("investigatorName", investigatorName || "Investigator");

    if (imageFile) formData.append("image",    imageFile);
    if (dataFile)  formData.append("dataFile", dataFile);

    try {
      const res = await axios.post(`${API_BASE}/analyze`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.error || "Analysis failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Evidence Upload</h2>
      <p style={styles.subtitle}>
        Upload an image, a forensic data file, or both — a report will be
        generated either way.
      </p>

      {/* ── Upload Boxes ── */}
      <div style={styles.uploadRow}>

        {/* Image Upload */}
        <div style={styles.uploadBox}>
          <label style={styles.label}>
            📸 Crime Scene Image
            <span style={styles.optional}>(optional)</span>
          </label>
          <div style={styles.dropZone}>
            {preview ? (
              <img src={preview} alt="preview" style={styles.preview} />
            ) : (
              <span style={styles.dropText}>JPG, PNG, WEBP</span>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              style={styles.fileInput}
            />
          </div>
          {imageFile && (
            <p style={styles.fileName}>✅ {imageFile.name}</p>
          )}
          <p style={styles.hint}>
            Detected by 5 AI models:<br />
            Accident · Fire/Arson · Crime · Traffic · Anomaly
          </p>
        </div>

        {/* Data File Upload */}
        <div style={styles.uploadBox}>
          <label style={styles.label}>
            📂 Forensic Data File
            <span style={styles.optional}>(optional)</span>
          </label>
          <div style={styles.dropZone}>
            <span style={styles.dropText}>LOG · TXT · JSON · CSV</span>
            <input
              type="file"
              accept=".txt,.log,.json,.csv"
              onChange={handleDataChange}
              style={styles.fileInput}
            />
          </div>
          {dataFile && (
            <p style={styles.fileName}>✅ {dataFile.name}</p>
          )}
          <p style={styles.hint}>
            Parsed for: timestamps, IP addresses,<br />
            errors, events, user actions
          </p>
        </div>
      </div>

      {/* ── Submit ── */}
      <button
        onClick={handleSubmit}
        disabled={loading || (!imageFile && !dataFile)}
        style={{
          ...styles.btn,
          opacity: loading || (!imageFile && !dataFile) ? 0.5 : 1,
        }}
      >
        {loading ? "⏳ Analyzing evidence..." : "🔍 Analyze & Generate Report"}
      </button>

      {/* ── Loading State ── */}
      {loading && (
        <div style={styles.loadingBox}>
          <p>🔁 Running CNN models on image...</p>
          <p>🔁 Parsing forensic data...</p>
          <p>🔁 Merging evidence JSON...</p>
          <p>🔁 LLaMA 3 generating report...</p>
        </div>
      )}

      {/* ── Error ── */}
      {error && <div style={styles.errorBox}>❌ {error}</div>}

      {/* ── Results ── */}
      {result && (
        <div style={styles.resultBox}>
          <h3 style={styles.resultTitle}>
            ✅ Analysis Complete — {result.evidence_type.replace(/_/g, " ").toUpperCase()}
          </h3>

          {/* Image Analysis Results */}
          {result.image_analysis && (
            <div style={styles.section}>
              <h4>📸 Image Analysis</h4>
              <p>
                <strong>Scene Detected:</strong>{" "}
                {result.image_analysis.dominant_scene.scene_type}
              </p>
              <p>
                <strong>Confidence:</strong>{" "}
                {(result.image_analysis.dominant_scene.confidence * 100).toFixed(1)}%
              </p>
              <p>
                <strong>SHA-256:</strong>{" "}
                <code>{result.image_analysis.sha256_hash}</code>
              </p>
              <p>
                <strong>All Detections:</strong>{" "}
                {result.image_analysis.high_confidence_detections
                  .map((d) => `${d.label} (${(d.confidence * 100).toFixed(0)}%)`)
                  .join(", ") || "None above threshold"}
              </p>
            </div>
          )}

          {/* File Analysis Results */}
          {result.file_analysis && (
            <div style={styles.section}>
              <h4>📂 File Analysis</h4>
              <p><strong>Total Lines:</strong> {result.file_analysis.total_lines}</p>
              <p>
                <strong>Timestamps Found:</strong>{" "}
                {result.file_analysis.timestamps_found.length}
              </p>
              <p>
                <strong>IP Addresses:</strong>{" "}
                {result.file_analysis.ip_addresses_found.join(", ") || "None"}
              </p>
              <p>
                <strong>SHA-256:</strong>{" "}
                <code>{result.file_analysis.sha256_hash}</code>
              </p>
            </div>
          )}

          {/* Forensic Report */}
          <div style={styles.reportBox}>
            <h4>📄 Generated Forensic Report</h4>
            <pre style={styles.reportText}>{result.forensic_report}</pre>
          </div>

          {/* Download Button */}
          <button
            onClick={() => {
              const blob = new Blob([result.forensic_report], { type: "text/plain" });
              const url  = URL.createObjectURL(blob);
              const a    = document.createElement("a");
              a.href     = url;
              a.download = `ForensiQ-Report-${result.caseId}.txt`;
              a.click();
            }}
            style={{ ...styles.btn, background: "#1a7a4a", marginTop: "1rem" }}
          >
            ⬇️ Download Report
          </button>
        </div>
      )}
    </div>
  );
}

// ── Inline Styles ──────────────────────────────────────────
const styles = {
  container:   { maxWidth: 900, margin: "2rem auto", padding: "2rem", fontFamily: "monospace", color: "#e0e0e0", background: "#0a0f1a", borderRadius: 12 },
  title:       { fontSize: 24, fontWeight: 700, color: "#00ff9d", marginBottom: 8 },
  subtitle:    { color: "#888", marginBottom: 24, fontSize: 14 },
  uploadRow:   { display: "flex", gap: "1.5rem", marginBottom: "1.5rem" },
  uploadBox:   { flex: 1, border: "1px solid #1a3a2a", borderRadius: 8, padding: "1.5rem", background: "#060e14" },
  label:       { display: "block", fontWeight: 700, marginBottom: 10, color: "#fff", fontSize: 15 },
  optional:    { fontSize: 11, color: "#555", marginLeft: 8, fontWeight: 400 },
  dropZone:    { border: "1px dashed #1e5c3a", borderRadius: 6, padding: "1.5rem", textAlign: "center", position: "relative", cursor: "pointer", background: "#08120e" },
  dropText:    { color: "#555", fontSize: 13 },
  fileInput:   { position: "absolute", inset: 0, opacity: 0, cursor: "pointer", width: "100%", height: "100%" },
  preview:     { maxWidth: "100%", maxHeight: 120, objectFit: "contain", borderRadius: 4 },
  fileName:    { fontSize: 12, color: "#00ff9d", marginTop: 8 },
  hint:        { fontSize: 11, color: "#444", marginTop: 10, lineHeight: 1.6 },
  btn:         { background: "#00ff9d", color: "#030d08", border: "none", padding: "12px 32px", fontSize: 14, fontWeight: 700, cursor: "pointer", borderRadius: 6, width: "100%", letterSpacing: 1 },
  loadingBox:  { background: "#060e14", border: "1px solid #1a3a2a", borderRadius: 8, padding: "1rem", marginTop: "1rem", color: "#00ff9d", fontSize: 13, lineHeight: 2 },
  errorBox:    { background: "#1a0a0a", border: "1px solid #ff4444", borderRadius: 8, padding: "1rem", marginTop: "1rem", color: "#ff6666" },
  resultBox:   { marginTop: "1.5rem", border: "1px solid #1a4a2a", borderRadius: 8, padding: "1.5rem", background: "#060e14" },
  resultTitle: { color: "#00ff9d", marginBottom: "1rem", fontSize: 16 },
  section:     { borderBottom: "1px solid #112a1a", paddingBottom: "1rem", marginBottom: "1rem", lineHeight: 2, fontSize: 13 },
  reportBox:   { background: "#030809", border: "1px solid #112a1a", borderRadius: 6, padding: "1rem", marginTop: "1rem" },
  reportText:  { whiteSpace: "pre-wrap", fontSize: 12, color: "#ccc", lineHeight: 1.7, maxHeight: 400, overflow: "auto" },
};
