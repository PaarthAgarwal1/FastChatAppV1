const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true
    },
    description: {
        type: String,
        default: ""
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
    },
    profile_picture: {
        type: String,
        default: ""
    },
    status: {
        type: String,
        enum: ['online', 'offline'],
        default: 'offline'
    },
    group_id: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Group'
    }],
    events: [
        {
            type: {
                type: String,
                required: true
            },
            date: {
                type: Date,
                required: true
            }
        }
    ],
    eventNotifications: [{
        eventId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true
        },
        type: {
            type: String,
            required: true
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        userName: {
            type: String,
            required: true
        },
        userProfilePic: String,
        createdAt: {
            type: Date,
            default: Date.now
        },
        expiresAt: {
            type: Date,
            required: true
        },
        wished: {
            type: Boolean,
            default: false
        }
    }],
    friends: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    blocked: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }]
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);