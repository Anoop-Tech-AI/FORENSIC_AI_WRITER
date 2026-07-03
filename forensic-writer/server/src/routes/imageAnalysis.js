// ============================================================
//  ForensiQ — Image Analysis Pipeline (UPGRADED)
//  imageAnalysis.js
//
//  Handles:
//  1. Image-only upload  → CNN Models → JSON → LLaMA3 → Report
//  2. File-only upload   → Parse → JSON → LLaMA3 → Report
//  3. Both uploads       → Merge JSON → LLaMA3 → Report
//
//  Models used (ALL confirmed working with free HuggingFace API):
//  - google/vit-base-patch16-224     → General scene classification
//  - microsoft/resnet-50             → Scene/object recognition
//  - facebook/detr-resnet-50         → Object detection (vehicles, people, debris)
//  - Falconsai/nsfw_image_detection  → Anomaly / sensitive content detection
//  - meta-llama/Llama-3.1-8B-Instruct → Report generation
// ============================================================

const express = require("express");
const multer  = require("multer");
const fs      = require("fs");
const crypto  = require("crypto");
const axios   = require("axios");
const path    = require("path");

const router = express.Router();

// ─────────────────────────────────────────────
//  MULTER STORAGE
// ─────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, "../../uploads");
    if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowed = [
      "image/jpeg", "image/png", "image/jpg", "image/webp",
      "text/plain", "application/json",
      "text/csv", "application/octet-stream",
    ];
    allowed.includes(file.mimetype)
      ? cb(null, true)
      : cb(new Error(`Unsupported file type: ${file.mimetype}`));
  },
});

// ─────────────────────────────────────────────
//  HuggingFace CONFIG
// ─────────────────────────────────────────────
const HF_TOKEN = process.env.HF_API_KEY;
const HF_BASE  = "https://api-inference.huggingface.co/models";

const MODELS = {
  SCENE:     `${HF_BASE}/google/vit-base-patch16-224`,
  OBJECT:    `${HF_BASE}/microsoft/resnet-50`,
  DETECTION: `${HF_BASE}/facebook/detr-resnet-50`,
  ANOMALY:   `${HF_BASE}/Falconsai/nsfw_image_detection`,
  LLAMA3:    `${HF_BASE}/meta-llama/Llama-3.1-8B-Instruct`,
};

// ─────────────────────────────────────────────
//  STEP 1 — SHA-256 Hash
// ─────────────────────────────────────────────
function computeHash(filePath) {
  const fileBuffer = fs.readFileSync(filePath);
  return crypto.createHash("sha256").update(fileBuffer).digest("hex");
}

// ─────────────────────────────────────────────
//  STEP 2A — Call HuggingFace model with retry
// ─────────────────────────────────────────────
async function callHFModel(modelUrl, imageData, retries = 2) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await axios.post(modelUrl, imageData, {
        headers: {
          Authorization:  `Bearer ${HF_TOKEN}`,
          "Content-Type": "application/octet-stream",
        },
        timeout: 40000,
      });
      return response.data;
    } catch (err) {
      const status = err.response?.status;
      if (status === 503 && attempt < retries) {
        // Model cold start — wait and retry
        await new Promise((r) => setTimeout(r, 20000));
      } else {
        return null;
      }
    }
  }
  return null;
}

// ─────────────────────────────────────────────
//  STEP 2B — Run ALL 4 image models in parallel
// ─────────────────────────────────────────────
async function analyzeImage(imagePath, filename) {
  const imageData = fs.readFileSync(imagePath);

  const [sceneResult, objectResult, detectionResult, anomalyResult] =
    await Promise.all([
      callHFModel(MODELS.SCENE,     imageData),
      callHFModel(MODELS.OBJECT,    imageData),
      callHFModel(MODELS.DETECTION, imageData),
      callHFModel(MODELS.ANOMALY,   imageData),
    ]);

  const topN = (result, n = 3) => {
    if (!result || !Array.isArray(result)) return [];
    return result
      .filter((r) => r.score > 0.05)
      .sort((a, b) => b.score - a.score)
      .slice(0, n)
      .map((r) => ({
        label:      r.label,
        confidence: parseFloat((r.score * 100).toFixed(1)) + "%",
        score:      parseFloat(r.score.toFixed(4)),
      }));
  };

  const modelResults = {
    scene_classification: {
      model:      "google/vit-base-patch16-224",
      purpose:    "General scene and environment identification",
      top_labels: topN(sceneResult, 5),
      status:     sceneResult ? "success" : "unavailable",
    },
    object_recognition: {
      model:      "microsoft/resnet-50",
      purpose:    "Specific object recognition",
      top_labels: topN(objectResult, 5),
      status:     objectResult ? "success" : "unavailable",
    },
    object_detection: {
      model:   "facebook/detr-resnet-50",
      purpose: "Object detection with location data",
      detected_objects: Array.isArray(detectionResult)
        ? detectionResult
            .filter((d) => d.score > 0.5)
            .map((d) => ({
              label:      d.label,
              confidence: parseFloat((d.score * 100).toFixed(1)) + "%",
              location:   d.box || null,
            }))
        : [],
      status: detectionResult ? "success" : "unavailable",
    },
    anomaly_detection: {
      model:      "Falconsai/nsfw_image_detection",
      purpose:    "Sensitive content and anomaly detection",
      top_labels: topN(anomalyResult, 3),
      status:     anomalyResult ? "success" : "unavailable",
    },
  };

  const allLabels = [
    ...topN(sceneResult, 3),
    ...topN(objectResult, 3),
  ].sort((a, b) => b.score - a.score);

  const dominantScene = allLabels[0] || { label: "Unknown", score: 0, confidence: "0%" };

  return {
    source:       "image_analysis",
    filename,
    sha256_hash:  computeHash(imagePath),
    analyzed_at:  new Date().toISOString(),
    dominant_scene: {
      scene_type:  dominantScene.label,
      confidence:  dominantScene.confidence,
      score:       dominantScene.score,
    },
    model_results,
    high_confidence_detections: allLabels.filter((l) => l.score > 0.6),
    summary_for_report:
      `Image classified as "${dominantScene.label}" with ${dominantScene.confidence} confidence. ` +
      `Objects detected: ${modelResults.object_detection.detected_objects.map((o) => o.label).join(", ") || "none"}.`,
  };
}

// ─────────────────────────────────────────────
//  STEP 3 — Parse Text/Log/CSV File into JSON
// ─────────────────────────────────────────────
function parseForensicFile(filePath, filename) {
  const raw   = fs.readFileSync(filePath, "utf-8");
  const lines = raw.split("\n").filter((l) => l.trim() !== "");

  const timestampRegex =
    /(\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}|\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}:\d{2})/g;
  const timestamps = [...raw.matchAll(timestampRegex)].map((m) => m[0]);

  const ipRegex = /\b(\d{1,3}\.){3}\d{1,3}\b/g;
  const ips     = [...new Set([...raw.matchAll(ipRegex)].map((m) => m[0]))];

  const errorKeywords = [
    "error", "fail", "failed", "denied", "unauthorized",
    "exception", "crash", "invalid", "blocked", "timeout",
    "breach", "attack", "intrusion", "malware", "suspicious",
  ];
  const errorLines = lines.filter((l) =>
    errorKeywords.some((k) => l.toLowerCase().includes(k))
  );

  const actionKeywords = ["login", "logout", "access", "delete", "upload", "download", "execute", "modify"];
  const actionLines = lines.filter((l) =>
    actionKeywords.some((k) => l.toLowerCase().includes(k))
  );

  return {
    source:             "file_analysis",
    filename,
    sha256_hash:        computeHash(filePath),
    analyzed_at:        new Date().toISOString(),
    total_lines:        lines.length,
    timestamps_found:   timestamps.slice(0, 20),
    ip_addresses_found: ips,
    error_events:       errorLines.slice(0, 10),
    user_actions:       actionLines.slice(0, 10),
    raw_preview:        lines.slice(0, 40).join("\n"),
    summary_for_report:
      `File contains ${lines.length} lines. ` +
      `Timestamps: ${timestamps.length}. ` +
      `IPs found: ${ips.length > 0 ? ips.join(", ") : "none"}. ` +
      `Error events: ${errorLines.length}. ` +
      `User actions: ${actionLines.length}.`,
  };
}

// ─────────────────────────────────────────────
//  STEP 4 — Merge image + file evidence
// ─────────────────────────────────────────────
function mergeEvidenceJSON(imageData, fileData) {
  return {
    evidence_type:
      imageData && fileData ? "image_and_file"
      : imageData           ? "image_only"
      :                       "file_only",
    generated_at:     new Date().toISOString(),
    image_evidence:   imageData || null,
    file_evidence:    fileData  || null,
    combined_summary: [imageData?.summary_for_report, fileData?.summary_for_report]
      .filter(Boolean)
      .join(" | "),
  };
}

// ─────────────────────────────────────────────
//  STEP 5 — Build LLaMA 3 Prompt
// ─────────────────────────────────────────────
function buildForensicPrompt(combinedJSON, caseId, investigatorName, caseName) {
  const date         = new Date().toISOString().split("T")[0];
  const evidenceType = combinedJSON.evidence_type;

  let evidenceSections = "";

  if (combinedJSON.image_evidence) {
    const img = combinedJSON.image_evidence;
    evidenceSections += `
IMAGE EVIDENCE:
- Filename: ${img.filename}
- SHA-256 Hash: ${img.sha256_hash}
- Analyzed At: ${img.analyzed_at}
- Dominant Scene Detected: ${img.dominant_scene?.scene_type} (${img.dominant_scene?.confidence} confidence)
- High Confidence Detections: ${img.high_confidence_detections?.map(d => `${d.label} (${d.confidence})`).join(", ") || "None above threshold"}
- Objects Detected: ${img.model_results?.object_detection?.detected_objects?.map(o => o.label).join(", ") || "None"}
- Scene Classification Top Results: ${img.model_results?.scene_classification?.top_labels?.map(l => `${l.label} (${l.confidence})`).join(", ") || "N/A"}
- Full Summary: ${img.summary_for_report}`;
  }

  if (combinedJSON.file_evidence) {
    const file = combinedJSON.file_evidence;
    evidenceSections += `
FILE EVIDENCE:
- Filename: ${file.filename}
- SHA-256 Hash: ${file.sha256_hash}
- Analyzed At: ${file.analyzed_at}
- Total Lines: ${file.total_lines}
- Timestamps Found: ${file.timestamps_found?.length > 0 ? file.timestamps_found.slice(0, 5).join(", ") : "None found"}
- IP Addresses Found: ${file.ip_addresses_found?.length > 0 ? file.ip_addresses_found.join(", ") : "None found"}
- Error Events (${file.error_events?.length || 0} total): ${file.error_events?.slice(0, 3).join(" | ") || "None"}
- User Actions (${file.user_actions?.length || 0} total): ${file.user_actions?.slice(0, 3).join(" | ") || "None"}
- File Content Preview (first lines): ${file.raw_preview?.slice(0, 500) || "N/A"}
- Full Summary: ${file.summary_for_report}`;
  }

  return `<|begin_of_text|><|start_header_id|>system<|end_header_id|>
You are ForensiQ Writer AI, a professional digital forensic report generator. Your job is to write a formal, structured forensic investigation report using ONLY the evidence data provided.

CRITICAL RULES:
1. Use ONLY the data provided below. Do not add any facts, assumptions, or conclusions not supported by the data.
2. Use formal, neutral, court-appropriate language throughout.
3. Never accuse. Never speculate. State only what the data shows.
4. Always include SHA-256 hash values exactly as provided.
5. Follow the EXACT format specified below with NO DEVIATIONS.
6. Do NOT add any extra sections beyond what is specified.
7. Do NOT add "Generated by" or any footer text.
<|eot_id|><|start_header_id|>user<|end_header_id|>
Generate a forensic investigation report using this case information and evidence data:

CASE INFORMATION:
- Case Name: ${caseName || caseId}
- Case ID: ${caseId}
- Date: ${date}
- Investigator: ${investigatorName}
- Evidence Type: ${evidenceType.replace(/_/g, " ")}
${evidenceSections}

Write the report in this EXACT format with these EXACT section headings:

Forensic Investigation Report
Case: ${caseName || caseId}
Case ID: ${caseId}
Date: ${date}
Investigator: ${investigatorName}

OBJECTIVE:
The main aim of this system is to analyze large volumes of raw data such as call logs, records, files, and documents, which cannot be efficiently processed by humans within a limited time. The AI system performs this analysis and generates a structured report highlighting patterns and anomalies.

EVIDENCE SUMMARY:
The neural engine analyzed ${combinedJSON.image_evidence ? '1' : '0'} image evidence artifacts and ${combinedJSON.file_evidence ? '1' : '0'} file evidence artifacts using SHA-256 hash verification and pattern recognition protocols.

ANALYSIS:
${evidenceSections}

IMPORTANT: End your response after the ANALYSIS section. Do not add any additional text, footers, or closing remarks.
<|eot_id|><|start_header_id|>assistant<|end_header_id|>`;
}

// ─────────────────────────────────────────────
//  STEP 6 — Call LLaMA 3 to Generate Report
// ─────────────────────────────────────────────
async function generateReport(prompt) {
  if (!HF_TOKEN) {
    console.error("❌ LLaMA 3: No HF_TOKEN found in environment");
    return null;
  }

  try {
    console.log("📝 Sending prompt to LLaMA 3.1-8B-Instruct...");
    console.log("📝 Prompt length:", prompt.length, "characters");

    const response = await axios.post(
      MODELS.LLAMA3,
      {
        inputs: prompt,
        parameters: {
          max_new_tokens:     1800,
          temperature:        0.1,
          top_p:              0.9,
          repetition_penalty: 1.1,
          return_full_text:   false,
        },
      },
      {
        headers: {
          Authorization:  `Bearer ${HF_TOKEN}`,
          "Content-Type": "application/json",
        },
        timeout: 90000,
      }
    );

    console.log("✅ LLaMA 3 response received");
    console.log("📝 Response data keys:", Object.keys(response.data));

    // Handle different response formats from HuggingFace API
    let reportText = null;
    
    if (Array.isArray(response.data) && response.data.length > 0) {
      reportText = response.data[0]?.generated_text;
    } else if (response.data?.generated_text) {
      reportText = response.data.generated_text;
    } else if (typeof response.data === 'string') {
      reportText = response.data;
    }

    if (!reportText) {
      console.error("❌ LLaMA 3: No generated text in response");
      console.error("📝 Full response:", JSON.stringify(response.data, null, 2));
      return null;
    }

    console.log("✅ Report text extracted, length:", reportText.length);
    return reportText.trim();
    
  } catch (err) {
    const status = err.response?.status;
    console.error("❌ LLaMA 3 API Error:", err.message);
    console.error("📝 Status:", status);
    console.error("📝 Error details:", err.response?.data);
    
    if (status === 503 || status === 504) {
      console.warn("⚠️ LLaMA 3 unavailable (503/504), using fallback");
      return null;
    }
    if (status === 401) {
      console.error("❌ LLaMA 3: Unauthorized - check API key");
      return null;
    }
    if (status === 429) {
      console.error("❌ LLaMA 3: Rate limited");
      return null;
    }
    throw new Error("Report generation failed: " + err.message);
  }
}

// ─────────────────────────────────────────────
//  FALLBACK — Structured report without LLaMA
// ─────────────────────────────────────────────
function generateFallbackReport(combinedJSON, caseId, investigatorName, caseName) {
  const date = new Date().toISOString().split("T")[0];
  const img  = combinedJSON.image_evidence;
  const file = combinedJSON.file_evidence;
  const name = caseName || caseId;

  let analysis = "";

  if (img) {
    analysis += `Image Analysis:\n`;
    analysis += `- Filename: ${img.filename}\n`;
    analysis += `- SHA-256 Hash: ${img.sha256_hash}\n`;
    analysis += `- Scene Classification: ${img.dominant_scene?.scene_type || 'Unknown'} (${img.dominant_scene?.confidence || 'N/A'} confidence)\n`;
    if (img.model_results?.object_detection?.detected_objects?.length > 0) {
      analysis += `- Objects Detected: ${img.model_results.object_detection.detected_objects.map(o => o.label).join(", ")}\n`;
    }
    if (img.model_results?.scene_classification?.top_labels?.length > 0) {
      analysis += `- Top Scene Labels: ${img.model_results.scene_classification.top_labels.slice(0, 3).map(l => `${l.label} (${l.confidence})`).join(", ")}\n`;
    }
  }

  if (file) {
    analysis += `File Analysis:\n`;
    analysis += `- Filename: ${file.filename}\n`;
    analysis += `- SHA-256 Hash: ${file.sha256_hash}\n`;
    analysis += `- Total Lines: ${file.total_lines}\n`;
    if (file.ip_addresses_found?.length > 0) {
      analysis += `- IP Addresses Found: ${file.ip_addresses_found.join(", ")}\n`;
    }
    if (file.error_events?.length > 0) {
      analysis += `- Error Events: ${file.error_events.slice(0, 3).join(" | ")}\n`;
    }
    if (file.timestamps_found?.length > 0) {
      analysis += `- Timestamps Found: ${file.timestamps_found.slice(0, 5).join(", ")}\n`;
    }
  }

  if (!analysis) {
    analysis = "No analysis data available.";
  }

  return `Forensic Investigation Report
Case: ${name}
Case ID: ${caseId}
Date: ${date}
Investigator: ${investigatorName}

OBJECTIVE:
The main aim of this system is to analyze large volumes of raw data such as call logs, records, files, and documents, which cannot be efficiently processed by humans within a limited time. The AI system performs this analysis and generates a structured report highlighting patterns and anomalies.

EVIDENCE SUMMARY:
The neural engine analyzed ${img ? '1' : '0'} image evidence artifacts and ${file ? '1' : '0'} file evidence artifacts using SHA-256 hash verification and pattern recognition protocols.

ANALYSIS:
${analysis}`;
}

// ─────────────────────────────────────────────
//  MAIN ROUTE — POST /api/analyze
// ─────────────────────────────────────────────
router.post(
  "/",
  upload.fields([
    { name: "image",    maxCount: 1 },
    { name: "dataFile", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const { caseId, investigatorName, caseName } = req.body;
      const imageFile = req.files?.image?.[0];
      const dataFile  = req.files?.dataFile?.[0];

      if (!imageFile && !dataFile) {
        return res.status(400).json({ error: "At least one file required." });
      }
      if (!caseId) {
        return res.status(400).json({ error: "caseId is required." });
      }

      const imageDataJSON = imageFile
        ? await analyzeImage(imageFile.path, imageFile.originalname)
        : null;

      const fileDataJSON = dataFile
        ? parseForensicFile(dataFile.path, dataFile.originalname)
        : null;

      const combinedEvidence = mergeEvidenceJSON(imageDataJSON, fileDataJSON);
      const prompt           = buildForensicPrompt(combinedEvidence, caseId, investigatorName || "Investigator", caseName);
      
      console.log("📝 Attempting LLaMA 3 report generation...");
      let   reportText       = await generateReport(prompt);

      if (!reportText) {
        console.warn("⚠️ LLaMA 3 failed, using fallback report generator");
        reportText = generateFallbackReport(combinedEvidence, caseId, investigatorName || "Investigator", caseName);
        console.log("✅ Fallback report generated");
      } else {
        console.log("✅ LLaMA 3 report generated successfully");
      }

      // Cleanup temp files
      if (imageFile && fs.existsSync(imageFile.path)) fs.unlinkSync(imageFile.path);
      if (dataFile  && fs.existsSync(dataFile.path))  fs.unlinkSync(dataFile.path);

      return res.status(200).json({
        success:           true,
        caseId,
        evidence_type:     combinedEvidence.evidence_type,
        image_analysis:    imageDataJSON,
        file_analysis:     fileDataJSON,
        combined_evidence: combinedEvidence,
        forensic_report:   reportText,
        generated_at:      new Date().toISOString(),
      });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }
);

// ─────────────────────────────────────────────
//  EXTRA ROUTE — POST /api/analyze/image-only
// ─────────────────────────────────────────────
router.post(
  "/image-only",
  upload.single("image"),
  async (req, res) => {
    try {
      const { caseId, investigatorName, caseName } = req.body;
      const imageFile = req.file;

      if (!imageFile) {
        return res.status(400).json({ error: "Image file is required." });
      }

      const imageDataJSON    = await analyzeImage(imageFile.path, imageFile.originalname);
      const combinedEvidence = mergeEvidenceJSON(imageDataJSON, null);
      const prompt           = buildForensicPrompt(combinedEvidence, caseId || "IMG-" + Date.now(), investigatorName || "Investigator", caseName);
      
      console.log("📝 Attempting LLaMA 3 report generation (image-only)...");
      let   reportText       = await generateReport(prompt);

      if (!reportText) {
        console.warn("⚠️ LLaMA 3 failed, using fallback report generator");
        reportText = generateFallbackReport(combinedEvidence, caseId, investigatorName || "Investigator", caseName);
        console.log("✅ Fallback report generated");
      } else {
        console.log("✅ LLaMA 3 report generated successfully");
      }

      if (fs.existsSync(imageFile.path)) fs.unlinkSync(imageFile.path);

      return res.status(200).json({
        success:         true,
        caseId,
        evidence_type:   "image_only",
        image_analysis:  imageDataJSON,
        forensic_report: reportText,
        generated_at:    new Date().toISOString(),
      });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }
);

module.exports = router;
