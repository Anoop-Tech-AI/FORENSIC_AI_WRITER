const Case = require('../models/Case');
const Evidence = require('../models/Evidence');
const Report = require('../models/Report');
const aiAnalysisService = require('../services/aiAnalysisService');
const pdfReportService = require('../services/pdfReportService');

// In-memory evidence store (shared with evidenceRoutes)
let evidenceStore = [];

// Function to set the evidence store (called from evidenceRoutes)
const setEvidenceStore = (store) => {
    evidenceStore = store;
};

/**
 * Debug: Check evidence for a case
 */
const checkCaseEvidence = async (req, res) => {
    try {
        const { caseId } = req.params;
        
        // Use in-memory store
        const evidence = evidenceStore.filter(e => e.caseId === caseId);
        
        return res.json({
            caseId: caseId,
            caseName: 'Case',
            status: 'active',
            evidenceCount: evidence.length,
            evidence: evidence.map(e => ({
                id: e._id,
                fileName: e.fileName,
                fileType: e.fileType,
                fileSize: e.fileSize,
                fileUrl: e.fileUrl,
                hash: e.fileHash || 'hash_' + e._id
            }))
        });
    } catch (error) {
        console.error("Error checking case evidence:", error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

/**
 * Perform deep forensic analysis on a specific case
 */
const analyzeCase = async (req, res) => {
    try {
        const { caseId } = req.params;
        const { evidenceIds, evidenceData } = req.body;

        console.log(`\n=== FORENSIC ANALYSIS START ===`);
        console.log(`Case ID: ${caseId}`);
        console.log(`Evidence IDs:`, evidenceIds);
        console.log(`Evidence Data:`, evidenceData);

        // Use in-memory store instead of MongoDB
        let evidenceToAnalyze = [];
        if (evidenceIds && Array.isArray(evidenceIds) && evidenceIds.length > 0) {
            console.log(`[AI] Analyzing ${evidenceIds.length} specific evidence files`);
            evidenceToAnalyze = evidenceStore.filter(e => 
                evidenceIds.includes(e._id) && e.caseId === caseId
            );
        } else {
            console.log(`[AI] Analyzing ALL evidence in case`);
            evidenceToAnalyze = evidenceStore.filter(e => e.caseId === caseId);
        }

        if (evidenceToAnalyze.length === 0 && evidenceData && evidenceData.length > 0) {
            // Use provided evidence data if no evidence found in store
            console.log(`[AI] Using provided evidence data`);
            evidenceToAnalyze = evidenceData.map((e, idx) => ({
                _id: `temp_${idx}`,
                fileName: e.fileName,
                fileType: e.fileType,
                fileSize: e.fileSize,
                fileUrl: '',
                filePath: null
            }));
        }

        if (evidenceToAnalyze.length === 0) {
            return res.status(400).json({
                message: 'No evidence selected or found for analysis.',
                debug: { caseId, evidenceIdsSent: evidenceIds, storeSize: evidenceStore.length }
            });
        }

        console.log(`[AI] Files to analyze: ${evidenceToAnalyze.length}`);
        evidenceToAnalyze.forEach((ev, idx) => {
            console.log(`  [${idx + 1}] ${ev.fileName} (${ev.fileType}) - ${ev.fileSize} bytes`);
        });

        // Run AI analysis with progress tracking
        const analysisResult = await aiAnalysisService.analyzeFiles(evidenceToAnalyze, (progress) => {
            console.log(`[AI PROGRESS] ${progress.stage}: ${progress.message} (${progress.progress}%)`);
        });

        console.log(`[AI] Analysis complete - Confidence: ${analysisResult.overallConfidence}%`);
        console.log(`[AI] Total anomalies detected: ${analysisResult.totalAnomalies.length}`);

        // Generate PDF report
        console.log(`[AI] Generating PDF report...`);
        const caseInfo = {
            caseId: caseId,
            caseName: req.body.caseName || 'Forensic Case'
        };
        
        const reportResult = await pdfReportService.generateReport(analysisResult, caseInfo);
        console.log(`[AI] Report generated: ${reportResult.reportFileName}`);

        // Generate summary
        const summary = aiAnalysisService.generateSummary(analysisResult);

        // Save report metadata to MongoDB
        console.log(`[AI] Saving report to database...`);
        const fs = require('fs');
        const reportStats = fs.statSync(reportResult.reportPath);
        
        const newReport = new Report({
            caseId: caseId,
            caseName: caseInfo.caseName,
            reportId: `AI-${Date.now()}`,
            reportName: reportResult.reportFileName,
            reportPath: reportResult.reportPath,
            reportUrl: reportResult.reportUrl,
            fileSize: reportStats.size,
            summary: summary.summary,
            confidence: summary.overallConfidence,
            anomalies: summary.totalAnomalies,
            riskLevel: summary.riskLevel,
            generatedBy: req.user?._id || null,
            caseRef: caseId,
            files: analysisResult.files.map(f => ({
                fileName: f.fileName,
                fileType: f.fileType,
                fileSize: f.fileSize,
                hash: f.hash,
                confidence: f.confidence,
                anomalies: f.anomalies.length
            }))
        });

        await newReport.save();
        console.log(`[AI] Report saved to database with ID: ${newReport._id}`);

        // Structure the final response
        const analysis = {
            caseId: caseId,
            analysisId: `AI-${Date.now()}`,
            timestamp: new Date().toISOString(),
            summary: `Forensic analysis completed successfully. ${summary.totalAnomalies} anomaly(ies) detected across ${summary.totalFiles} file(s).`,
            introduction: `This forensic analysis was conducted using advanced AI techniques including hash verification, content extraction, HuggingFace image recognition, and LLaMA-3.1 report generation.`,
            evidence_summary: `The neural engine analyzed ${summary.totalFiles} evidence artifacts using SHA-256 hash verification and pattern recognition protocols.`,
            llmReport: analysisResult.llmReport || null,
            timeline: `Analysis completed in ${analysisResult.processingTime}s with ${summary.totalAnomalies} anomalies detected.`,
            observations: `Analysis revealed ${summary.severityBreakdown.HIGH} high-severity, ${summary.severityBreakdown.MEDIUM} medium-severity, and ${summary.severityBreakdown.LOW} low-severity findings.`,
            conclusions: `The evidence indicates ${summary.riskLevel.toLowerCase()} risk level. Confidence score: ${summary.overallConfidence.toFixed(1)}%.`,
            anomalies: summary.totalAnomalies,
            confidence: summary.overallConfidence / 100,
            findings: analysisResult.totalAnomalies.map(a => ({
                type: a.type,
                description: a.description,
                confidence: a.severity === 'HIGH' ? 0.95 : a.severity === 'MEDIUM' ? 0.85 : 0.75,
                evidence: [a.keyword || 'File analysis']
            })),
            imageResults: analysisResult.files
                .filter(f => f.imageAnalysis)
                .map(f => ({
                    fileName: f.fileName,
                    sceneLabels: f.imageAnalysis.sceneLabels,
                    detectedObjects: f.imageAnalysis.detectedObjects,
                    forensicSummary: f.imageAnalysis.forensicSummary,
                    riskIndicators: f.imageAnalysis.riskIndicators,
                    confidence: f.imageAnalysis.confidence,
                })),
            riskLevel: summary.riskLevel,
            recommendations: [
                summary.highSeverity > 0 ? 'Immediate investigation required for high-severity anomalies' : 'Monitor for any unusual activity',
                'Verify file integrity using SHA-256 hashes',
                'Cross-reference findings with other evidence sources',
                'Document all findings for legal proceedings'
            ],
            evidenceProcessed: summary.totalFiles,
            processingTime: `${analysisResult.processingTime}s`,
            confidenceScore: summary.overallConfidence / 100,
            reportUrl: reportResult.reportUrl,
            reportFileName: reportResult.reportFileName,
            files: analysisResult.files
        };

        res.json({
            success: true,
            analysis: analysis,
            evidenceAnalyzed: summary.totalFiles,
            summary: summary
        });

    } catch (error) {
        console.error(`\n=== ANALYSIS ERROR ===`);
        console.error("Error:", error.message);
        console.error("Stack:", error.stack);
        console.error(`=== END ERROR ===\n`);

        res.status(500).json({
            message: 'Forensic Analysis Error',
            error: error.message,
            debug: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

module.exports = { analyzeCase, checkCaseEvidence, setEvidenceStore };
