const mongoose = require('mongoose');

const evidenceSchema = new mongoose.Schema({
    case: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Case',
        required: true,
    },
    fileName: {
        type: String,
        required: true,
    },
    fileType: {
        type: String,
        required: true,
    },
    fileUrl: {
        type: String,
        required: true,
    },
    fileSize: {
        type: Number,
    },
    fileHash: {
        type: String, // For data integrity (SHA-256)
    },
    uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    }
}, {
    timestamps: true,
});

const Evidence = mongoose.model('Evidence', evidenceSchema);

module.exports = Evidence;
