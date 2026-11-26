const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    username: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: true
    },
    tokenVersion: {
        type: Number,
        default: 0,
        select: false
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
    bio: {
        type: String,
        default: " "
    },
    headline: {
        type: String,
        trim: true,
        maxlength: 120,
        default: ""
    },
    interests: {
        type: [String],
        default: [],
        validate: {
            validator: (value) => value.length <= 12,
            message: 'Interests can contain at most 12 items'
        }
    },
    location: String,
    avatar: String,
    currentRole: {
        type: String,
        default: " "
    },
    targetRole: {
        type: String,
        default: " "
    },
    track: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Track'
    },
    isPublic: {
        type: Boolean,
        default: true
    },
    showStats: {
        type: Boolean,
        default: true
    },
    showPlatforms: {
        type: Boolean,
        default: true
    },
    linkedAccounts: [{
        platform: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Platform'
        },
        platformUsername: String,
        profileUrl: String,
        verified: {
            type: Boolean,
            default: false
        },
    }]
  },  { timestamps: true });

    const User = mongoose.model('User', UserSchema);

    module.exports = User;