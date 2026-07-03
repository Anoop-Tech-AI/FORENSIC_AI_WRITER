# 🔬 Evidence Analysis - Testing Guide

## ✅ What Was Fixed

### 1. **Evidence Population Bug** ✓
- **Problem**: Cases retrieved from `GET /api/cases` were NOT including evidence data
- **Fix**: Added `.populate('evidence')` to `caseController.getCases()`
- **Impact**: Client now gets full evidence array when fetching cases

### 2. **Evidence Upload Logging** ✓
- **Problem**: Couldn't track if evidence was properly linked to cases
- **Fix**: Added comprehensive logging to `evidenceController.uploadEvidence()`
- **Shows**:
  - File received confirmation
  - SHA-256 hash calculation
  - Evidence document creation
  - Linking to case
  - Final evidence count in case

### 3. **AI Analysis Logging** ✓
- **Problem**: No visibility into why analysis fails
- **Fix**: Enhanced `aiController.analyzeCase()` with detailed debug output
- **Shows**:
  - Case found confirmation
  - Evidence count verification
  - Each file being processed
  - Content extraction length
  - Error messages with details

### 4. **File Extraction Enhancement** ✓
- **Problem**: Log files and other formats not reading properly
- **Fix**: Updated `aiService.extractTextFromFiles()` with:
  - Per-file logging
  - Better format detection
  - Fallback UTF-8 reading
  - Clear error messages

### 5. **Client Feedback** ✓
- **Problem**: No user-facing messages about missing evidence
- **Fix**: Enhanced `AIInvestigator.startAnalysis()` to show:
  - Evidence count before analysis
  - File list before processing
  - Better error messages
  - Debug info display

---

## 📋 Step-by-Step Testing

### Step 1: Create a Case
1. Go to Dashboard → "Initiate Investigation"
2. Fill in:
   - Case Name: `Test Case - Log Analysis`
   - Investigator Name: `Your Name`
   - Notes: `Testing log evidence extraction`
3. Click "Continue to Evidence"

**Expected Result**: Case is created and you're redirected to upload page

---

### Step 2: Upload Log Evidence (CRITICAL)
1. On "Ingest Evidence" page
2. Upload your LOG file (`.log`, `.evtx`, `.txt`, etc.)
3. Wait for upload to complete - you should see "Vault Secured" message

**Server Will Log**:
```
[EVIDENCE] Starting upload for case: FW-XXXX
[EVIDENCE] Files count: 1
[EVIDENCE] Case found: Test Case - Log Analysis
  [your-file.log] Starting hash calculation...
  [your-file.log] Hash: abc123def456...
  [your-file.log] Evidence doc created: ObjectID...
[EVIDENCE] All 1 files linked to case
[EVIDENCE] Case evidence count: 1
[EVIDENCE] Upload complete
```

---

### Step 3: Run AI Analysis
1. Go to Dashboard → "AI Investigator"
2. Select your case from dropdown
3. Click "Execute Neural Analysis"

**Expected Console Output**:
```
=== ANALYSIS START ===
Case ID: FW-XXXX
Case Found: Test Case - Log Analysis
Evidence Count: 1
  [1] your-file.log (text/plain) - 5234 bytes

Phase 1: Extracting evidence content...
Processing: your-file.log from /uploads/evidence-xxx.log
  → Processing as LOG/TEXT
  ✓ Read as UTF-8 text: 5234 characters
Final combined content length: 5234 characters

Phase 2: Running AI analysis...
Analysis complete

=== ANALYSIS COMPLETE ===
```

**On Screen You Should See**:
- ✔ "Ingesting Evidence for Analysis..." 
- ✔ "[1] your-file.log (5234 bytes)" - THIS PROVES FILE IS FOUND
- ✔ "Analyzing 1 Assets..."
- ✔ "Neural inference complete. 1 files analyzed."
- ✔ Progress bar reaches 100%
- ✔ "Investigation Analysis Complete" message
- ✔ "Executive Summary" section appears with findings

---

### Step 4: Check Diagnostic Debug Endpoint
If analysis fails, check if evidence exists:

**Terminal Command**:
```bash
curl -X GET http://localhost:5000/api/ai/check/YOUR_CASE_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Good Response**:
```json
{
  "caseId": "...",
  "caseName": "Test Case - Log Analysis",
  "evidenceCount": 1,
  "evidence": [
    {
      "fileName": "your-file.log",
      "fileType": "text/plain",
      "fileSize": 5234,
      "fileUrl": "/uploads/evidence-1234567890-123456789.log",
      "hash": "abc123def456..."
    }
  ]
}
```

**Bad Response** (evidence missing):
```json
{
  "caseId": "...",
  "caseName": "Test Case",
  "evidenceCount": 0,
  "evidence": []
}
```

---

## 🐛 Troubleshooting

### Issue: "No evidence indexed for this case"
**Cause**: Evidence didn't upload/link properly

**Solution**:
1. Check server logs during upload - look for `[EVIDENCE]` lines
2. Use `/api/ai/check/` endpoint to verify evidence exists
3. Check `uploads/` folder - file should be there
4. Try uploading again

### Issue: "No content extracted"
**Cause**: File format not recognized

**Solution**:
1. Check server logs - look for file processing line
2. Ensure file is readable text (`.log`, `.txt`, `.csv`, etc.)
3. Try a simple `.txt` file first to verify workflow
4. Check file size - must be < 50MB

### Issue: "AI returned empty result"
**Cause**: AI service not responding

**Solution**:
1. Check `HF_API_KEY` is set in server `.env` file
2. Check Hugging Face API status
3. Try with simpler evidence first
4. Check server logs for HF API errors

---

## 📊 File Format Support

| Format | Status | How It Works |
|--------|--------|-------------|
| `.pdf` | ✅ | PDF parser extracts text |
| `.log` | ✅ | UTF-8 text read (primary target) |
| `.txt` | ✅ | UTF-8 text read |
| `.csv` | ✅ | UTF-8 text read |
| `.json` | ✅ | JSON parser |
| `.xlsx` | ⚠️ | Attempts UTF-8, falls back to metadata |
| `.evtx` | ✅ | UTF-8 text read (Event logs) |
| Binary | ⚠️ | Metadata preserved in report |

---

## 📝 Expected Analysis Report

After successful analysis, the report should include:

```json
{
  "summary": "Factual 1-2 sentence summary of findings",
  "introduction": "Scope of analysis - what files reviewed",
  "evidence_summary": "List of files analyzed with types",
  "timeline": ["TIMESTAMP: Event 1", "TIMESTAMP: Event 2"],
  "observations": ["Finding 1", "Finding 2", "Anomaly X"],
  "conclusions": "Summary of verified findings only",
  "anomalies": 3,
  "confidence": "85%"
}
```

The report should contain **ONLY facts from the evidence**, no speculation.

---

## 🚀 Quick Start Commands

```bash
# Start server with logging
cd server
npm run dev

# In another terminal, start client
cd client
npm run dev

# View server logs in real-time (look for [EVIDENCE] and [CASE])
tail -f server_log.txt
```

---

## ✨ Success Indicators

You'll know everything is working when:

1. ✅ Upload page shows "Vault Secured" after upload
2. ✅ Case dropdown in AI Investigator shows your case
3. ✅ Evidence count shows "Analyzing X Assets"
4. ✅ Detailed file list appears in terminal
5. ✅ Progress bar reaches 100%
6. ✅ "Analysis Complete" message appears
7. ✅ Executive Summary shows with findings
8. ✅ Server logs show `=== ANALYSIS COMPLETE ===`

---

Good luck! Report back with any issues and I'll help debug. 🎯
