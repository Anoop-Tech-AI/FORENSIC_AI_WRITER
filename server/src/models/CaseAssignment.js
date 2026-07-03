const mongoose = require('mongoose');

const caseAssignmentSchema = new mongoose.Schema({
    caseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Case',
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    role: {
        type: String,
        enum: ['legal_advisor', 'forensic_investigator'],
        required: true
    },
    action: {
        type: String,
        enum: ['accepted', 'declined'],
        required: true
    },
    reason: {
        type: String,
        default: null
    },
    respondedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Index for efficient queries
caseAssignmentSchema.index({ caseId: 1, userId: 1, status: 1 });

module.exports = mongoose.model('CaseAssignment', caseAssignmentSchema);
