const express = require('express');
const router = express.Router();

// Mock reports storage
let mockReports = [
    {
        _id: '1',
        title: 'Case FW-4056 Analysis Report',
        caseId: 'FW-4056',
        caseName: 'Real_crimes',
        generatedAt: new Date().toISOString(),
        summary: 'Forensic analysis completed with multiple findings',
        status: 'completed',
        findings: [
            'Communication patterns detected in call records',
            'Image metadata analysis completed',
            'Chat message database processed'
        ]
    }
];

// Get all reports
router.get('/', async (req, res) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'No token, authorization denied'
            });
        }
        
        res.json(mockReports);
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch reports'
        });
    }
});

// Create new report
router.post('/', async (req, res) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'No token, authorization denied'
            });
        }
        
        const { title, caseId, caseName, summary, findings, caseRef } = req.body;
        
        const newReport = {
            _id: Date.now().toString(),
            title: title || 'Analysis Report',
            caseId: caseId || 'Unknown',
            caseName: caseName || 'Unknown Case',
            generatedAt: new Date().toISOString(),
            summary: summary || 'Report generated successfully',
            status: 'completed',
            findings: findings || ['Analysis completed']
        };
        
        mockReports.push(newReport);
        
        res.status(201).json({
            success: true,
            report: newReport
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to create report'
        });
    }
});

// Delete report
router.delete('/:id', async (req, res) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'No token, authorization denied'
            });
        }
        
        const reportId = req.params.id;
        const reportIndex = mockReports.findIndex(r => r._id === reportId);
        
        if (reportIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'Report not found'
            });
        }
        
        mockReports.splice(reportIndex, 1);
        
        res.json({
            success: true,
            message: 'Report deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to delete report'
        });
    }
});

// Download report
router.get('/:id/download', async (req, res) => {
    try {
        const reportId = req.params.id;
        const report = mockReports.find(r => r._id === reportId);
        
        if (!report) {
            return res.status(404).json({ success: false, message: 'Report not found' });
        }
        
        // Generate a simple text-based report content
        const content = `
FORENSIC ANALYSIS REPORT
========================
Report ID: ${report._id}
Title: ${report.title}
Case ID: ${report.caseId}
Case Name: ${report.caseName}
Generated: ${new Date(report.generatedAt).toLocaleString()}

SUMMARY
-------
${report.summary}

FINDINGS
--------
${report.findings ? report.findings.map(f => '- ' + f).join('\n') : 'No findings recorded.'}

---
End of Report
`;

        res.setHeader('Content-Type', 'text/plain');
        res.setHeader('Content-Disposition', `attachment; filename="report-${reportId}.txt"`);
        res.send(content);
        
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to download report' });
    }
});

module.exports = router;
