const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

/**
 * PDF Report Generation Service
 * Generates professional forensic analysis reports
 */

class PDFReportService {
    constructor() {
        this.reportsDir = path.join(__dirname, '../../uploads/reports');
        this.ensureReportsDir();
    }

    ensureReportsDir() {
        if (!fs.existsSync(this.reportsDir)) {
            fs.mkdirSync(this.reportsDir, { recursive: true });
        }
    }

    /**
     * Generate forensic analysis PDF report
     */
    async generateReport(analysisResult, caseInfo) {
        return new Promise((resolve, reject) => {
            try {
                const doc = new PDFDocument({
                    margin: 50,
                    size: 'A4'
                });

                const reportFileName = `forensic-report-${caseInfo.caseId || 'unknown'}-${Date.now()}.pdf`;
                const reportPath = path.join(this.reportsDir, reportFileName);
                const stream = fs.createWriteStream(reportPath);

                doc.pipe(stream);

                // Add fonts
                doc.font('Helvetica');

                let y = 50;

                // If LLM report exists, use it directly without old template
                if (analysisResult.llmReport) {
                    // Header
                    this.addHeader(doc, y);
                    y += 60;
                    
                    // AI GENERATED REPORT section
                    this.addSection(doc, y, 'AI GENERATED REPORT');
                    y += 20;
                    y = this.addAnalysis(doc, y, analysisResult);
                    y += 30;
                } else {
                    // Use old template for fallback
                    // Header
                    this.addHeader(doc, y);
                    y += 60;

                    // Case Details
                    y = this.addCaseDetails(doc, y, caseInfo, analysisResult);
                    y += 30;

                    // OBJECTIVE section
                    this.addSection(doc, y, 'OBJECTIVE');
                    y += 20;
                    y = this.addObjective(doc, y);
                    y += 30;

                    // EVIDENCE SUMMARY section
                    this.addSection(doc, y, 'EVIDENCE SUMMARY');
                    y += 20;
                    y = this.addEvidenceSummary(doc, y, analysisResult);
                    y += 30;

                    // ANALYSIS section
                    this.addSection(doc, y, 'ANALYSIS');
                    y += 20;
                    y = this.addAnalysis(doc, y, analysisResult);
                    y += 30;
                }

                doc.end();

                stream.on('finish', () => {
                    resolve({
                        success: true,
                        reportPath: reportPath,
                        reportFileName: reportFileName,
                        reportUrl: `/reports/${reportFileName}`
                    });
                });

                stream.on('error', (error) => {
                    reject(error);
                });
            } catch (error) {
                reject(error);
            }
        });
    }

    addHeader(doc, y) {
        doc.fontSize(24).fillColor('#1a1a2e').text('Forensic Investigation Report', 50, y, { align: 'center' });
        
        // Add decorative line
        doc.moveTo(50, y + 35)
           .lineTo(545, y + 35)
           .lineWidth(2)
           .strokeColor('#4a90e2')
           .stroke();
    }

    addSection(doc, y, title) {
        doc.fontSize(14)
           .fillColor('#4a90e2')
           .text(title, 50, y);
        
        doc.moveTo(50, y + 5)
           .lineTo(545, y + 5)
           .lineWidth(1)
           .strokeColor('#e0e0e0')
           .stroke();
    }

    addCaseDetails(doc, y, caseInfo, analysisResult) {
        const info = [
            { label: 'Case:', value: caseInfo.caseName || caseInfo.caseId || 'N/A' },
            { label: 'Case ID:', value: caseInfo.caseId || 'N/A' },
            { label: 'Date:', value: new Date().toLocaleDateString() },
            { label: 'Investigator:', value: 'AI Investigator' }
        ];

        doc.fontSize(12).fillColor('#333333');
        
        info.forEach((item, index) => {
            const yPos = y + (index * 25);
            doc.fontSize(11).fillColor('#666666').text(item.label, 50, yPos);
            doc.fontSize(11).fillColor('#333333').text(item.value, 120, yPos);
        });

        return y + (info.length * 25);
    }

    addObjective(doc, y) {
        const text = 'The main aim of this system is to analyze large volumes of raw data such as call logs, records, files, and documents, which cannot be efficiently processed by humans within a limited time. The AI system performs this analysis and generates a structured report highlighting patterns and anomalies.';

        doc.fontSize(11)
           .fillColor('#333333')
           .text(text, 50, y, { width: 495, align: 'justify' });

        return y + 40;
    }

    addEvidenceSummary(doc, y, analysisResult) {
        const text = `The neural engine analyzed ${analysisResult.files.length} evidence artifacts using SHA-256 hash verification and pattern recognition protocols.`;

        doc.fontSize(11)
           .fillColor('#333333')
           .text(text, 50, y, { width: 495, align: 'justify' });

        return y + 30;
    }

    addAnalysis(doc, y, analysisResult) {
        let analysisText = '';
        
        // Use LLM report if available
        if (analysisResult.llmReport) {
            console.log('[PDF] LLM report length:', analysisResult.llmReport.length);
            console.log('[PDF] LLM report preview:', analysisResult.llmReport.substring(0, 200));
            // Strip HTML tags from LLM report for PDF rendering
            analysisText = this.stripHTMLTags(analysisResult.llmReport);
            console.log('[PDF] Stripped text length:', analysisText.length);
            console.log('[PDF] Stripped text preview:', analysisText.substring(0, 500));
            console.log('[PDF] Full stripped text:', analysisText);
        } else if (analysisResult.files.length > 0) {
            analysisText += `Evidence Files Analyzed:\n\n`;
            analysisResult.files.forEach((file, index) => {
                analysisText += `${index + 1}. ${file.fileName}\n`;
                analysisText += `   File Type: ${file.fileType}\n`;
                analysisText += `   SHA-256 Hash: ${file.hash}\n`;
                analysisText += `   File Size: ${this.formatBytes(file.fileSize)}\n`;
                if (file.anomalies && file.anomalies.length > 0) {
                    analysisText += `   Anomalies Detected: ${file.anomalies.length}\n`;
                    file.anomalies.forEach((anomaly, aidx) => {
                        analysisText += `      - [${anomaly.severity}] ${anomaly.type}: ${anomaly.description}\n`;
                    });
                }
                analysisText += `   Analysis Confidence: ${file.confidence.toFixed(1)}%\n\n`;
            });
        }

        if (analysisResult.totalAnomalies && analysisResult.totalAnomalies.length > 0) {
            analysisText += `\nOverall Anomalies Detected:\n\n`;
            analysisResult.totalAnomalies.forEach((anomaly, index) => {
                analysisText += `${index + 1}. [${anomaly.severity}] ${anomaly.type}\n`;
                analysisText += `   Description: ${anomaly.description}\n\n`;
            });
        }

        if (!analysisText) {
            analysisText = 'No analysis data available.';
        }

        doc.fontSize(11)
           .fillColor('#333333')
           .text(analysisText, 50, y, { width: 495, align: 'justify' });

        return y + Math.max(200, analysisText.length / 3);
    }

    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    stripHTMLTags(html) {
        // Remove style tags and their content
        let text = html.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
        
        // Remove script tags and their content
        text = text.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
        
        // Remove HTML head section
        text = text.replace(/<head[^>]*>[\s\S]*?<\/head>/gi, '');
        
        // Remove HTML comments
        text = text.replace(/<!--[\s\S]*?-->/g, '');
        
        // Replace block-level elements with newlines
        text = text.replace(/<\/(div|p|h[1-6]|li|tr|td|th|ul|ol|section|article|header|footer)>/gi, '\n');
        
        // Replace inline elements with space
        text = text.replace(/<\/(span|strong|em|b|i|a|small|sub|sup)>/gi, ' ');
        
        // Remove all remaining HTML tags
        text = text.replace(/<[^>]*>/g, '');
        
        // Replace HTML entities
        text = text.replace(/&nbsp;/g, ' ');
        text = text.replace(/&amp;/g, '&');
        text = text.replace(/&lt;/g, '<');
        text = text.replace(/&gt;/g, '>');
        text = text.replace(/&quot;/g, '"');
        text = text.replace(/&#39;/g, "'");
        
        // Remove multiple consecutive newlines and whitespace
        text = text.replace(/\n\s*\n\s*\n/g, '\n\n');
        text = text.replace(/[ \t]+/g, ' ');
        
        // Clean up extra whitespace
        return text.split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0)
            .join('\n');
    }
}

module.exports = new PDFReportService();
