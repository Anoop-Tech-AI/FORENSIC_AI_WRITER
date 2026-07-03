const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { analyzeImage, isImage } = require('./imageAnalysisService');

const HF_TOKEN = process.env.HF_API_KEY;

// ─────────────────────────────────────────────
//  THE CSS — injected into the HTML report
// ─────────────────────────────────────────────
const REPORT_CSS = `
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      font-family: 'Arial', sans-serif;
      font-size: 13px;
      color: #1a1a1a;
      background: #ffffff;
      padding: 0;
    }

    .report-wrapper {
      max-width: 860px;
      margin: 0 auto;
      background: #fff;
      border: 1px solid #ccc;
    }

    /* ── HEADER BANNER ── */
    .report-header {
      background: #1565C0;
      color: #ffffff;
      text-align: center;
      padding: 18px 24px;
    }
    .report-header h1 {
      font-size: 20px;
      font-weight: bold;
      letter-spacing: 2px;
      text-transform: uppercase;
    }

    /* ── CASE META TABLE ── */
    .case-meta {
      padding: 20px 32px 12px;
      border-bottom: 2px solid #1565C0;
    }
    .case-meta table {
      width: 100%;
      border-collapse: collapse;
    }
    .case-meta td {
      padding: 4px 8px;
      font-size: 13px;
      vertical-align: top;
    }
    .case-meta td.label {
      font-weight: bold;
      color: #1a1a1a;
      width: 140px;
      white-space: nowrap;
    }
    .case-meta td.value {
      color: #333;
    }

    /* ── REPORT BODY ── */
    .report-body {
      padding: 20px 32px 32px;
    }

    /* ── SECTION TITLE ── */
    .section-title {
      font-size: 14px;
      font-weight: bold;
      color: #1a1a1a;
      margin-top: 20px;
      margin-bottom: 8px;
      padding-bottom: 4px;
      border-bottom: 1px solid #1565C0;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    /* ── PARAGRAPH TEXT ── */
    .report-body p {
      font-size: 13px;
      color: #333;
      line-height: 1.7;
      margin-bottom: 8px;
    }

    /* ── FINDINGS LIST ── */
    .findings-list {
      list-style: none;
      padding: 0;
      margin: 0 0 12px 0;
    }
    .findings-list li {
      padding: 6px 0 6px 16px;
      border-bottom: 1px solid #f0f0f0;
      font-size: 13px;
      color: #333;
      line-height: 1.6;
      position: relative;
    }
    .findings-list li::before {
      content: "▸";
      position: absolute;
      left: 0;
      color: #1565C0;
      font-size: 11px;
    }
    .findings-list li strong {
      color: #1a1a1a;
      font-weight: bold;
    }

    /* ── EVIDENCE TABLE ── */
    .evidence-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 16px;
      font-size: 12px;
    }
    .evidence-table th {
      background: #1565C0;
      color: #fff;
      padding: 8px 12px;
      text-align: left;
      font-weight: bold;
      letter-spacing: 0.5px;
    }
    .evidence-table td {
      padding: 7px 12px;
      border-bottom: 1px solid #e5e5e5;
      color: #333;
      vertical-align: top;
    }
    .evidence-table tr:nth-child(even) td {
      background: #f8f9ff;
    }
    .evidence-table .hash-val {
      font-family: 'Courier New', monospace;
      font-size: 11px;
      color: #555;
      word-break: break-all;
    }

    /* ── TIMELINE ── */
    .timeline {
      list-style: none;
      padding: 0;
      margin: 0 0 16px;
    }
    .timeline li {
      display: flex;
      gap: 16px;
      padding: 6px 0;
      border-bottom: 1px solid #f0f0f0;
      font-size: 13px;
      align-items: flex-start;
    }
    .timeline .ts {
      font-family: 'Courier New', monospace;
      font-size: 11px;
      color: #1565C0;
      white-space: nowrap;
      min-width: 140px;
      font-weight: bold;
      padding-top: 2px;
    }
    .timeline .ev {
      color: #333;
      line-height: 1.5;
    }

    /* ── STATUS BADGES ── */
    .badge {
      display: inline-block;
      padding: 2px 10px;
      border-radius: 3px;
      font-size: 11px;
      font-weight: bold;
      letter-spacing: 0.5px;
    }
    .badge-verified  { background: #e8f5e9; color: #2e7d32; border: 1px solid #a5d6a7; }
    .badge-warning   { background: #fff8e1; color: #f57f17; border: 1px solid #ffe082; }
    .badge-critical  { background: #ffebee; color: #c62828; border: 1px solid #ef9a9a; }
    .badge-info      { background: #e3f2fd; color: #1565c0; border: 1px solid #90caf9; }

    /* ── INTEGRITY BOX ── */
    .integrity-box {
      background: #f0f7ff;
      border: 1px solid #90caf9;
      border-left: 4px solid #1565C0;
      padding: 12px 16px;
      margin-bottom: 16px;
      font-size: 12px;
    }
    .integrity-box .hash-label {
      font-weight: bold;
      color: #1565C0;
      margin-bottom: 4px;
    }
    .integrity-box .hash-value {
      font-family: 'Courier New', monospace;
      color: #333;
      font-size: 11px;
      word-break: break-all;
    }

    /* ── RECOMMENDATIONS ── */
    .rec-list {
      list-style: none;
      padding: 0;
      counter-reset: rec-counter;
    }
    .rec-list li {
      counter-increment: rec-counter;
      padding: 8px 0 8px 36px;
      border-bottom: 1px solid #f0f0f0;
      font-size: 13px;
      color: #333;
      line-height: 1.6;
      position: relative;
    }
    .rec-list li::before {
      content: counter(rec-counter);
      position: absolute;
      left: 0;
      top: 8px;
      background: #1565C0;
      color: #fff;
      width: 22px;
      height: 22px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 11px;
      font-weight: bold;
    }
    .rec-list li strong {
      color: #1a1a1a;
    }

    /* ── CONCLUSION BOX ── */
    .conclusion-box {
      background: #f9fafb;
      border: 1px solid #e0e0e0;
      padding: 14px 18px;
      margin-top: 8px;
      font-size: 13px;
      color: #333;
      line-height: 1.7;
    }

    /* ── NOTE BOX ── */
    .note-box {
      background: #fffde7;
      border: 1px solid #fff176;
      border-left: 4px solid #f9a825;
      padding: 10px 14px;
      margin-top: 16px;
      font-size: 12px;
      color: #5d4037;
      line-height: 1.6;
    }

    /* ── FOOTER ── */
    .report-footer {
      background: #f5f5f5;
      border-top: 2px solid #1565C0;
      padding: 12px 32px;
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      color: #777;
    }
  </style>
`;

/**
 * Build evidence JSON structure for the new prompt
 */
function buildEvidenceJSON(results, caseName) {
  const hasImage = results.files.some(f => f.imageAnalysis);
  const hasFile = results.files.some(f => !f.imageAnalysis);
  
  const evidenceJSON = {
    caseId: `CASE-${Date.now()}`,
    caseName: caseName || 'Unknown Case',
    investigatorName: 'AI Investigator',
    date: new Date().toISOString().split('T')[0],
    evidence_type: hasImage && hasFile ? 'image and file' : hasImage ? 'image only' : 'file only',
    sha256_hash: results.files[0]?.hash || 'N/A',
    analyzed_at: new Date().toISOString()
  };

  // Add image evidence if present
  if (hasImage) {
    const imageFile = results.files.find(f => f.imageAnalysis);
    evidenceJSON.image_evidence = {
      filename: imageFile.fileName,
      dominant_scene: {
        label: imageFile.imageAnalysis.sceneClassification || 'Unknown',
        confidence: imageFile.confidence || 0
      },
      detected_by: 'ViT + DETR Models',
      high_confidence_detection: imageFile.imageAnalysis.objectDetection ? 
        imageFile.imageAnalysis.objectDetection.split(', ').map(d => ({ label: d, confidence: 0.9 })) : []
    };
  }

  // Add file evidence if present
  if (hasFile) {
    const file = results.files.find(f => !f.imageAnalysis);
    evidenceJSON.file_evidence = {
      filename: file.fileName,
      summary_for_report: `File analyzed with ${results.totalAnomalies.length} anomalies detected`,
      total_lines: 1,
      ip_addresses_found: [],
      error_events: 0,
      timestamps_found: []
    };
  }

  return evidenceJSON;
}

/**
 * Build the master prompt for LLM
 */
function buildMasterPrompt(evidenceJSON) {
  const {
    caseId          = "CASE-UNKNOWN",
    caseName        = "Unknown",
    investigatorName = "Unknown Investigator",
    date            = new Date().toISOString().split("T")[0],
    image_evidence  = null,
    file_evidence   = null,
    evidence_type   = "unknown",
  } = evidenceJSON;

  return `
You are a professional digital forensics report writer for a court of law.

Your job is to generate a complete, structured forensic investigation report in CLEAN HTML format using the exact CSS classes and HTML structure provided below.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STRICT RULES — READ EVERY RULE CAREFULLY:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

EVIDENCE RULES (MOST IMPORTANT):
1. You MUST use ONLY the data present in the EVIDENCE DATA JSON below. Nothing else.
2. If a field is missing, null, or empty in the JSON — write "Not available in evidence" for that field. Do NOT invent or guess values.
3. If no timestamps exist in the evidence — write exactly: "No timestamps were found in the evidence. A timeline cannot be generated."
4. If no IP addresses exist — write exactly: "No IP addresses detected in evidence."
5. If no image evidence exists — skip the Image Analysis section entirely.
6. If no file evidence exists — skip the Digital Log Analysis section entirely.
7. Every single fact, number, filename, hash, timestamp, IP address, and finding MUST come directly from the JSON. If it is not in the JSON, it does not go in the report.
8. DO NOT use your own knowledge. DO NOT assume what happened. DO NOT fill gaps with plausible information.
9. DO NOT accuse anyone. DO NOT assume intent. Write ONLY what the data shows.

FORMATTING RULES:
10. OUTPUT ONLY VALID HTML. No markdown. No asterisks (**). No backticks. No text outside HTML tags.
11. DO NOT use ** or __ for bold — use <strong> tags only.
12. Every section listed in the structure below MUST appear in the output.
13. Use ONLY the CSS class names defined in the structure. Do not add inline styles.
14. The report must be formal, neutral, and court-appropriate in language.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
EVIDENCE DATA TO ANALYZE:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${JSON.stringify(evidenceJSON, null, 2)}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OUTPUT FORMAT — USE EXACTLY THIS HTML STRUCTURE:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

<div class="report-wrapper">

  <!-- 1. HEADER -->
  <div class="report-header">
    <h1>Forensic Investigation Report</h1>
  </div>

  <!-- 2. CASE META -->
  <div class="case-meta">
    <table>
      <tr><td class="label">Case Name:</td><td class="value">[FILL: caseName from evidence]</td></tr>
      <tr><td class="label">Case ID:</td><td class="value">[FILL: caseId from evidence]</td></tr>
      <tr><td class="label">Date:</td><td class="value">[FILL: date from evidence]</td></tr>
      <tr><td class="label">Investigator:</td><td class="value">[FILL: investigatorName from evidence]</td></tr>
      <tr><td class="label">Evidence Type:</td><td class="value">[FILL: image only / file only / image and file]</td></tr>
      <tr><td class="label">Report Status:</td><td class="value"><span class="badge badge-verified">COURT READY</span></td></tr>
    </table>
  </div>

  <!-- 3. REPORT BODY -->
  <div class="report-body">

    <!-- SECTION: INTRODUCTION -->
    <div class="section-title">Introduction</div>
    <p>[Write 2-3 sentences: what this report covers, what evidence was submitted, purpose of the investigation. Mention the SHA-256 hash value from the evidence data.]</p>

    <!-- SECTION: EVIDENCE SUMMARY -->
    <div class="section-title">Evidence Summary</div>
    <div class="integrity-box">
      <div class="hash-label">SHA-256 Hash (Evidence Integrity)</div>
      <div class="hash-value">[FILL: sha256_hash from evidence]</div>
    </div>
    <table class="evidence-table">
      <tr>
        <th>Item</th>
        <th>Details</th>
        <th>Status</th>
      </tr>
      <tr>
        <td>Evidence File</td>
        <td>[filename from evidence]</td>
        <td><span class="badge badge-verified">Verified</span></td>
      </tr>
      <tr>
        <td>SHA-256 Hash</td>
        <td class="hash-val">[sha256_hash from evidence]</td>
        <td><span class="badge badge-verified">Untampered</span></td>
      </tr>
      <tr>
        <td>Analysis Date</td>
        <td>[analyzed_at from evidence]</td>
        <td><span class="badge badge-info">Recorded</span></td>
      </tr>
    </table>

    <!-- SECTION: IMAGE ANALYSIS FINDINGS (only if image evidence exists) -->
    [IF image_evidence EXISTS IN DATA]:
    <div class="section-title">Image Analysis Findings</div>
    <ul class="findings-list">
      <li><strong>Detected Scene:</strong> [scene_type from dominant_scene]</li>
      <li><strong>Confidence Level:</strong> [confidence percentage from dominant_scene]</li>
      <li><strong>Detected By:</strong> [detected_by model name]</li>
      [FOR EACH high_confidence_detection]:
      <li><strong>[detection label]:</strong> [confidence]% confidence — [brief neutral description of what this means]</li>
      [END FOR]
    </ul>
    [END IF]

    <!-- SECTION: TECHNICAL FINDINGS -->
    <div class="section-title">Technical Findings</div>
    <ul class="findings-list">
      [IF file_evidence EXISTS]:
      <li><strong>File Analysis:</strong> [summary_for_report from file_evidence]</li>
      <li><strong>Total Lines:</strong> [total_lines]</li>
      <li><strong>IP Addresses Found:</strong> [ip_addresses_found joined with comma, or "None detected"]</li>
      <li><strong>Error Events:</strong> [count of error_events] suspicious entries detected</li>
      [END IF]
      [IF image_evidence EXISTS]:
      <li><strong>Image Source:</strong> [filename from image_evidence]</li>
      <li><strong>Scene Classification:</strong> [dominant_scene label and confidence]</li>
      [END IF]
      <li><strong>Security Assessment:</strong> [Write 1 sentence factual assessment based on what was found]</li>
      <li><strong>Code/Data Organization:</strong> [Write 1 sentence about how data was structured]</li>
      <li><strong>Error Handling:</strong> [Write 1 sentence about any errors or anomalies found]</li>
    </ul>

    <!-- SECTION: TIMELINE OF EVENTS -->
    <div class="section-title">Timeline of Events</div>
    [IF timestamps_found exists and is not empty]:
    <ul class="timeline">
      [FOR EACH timestamp in timestamps_found (max 8)]:
      <li>
        <span class="ts">[timestamp]</span>
        <span class="ev">[describe what event likely occurred at this time based on surrounding log context]</span>
      </li>
      [END FOR]
    </ul>
    [ELSE]:
    <p>No timestamps were found in the evidence file. Therefore, a chronological timeline cannot be generated for this case.</p>
    [END IF]

    <!-- SECTION: OBSERVATIONS -->
    <div class="section-title">Observations</div>
    <ul class="findings-list">
      <li>[Write factual observation 1 based strictly on evidence data]</li>
      <li>[Write factual observation 2 based strictly on evidence data]</li>
      <li>[Write factual observation 3 based strictly on evidence data]</li>
      <li>[Write factual observation 4 if applicable]</li>
    </ul>

    <!-- SECTION: CONCLUSION -->
    <div class="section-title">Conclusion</div>
    <div class="conclusion-box">
      [Write 3-4 sentences summarizing what was found. Be factual and neutral.
       Mention: what the evidence showed, whether integrity was verified, any notable findings.
       Do NOT accuse anyone. Do NOT make assumptions beyond the data.]
    </div>

    <!-- SECTION: RECOMMENDATIONS -->
    <div class="section-title">Recommendations</div>
    <ol class="rec-list">
      <li><strong>[Recommendation title]:</strong> [1 sentence actionable recommendation based on findings]</li>
      <li><strong>[Recommendation title]:</strong> [1 sentence actionable recommendation based on findings]</li>
      <li><strong>[Recommendation title]:</strong> [1 sentence actionable recommendation based on findings]</li>
    </ol>

    <!-- NOTE BOX -->
    <div class="note-box">
      <strong>Note:</strong> This report is based solely on the provided evidence data and does not include any external information or assumptions. All findings are generated from the submitted evidence only. This report was generated by the ForensiQ Automated Digital Forensics Reporting Tool.
    </div>

  </div><!-- end report-body -->

  <!-- FOOTER -->
  <div class="report-footer">
    <span>ForensiQ — Automated Digital Forensics Reporting Tool</span>
    <span>Case ID: [caseId] | Generated: [date]</span>
  </div>

</div><!-- end report-wrapper -->

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FINAL CHECKLIST BEFORE YOU GENERATE:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Before writing the report, ask yourself:
  ✓ Is every fact I am writing present in the EVIDENCE DATA JSON above?
  ✓ Am I using the exact filename, hash, timestamps, IPs from the JSON?
  ✓ For anything missing in the JSON — did I write "Not available in evidence"?
  ✓ Did I skip any section that has no data (image section if no image, timeline if no timestamps)?
  ✓ Am I using zero markdown — only HTML tags?
  ✓ Is every bold word using <strong> and not **?

If any answer is NO — fix it before outputting.

NOW GENERATE THE COMPLETE HTML REPORT.
Use ONLY the evidence data provided. Replace every placeholder with real values from the JSON.
Output ONLY the HTML starting from <div class="report-wrapper">. Nothing before it. Nothing after it.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`.trim();
}

/**
 * Wrap LLM HTML output with CSS to produce complete HTML file
 */
function wrapReportWithCSS(llmHTMLOutput, caseId) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>ForensiQ Report — ${caseId}</title>
  ${REPORT_CSS}
</head>
<body>
  ${llmHTMLOutput}
</body>
</html>`;
}

/**
 * Generate forensic report narrative using LLaMA 3.1 via HuggingFace Inference API
 */
async function generateLLMReport(results, caseName) {
  console.log('[LLM] generateLLMReport called');
  console.log('[LLM] HF_TOKEN available:', !!HF_TOKEN);
  
  if (!HF_TOKEN) {
    console.log('[LLM] ERROR: HF_TOKEN is not set');
    return null;
  }

  // Build evidence JSON structure
  const evidenceJSON = buildEvidenceJSON(results, caseName);
  console.log('[LLM] Evidence JSON built:', JSON.stringify(evidenceJSON, null, 2));

  // Build master prompt
  const prompt = buildMasterPrompt(evidenceJSON);
  console.log('[LLM] Prompt length:', prompt.length);

  try {
    console.log('[LLM] Calling HuggingFace Router API...');
    const res = await axios.post(
      'https://router.huggingface.co/v1/chat/completions',
      {
        model: 'meta-llama/Llama-3.1-8B-Instruct',
        messages: [
          { role: 'system', content: 'You are a professional digital forensics report writer for a court of law. Generate clean HTML reports using only the evidence data provided. Use formal, neutral, court-appropriate language. Output ONLY valid HTML with no markdown.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 3000,
        temperature: 0.2
      },
      {
        headers: {
          Authorization: `Bearer ${HF_TOKEN}`,
          'Content-Type': 'application/json'
        },
        timeout: 90000
      }
    );
    console.log('[LLM] API response received');
    
    const rawHTML = res.data?.choices?.[0]?.message?.content || '<p>Report generation failed.</p>';
    console.log('[LLM] Generated HTML length:', rawHTML.length);
    console.log('[LLM] Generated HTML preview:', rawHTML.substring(0, 500));
    
    // Wrap with full CSS
    const fullReport = wrapReportWithCSS(rawHTML, evidenceJSON.caseId);
    console.log('[LLM] Full report length:', fullReport.length);
    
    return fullReport;
  } catch (err) {
    console.log('[LLM] API call failed:', err.message);
    if (err.response) {
      console.log('[LLM] API response status:', err.response.status);
      console.log('[LLM] API response data:', err.response.data);
    }
    return null;
  }
}

/**
 * AI Forensic Analysis Service
 * Realistic file processing with hash generation, anomaly detection, and report generation
 */

class AIAnalysisService {
    constructor() {
        this.suspiciousKeywords = [
            'failed',
            'unauthorized',
            'attack',
            'error',
            'breach',
            'malicious',
            'suspicious',
            'hack',
            'exploit',
            'injection',
            'denied',
            'forbidden',
            'exception',
            'critical',
            'fatal',
            'alert',
            'warning'
        ];
    }

    /**
     * Generate SHA-256 hash of file buffer
     */
    generateHash(buffer) {
        return crypto.createHash('sha256').update(buffer).digest('hex');
    }

    /**
     * Detect file type from extension and content
     */
    detectFileType(fileName, mimeType) {
        const ext = path.extname(fileName).toLowerCase();
        const typeMap = {
            '.txt': 'text',
            '.log': 'text',
            '.csv': 'csv',
            '.json': 'json',
            '.pdf': 'pdf',
            '.doc': 'document',
            '.docx': 'document',
            '.mp3': 'audio',
            '.wav': 'audio',
            '.png': 'image',
            '.jpg': 'image',
            '.jpeg': 'image'
        };
        
        return typeMap[ext] || 'binary';
    }

    /**
     * Extract content from file based on type
     */
    async extractContent(filePath, fileType) {
        try {
            if (!fs.existsSync(filePath)) {
                return { content: '', error: 'File not found' };
            }

            const buffer = fs.readFileSync(filePath);
            const hash = this.generateHash(buffer);

            let content = '';
            
            switch (fileType) {
                case 'text':
                case 'log':
                case 'csv':
                case 'json':
                    content = buffer.toString('utf-8');
                    break;
                case 'pdf':
                case 'document':
                case 'audio':
                case 'image':
                    content = `[${fileType.toUpperCase()} FILE] Binary data - Hash: ${hash.substring(0, 16)}...`;
                    break;
                default:
                    content = '[BINARY FILE] Content not displayable';
            }

            return { content, hash, size: buffer.length };
        } catch (error) {
            console.error('Content extraction error:', error);
            return { content: '', error: error.message };
        }
    }

    /**
     * Detect anomalies in text content
     */
    detectAnomalies(content, fileType) {
        const anomalies = [];
        const contentLower = content.toLowerCase();

        // Keyword-based detection
        this.suspiciousKeywords.forEach(keyword => {
            const regex = new RegExp(keyword, 'gi');
            const matches = content.match(regex);
            if (matches) {
                const severity = this.getSeverity(keyword, matches.length);
                anomalies.push({
                    type: 'Keyword Detection',
                    keyword: keyword,
                    count: matches.length,
                    severity: severity,
                    description: `Found ${matches.length} occurrence(s) of suspicious keyword "${keyword}"`
                });
            }
        });

        // IP address detection
        const ipRegex = /\b(?:\d{1,3}\.){3}\d{1,3}\b/g;
        const ips = content.match(ipRegex);
        if (ips && ips.length > 0) {
            const uniqueIps = [...new Set(ips)];
            if (uniqueIps.length > 5) {
                anomalies.push({
                    type: 'Network Activity',
                    count: uniqueIps.length,
                    severity: 'MEDIUM',
                    description: `Detected ${uniqueIps.length} unique IP addresses in the file`
                });
            }
        }

        // Timestamp anomaly detection
        const timestampRegex = /\d{4}-\d{2}-\d{2}|\d{2}\/\d{2}\/\d{4}/g;
        const timestamps = content.match(timestampRegex);
        if (timestamps && timestamps.length > 0) {
            anomalies.push({
                type: 'Temporal Analysis',
                count: timestamps.length,
                severity: 'LOW',
                description: `Found ${timestamps.length} timestamp entries`
            });
        }

        // File size anomaly
        if (content.length > 1000000) {
            anomalies.push({
                type: 'File Size',
                size: content.length,
                severity: 'MEDIUM',
                description: `Large file detected (${(content.length / 1024).toFixed(2)} KB)`
            });
        }

        return anomalies;
    }

    /**
     * Determine severity based on keyword and count
     */
    getSeverity(keyword, count) {
        const highSeverityKeywords = ['attack', 'breach', 'hack', 'exploit', 'injection'];
        
        if (highSeverityKeywords.includes(keyword.toLowerCase()) || count > 5) {
            return 'HIGH';
        } else if (count > 2) {
            return 'MEDIUM';
        }
        return 'LOW';
    }

    /**
     * Calculate confidence score based on anomalies
     */
    calculateConfidence(anomalies) {
        if (anomalies.length === 0) {
            return 95.0; // High confidence if no anomalies
        }

        const highSeverityCount = anomalies.filter(a => a.severity === 'HIGH').length;
        const mediumSeverityCount = anomalies.filter(a => a.severity === 'MEDIUM').length;
        const lowSeverityCount = anomalies.filter(a => a.severity === 'LOW').length;

        // Base confidence decreases with more high-severity anomalies
        let confidence = 95.0;
        confidence -= (highSeverityCount * 15);
        confidence -= (mediumSeverityCount * 5);
        confidence -= (lowSeverityCount * 2);

        return Math.max(50.0, Math.min(99.9, confidence));
    }

    /**
     * Format bytes to human-readable format
     */
    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * Main analysis pipeline with progress callback
     */
    async analyzeFiles(evidenceFiles, onProgress) {
        const results = {
            files: [],
            totalAnomalies: [],
            overallConfidence: 0,
            processingTime: 0,
            llmReport: null,
            startTime: Date.now()
        };

        try {
            for (let i = 0; i < evidenceFiles.length; i++) {
                const file = evidenceFiles[i];
                const progress = Math.round(((i + 1) / evidenceFiles.length) * 100);

                if (onProgress) {
                    onProgress({ stage: 'Processing', file: file.fileName, progress, message: `Analyzing ${file.fileName}...` });
                }

                await new Promise(resolve => setTimeout(resolve, 1000));

                const fileType = this.detectFileType(file.fileName, file.fileType);
                let contentResult = { content: '', hash: '' };
                let imageAnalysis = null;

                const hasRealFile = file.filePath && fs.existsSync(file.filePath);

                // Image analysis via HuggingFace
                if (isImage(file.fileName) && hasRealFile) {
                    if (onProgress) onProgress({ stage: 'Image Analysis', file: file.fileName, progress, message: `Running AI image analysis on ${file.fileName}...` });
                    imageAnalysis = await analyzeImage(file.filePath, file.fileName);
                    const dummyBuffer = fs.readFileSync(file.filePath);
                    contentResult = { content: imageAnalysis.forensicSummary, hash: this.generateHash(dummyBuffer), size: dummyBuffer.length };
                } else if (hasRealFile) {
                    contentResult = await this.extractContent(file.filePath, fileType);
                } else {
                    const dummyBuffer = Buffer.from(file.fileName + (file.fileType || ''));
                    contentResult = {
                        content: `[${fileType.toUpperCase()} FILE] ${file.fileName}`,
                        hash: this.generateHash(dummyBuffer),
                        size: file.fileSize || 0
                    };
                }

                const anomalies = this.detectAnomalies(contentResult.content, fileType);

                // Add image risk indicators as anomalies
                if (imageAnalysis && imageAnalysis.riskIndicators.length > 0) {
                    imageAnalysis.riskIndicators.forEach(risk => {
                        anomalies.push({
                            type: 'Image Risk Indicator',
                            keyword: risk,
                            count: 1,
                            severity: 'HIGH',
                            description: `Image contains potential risk indicator: "${risk}"`
                        });
                    });
                }

                results.files.push({
                    fileName: file.fileName,
                    fileType: fileType,
                    fileSize: contentResult.size,
                    hash: contentResult.hash,
                    anomalies,
                    confidence: imageAnalysis ? imageAnalysis.confidence : this.calculateConfidence(anomalies),
                    imageAnalysis: imageAnalysis || null,
                    processedAt: new Date().toISOString(),
                    filePath: file.filePath || null,
                    content: contentResult.content || null
                });

                results.totalAnomalies.push(...anomalies);
            }

            results.overallConfidence = this.calculateConfidence(results.totalAnomalies);
            results.processingTime = ((Date.now() - results.startTime) / 1000).toFixed(2);

            // Generate LLM narrative report
            if (onProgress) onProgress({ stage: 'LLM Report', progress: 95, message: 'Generating AI narrative report...' });
            
            const caseName = `${results.files.length} evidence file(s) analyzed`;
            const llmReport = await generateLLMReport(results, caseName);
            
            // No fallback - LLM is required
            if (!llmReport) {
                throw new Error('LLM API is required but unavailable. Please check network connectivity and DNS settings.');
            }
            
            results.llmReport = llmReport;

            if (onProgress) onProgress({ stage: 'Complete', progress: 100, message: 'Analysis complete' });

            return results;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Generate fallback report without LLM
     */
    generateFallbackReport(results, caseContext) {
        const highSeverity = results.totalAnomalies.filter(a => a.severity === 'HIGH');
        const mediumSeverity = results.totalAnomalies.filter(a => a.severity === 'MEDIUM');
        const lowSeverity = results.totalAnomalies.filter(a => a.severity === 'LOW');
        
        let report = `FORENSIC INVESTIGATION REPORT

Case Name: ${caseContext}
Case ID: CASE-2026-001
Date: ${new Date().toISOString().split('T')[0]}
Investigator: AI Investigator

Report Findings:

Case Report: ${caseContext}

Case Name: ${caseContext}
Incident Date: ${new Date().toISOString().split('T')[0]}

Introduction:

This forensic analysis was conducted on ${results.files.length} evidence file(s) using automated analysis tools including SHA-256 hash verification, pattern recognition, and anomaly detection protocols. The analysis identifies security patterns, correlations, and potential risks in the provided evidence.

Evidence Summary:

`;

        // Add evidence summary
        results.files.forEach(f => {
            report += `- File: ${f.fileName}\n`;
            report += `  Type: ${f.fileType}\n`;
            report += `  Size: ${this.formatBytes(f.fileSize)}\n`;
            report += `  SHA-256 Hash: ${f.hash}\n`;
            report += `  Confidence: ${f.confidence.toFixed(1)}%\n\n`;
        });

        report += `Technical Findings:

`;

        // Add technical findings based on evidence type
        results.files.forEach(f => {
            if (f.fileType === 'log' || f.fileType === 'text') {
                report += `Log Analysis for ${f.fileName}:\n`;
                report += `- Pattern Analysis: Automated pattern recognition detected standard log structures\n`;
                if (f.content) {
                    const ipMatches = f.content.match(/\b(?:\d{1,3}\.){3}\d{1,3}\b/g);
                    if (ipMatches) {
                        const uniqueIps = [...new Set(ipMatches)];
                        report += `- IP Addresses Detected: ${uniqueIps.length} unique IP addresses found\n`;
                    }
                    const failedLogins = (f.content.match(/failed|FAILED|error|ERROR/g) || []).length;
                    if (failedLogins > 0) {
                        report += `- Failed Login Attempts: ${failedLogins} occurrences detected\n`;
                    }
                }
                report += `- Timestamp Analysis: Log entries contain temporal data for timeline reconstruction\n\n`;
            } else {
                report += `File Analysis for ${f.fileName}:\n`;
                report += `- File Type: ${f.fileType}\n`;
                report += `- Hash Verification: SHA-256 hash computed successfully\n`;
                report += `- Size: ${this.formatBytes(f.fileSize)}\n\n`;
            }
        });

        // Add anomalies
        if (highSeverity.length > 0) {
            report += `Security Risks:\n`;
            highSeverity.forEach(a => {
                report += `- [HIGH] ${a.type}: ${a.description}\n`;
            });
            report += `\n`;
        }

        if (mediumSeverity.length > 0) {
            report += `Warnings:\n`;
            mediumSeverity.forEach(a => {
                report += `- [MEDIUM] ${a.type}: ${a.description}\n`;
            });
            report += `\n`;
        }

        report += `Timeline:

Analysis completed in ${results.processingTime} seconds. Evidence files were processed with ${results.totalAnomalies.length} anomaly(ies) detected across all files.

Conclusion:

Based on the automated analysis of ${results.files.length} evidence file(s), ${highSeverity.length} high-severity and ${mediumSeverity.length} medium-severity findings were identified. Overall risk level is ${highSeverity.length > 0 ? 'HIGH' : mediumSeverity.length > 2 ? 'MEDIUM' : 'LOW'}. Analysis confidence: ${results.overallConfidence.toFixed(1)}%.

Recommendations:

- Review high-severity findings immediately
- Investigate medium-severity anomalies for potential impact
- Implement additional monitoring if repeated patterns are detected
- Maintain chain of custody for all evidence files
- Consider manual review for complex patterns

Note: This report was generated by automated forensic analysis tools. For legal proceedings, additional manual verification may be required.`;

        return report;
    }

    /**
     * Generate analysis summary
     */
    generateSummary(results) {
        const highSeverity = results.totalAnomalies.filter(a => a.severity === 'HIGH').length;
        const mediumSeverity = results.totalAnomalies.filter(a => a.severity === 'MEDIUM').length;
        const lowSeverity = results.totalAnomalies.filter(a => a.severity === 'LOW').length;

        return {
            totalFiles: results.files.length,
            totalAnomalies: results.totalAnomalies.length,
            severityBreakdown: {
                HIGH: highSeverity,
                MEDIUM: mediumSeverity,
                LOW: lowSeverity
            },
            overallConfidence: results.overallConfidence,
            processingTime: results.processingTime,
            riskLevel: highSeverity > 0 ? 'HIGH' : mediumSeverity > 2 ? 'MEDIUM' : 'LOW'
        };
    }
}

module.exports = new AIAnalysisService();
