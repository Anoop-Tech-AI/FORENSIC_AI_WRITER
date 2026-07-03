const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
    caseId: {
        type: String, // String to support IDs like 'FW-4056'
        required: false,
        default: null
    },
    participants: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }],
    type: {
        type: String,
        enum: ['direct', 'case'],
        default: 'direct'
    },
    lastMessage: {
        type: String,
        default: ''
    },
    lastMessageTime: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Index for efficient querying of a user's conversations
conversationSchema.index({ participants: 1 });
conversationSchema.index({ caseId: 1, type: 1 });

module.exports = mongoose.model('Conversation', conversationSchema);
