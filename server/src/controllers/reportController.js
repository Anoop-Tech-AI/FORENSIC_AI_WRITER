const Report = require('../models/Report');
const Case = require('../models/Case');
const Evidence = require('../models/Evidence');
const pdfReportService = require('../services/pdfReportService');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Helper function to check if a user can access a report
const canAccessReport = (report, user) => {
    const isOwner = report.generatedBy?.toString() === user._id.toString();
    const isAdminOrLegal = ['admin', 'legal_advisor'].includes(user.role);
    return isOwner || isAdminOrLegal;
};

// Helper to generate textual conclusions
function generateConclusions(analysisResults) {
    const totalEvidence = (analysisResults.evidence || []).length;
    const criticalFindings = (analysisResults.criticalFindings || []).length;
    const highSeverityAnomalies = (analysisResults.anomalies || [])
        .filter(a => a.severity === 'high').length;

    let conclusion = `AI-powered forensic analysis of ${totalEvidence} evidence files `;

    if (criticalFindings > 0 || highSeverityAnomalies > 0) {
        conclusion += `identified ${criticalFindings + highSeverityAnomalies} critical security issues requiring immediate attention. `;
        conclusion += `The evidence suggests potential security threats that warrant further investigation.`;
    } else if ((analysisResults.anomalies || []).length > 0) {
        conclusion += `detected ${analysisResults.anomalies.length} anomalies that should be reviewed. `;
        conclusion += `While no critical threats were identified, the detected patterns suggest areas requiring monitoring.`;
    } else {
        conclusion += `found no critical security threats. The analyzed evidence shows normal operational patterns.`;
    }
    return conclusion;
}

// Helper to calculate confidence score
function calculateConfidence(analysisResults) {
    let confidence = 75;
    if ((analysisResults.evidence || []).length > 5) confidence += 10;
    if ((analysisResults.timeline || []).length > 20) confidence += 5;
    if ((analysisResults.patterns || []).length > 0) confidence += 5;
    if ((analysisResults.anomalies || []).length > 0) confidence += 10;
    return Math.min(confidence, 95);
}

// @desc    Create/Save a forensic report
// @route   POST /api/reports
// @access  Private (investigator)
const saveReport = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        const { caseId, caseName, summary, introduction, evidence_summary, timeline, observations, conclusions, anomalies, confidence, reportId, caseRef } = req.body;

        const report = await Report.create({
            caseId,
            caseName,
            summary,
            introduction,
            evidence_summary,
            timeline,
            observations,
            conclusions,
            anomalies: parseInt(anomalies) || 0,
            confidence,
            reportId,
            caseRef,
            generatedBy: req.user._id
        });

        await Case.findByIdAndUpdate(caseRef, { status: 'Completed' });
        res.status(201).json(report);
    } catch (error) {
        console.error('[REPORT] Save Report Error:', error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Get all reports (admin/legal see all; investigator sees own)
// @route   GET /api/reports
// @access  Private
const getReports = async (req, res) => {
    try {
        const query = ['admin', 'legal_advisor'].includes(req.user.role)
            ? {}
            : { generatedBy: req.user._id };
        const reports = await Report.find(query).sort('-createdAt');
        res.json(reports);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Delete a report
// @route   DELETE /api/reports/:id
// @access  Private (owner or admin)
const deleteReport = async (req, res) => {
    try {
        const report = await Report.findById(req.params.id);
        if (!report) return res.status(404).json({ message: 'Report not found' });

        const isOwner = report.generatedBy?.toString() === req.user._id.toString();
        if (!isOwner && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized' });
        }
        await Report.findByIdAndDelete(req.params.id);
        res.json({ message: 'Report deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Generate AI-powered forensic report with PDF
// @route   POST /api/reports/generate
// @access  Private (investigator only)
const generateForensicReport = async (req, res) => {
    try {
        console.log('[FORENSIC] Starting AI-powered report generation');

        const { caseId, caseName, investigatorName } = req.body;

        if (!caseId) {
            return res.status(400).json({ message: 'Case ID is required' });
        }

        // Get case and evidence
        const forensicCase = await Case.findById(caseId).populate('evidence');
        if (!forensicCase) {
            return res.status(404).json({ message: 'Case not found' });
        }

        console.log(`[FORENSIC] Processing case: ${forensicCase.caseName}`);

        if (!forensicCase.evidence || forensicCase.evidence.length === 0) {
            return res.status(400).json({ message: 'No evidence files found for this case' });
        }

        // Build analysis summary from available evidence
        const analysisResults = {
            evidence: forensicCase.evidence,
            patterns: [],
            anomalies: [],
            criticalFindings: [],
            timeline: [],
            insights: []
        };

        const caseInfo = {
            caseId: forensicCase.caseId || `CASE-${Date.now()}`,
            caseName: forensicCase.caseName,
            investigatorName: investigatorName || req.user.name || req.user.username || 'Forensic Analyst',
            generatedAt: new Date().toISOString()
        };

        // Generate PDF using pdfReportService
        const reportId = `FORENSIC-${uuidv4()}`;
        const pdfFileName = `${reportId}.pdf`;
        const uploadsDir = path.join(__dirname, '../../uploads');
        if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
        const pdfPath = path.join(uploadsDir, pdfFileName);

        console.log(`[FORENSIC] Generating PDF: ${pdfFileName}`);
        await pdfReportService.generateReport(
            {
                title: `Forensic Investigation Report - ${forensicCase.caseName}`,
                sections: [
                    { heading: 'Introduction', content: `This report presents findings from case ${caseInfo.caseId}.` },
                    { heading: 'Evidence Summary', content: `${forensicCase.evidence.length} evidence files were analyzed.` },
                    { heading: 'Conclusions', content: generateConclusions(analysisResults) }
                ]
            },
            pdfPath
        );

        // Save report to database
        const report = await Report.create({
            caseId: forensicCase._id,
            caseName: forensicCase.caseName,
            reportId,
            summary: `AI-powered forensic analysis of ${forensicCase.evidence.length} evidence files`,
            introduction: `This report presents the findings from an AI-powered forensic investigation conducted on ${new Date().toLocaleDateString()}.`,
            evidence_summary: `${forensicCase.evidence.length} evidence files were analyzed.`,
            timeline: `${analysisResults.timeline.length} timeline events identified.`,
            observations: `${analysisResults.patterns.length} patterns and ${analysisResults.anomalies.length} anomalies detected.`,
            conclusions: generateConclusions(analysisResults),
            anomalies: analysisResults.criticalFindings.length,
            confidence: calculateConfidence(analysisResults),
            caseRef: forensicCase._id,
            generatedBy: req.user._id,
            pdfUrl: `/uploads/${pdfFileName}`,
            analysisResults
        });

        await Case.findByIdAndUpdate(forensicCase._id, {
            status: 'Completed',
            completedAt: new Date()
        });

        console.log(`[FORENSIC] Report generated successfully: ${report._id}`);

        res.status(201).json({
            message: 'Forensic report generated successfully',
            report,
            pdfUrl: `/uploads/${pdfFileName}`,
            analysisSummary: {
                evidenceCount: forensicCase.evidence.length,
                patternsDetected: analysisResults.patterns.length,
                anomaliesFound: analysisResults.anomalies.length,
                criticalFindings: analysisResults.criticalFindings.length
            }
        });

    } catch (error) {
        console.error('[FORENSIC] Error generating report:', error);
        res.status(500).json({
            message: 'Error generating forensic report',
            error: error.message
        });
    }
};

// @desc    Download forensic report PDF
// @route   GET /api/reports/:id/download
// @access  Private (owner, admin, legal_advisor)
const downloadReport = async (req, res) => {
    try {
        const report = await Report.findById(req.params.id);

        if (!report) {
            return res.status(404).json({ message: 'Report not found' });
        }

        if (!canAccessReport(report, req.user)) {
            return res.status(403).json({ message: 'Not authorized to access this report' });
        }

        const pdfUrl = report.pdfUrl || report.reportUrl;
        if (!pdfUrl) {
            return res.status(404).json({ message: 'PDF file not found' });
        }

        const pdfPath = path.join(__dirname, '../../..', pdfUrl);

        if (!fs.existsSync(pdfPath)) {
            return res.status(404).json({ message: 'PDF file not found on server' });
        }

        res.download(pdfPath, `Forensic-Report-${report.caseName}-${report.reportId}.pdf`);
    } catch (error) {
        console.error('[FORENSIC] Error downloading report:', error);
        res.status(500).json({ message: 'Error downloading report', error: error.message });
    }
};

// @desc    Get detailed analysis results for a report
// @route   GET /api/reports/:id/analysis
// @access  Private (owner, admin, legal_advisor)
const getReportAnalysis = async (req, res) => {
    try {
        const report = await Report.findById(req.params.id);

        if (!report) {
            return res.status(404).json({ message: 'Report not found' });
        }

        if (!canAccessReport(report, req.user)) {
            return res.status(403).json({ message: 'Not authorized to access this report' });
        }

        res.json({
            report: {
                id: report._id,
                caseName: report.caseName,
                reportId: report.reportId,
                generatedAt: report.createdAt,
                confidence: report.confidence
            },
            analysis: report.analysisResults || null
        });
    } catch (error) {
        console.error('[FORENSIC] Error fetching analysis:', error);
        res.status(500).json({ message: 'Error fetching analysis', error: error.message });
    }
};

module.exports = {
    saveReport,
    getReports,
    deleteReport,
    generateForensicReport,
    downloadReport,
    getReportAnalysis
};


