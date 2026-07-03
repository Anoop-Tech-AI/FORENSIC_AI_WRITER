const mongoose = require('mongoose');

const caseSchema = new mongoose.Schema({
    caseName: {
        type: String,
        required: true,
    },
    caseId: {
        type: String,
        required: true,
        unique: true,
    },
    investigatorName: {
        type: String,
        required: true,
    },
    date: {
        type: Date,
        default: Date.now,
    },
    notes: {
        type: String,
    },
    status: {
        type: String,
        enum: ['pending', 'analyzing', 'completed', 'approved', 'rejected'],
        default: 'pending',
    },
    remarks: {
        type: String,
        default: '',
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    evidence: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Evidence',
    }]
}, {
    timestamps: true,
});

const Case = mongoose.model('Case', caseSchema);

module.exports = Case;
