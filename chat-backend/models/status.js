const mongoose = require("mongoose");

const statusSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    content: {
        url: { type: String, required: true },
        type: { type: String, enum: ['image', 'video'], required: true },
        caption: { type: String }
    },
    views: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        viewedAt: { type: Date, default: Date.now }
    }],
    expiresAt: {
        type: Date,
        required: true,
        default: () => new Date(+new Date() + 24*60*60*1000) // 24 hours from now
    }
}, { timestamps: true });

statusSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // Auto delete after expiry

module.exports = mongoose.model('Status', statusSchema);
