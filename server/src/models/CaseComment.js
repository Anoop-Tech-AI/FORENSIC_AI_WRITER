const mongoose = require('mongoose');

const caseCommentSchema = new mongoose.Schema({
    caseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Case',
        required: true
    },
    senderRole: {
        type: String,
        enum: ['admin', 'legal_adviser', 'investigator'],
        required: true
    },
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    senderName: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true,
        trim: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

caseCommentSchema.index({ caseId: 1, timestamp: -1 });

module.exports = mongoose.model('CaseComment', caseCommentSchema);
