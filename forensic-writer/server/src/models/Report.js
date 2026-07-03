const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
    caseId: {
        type: String,
        required: true,
    },
    caseName: {
        type: String,
        required: true,
    },
    summary: {
        type: String,
        required: false,
    },
    introduction: { type: String },
    evidence_summary: { type: Object },
    timeline: { type: [Object] },
    observations: { type: [Object] },
    conclusions: { type: Object },
    anomalies: {
        type: Number,
        default: 0,
    },
    confidence: {
        type: Number,
        default: 98.4,
    },
    status: {
        type: String,
        default: 'Verified',
    },
    reportId: {
        type: String,
        required: true,
        unique: true,
    },
    reportName: {
        type: String,
        required: true,
    },
    reportPath: {
        type: String,
        required: true,
    },
    reportUrl: {
        type: String,
        required: true,
    },
    fileSize: {
        type: Number,
        default: 0,
    },
    riskLevel: {
        type: String,
        enum: ['LOW', 'MEDIUM', 'HIGH'],
        default: 'LOW',
    },
    generatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    caseRef: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Case',
        required: true,
    },
    date: {
        type: Date,
        default: Date.now,
    },
    files: [{
        fileName: String,
        fileType: String,
        fileSize: Number,
        hash: String,
        confidence: Number,
        anomalies: Number
    }]
}, {
    timestamps: true,
});

// Index for faster queries
reportSchema.index({ caseId: 1, createdAt: -1 });
reportSchema.index({ generatedBy: 1, createdAt: -1 });

const Report = mongoose.model('Report', reportSchema);

module.exports = Report;
