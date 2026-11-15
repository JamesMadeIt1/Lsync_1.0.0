
const mongoose = require('mongoose');

const connectedAccountSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  platform: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Platform',
    required: true
  },

  provider: {
    type: String,
    enum: ['GitHub'],
    required: true
  },

  externalAccountId: {
    type: String,
    required: true
  },

  username: {
    type: String,
    required: true,
    trim: true
  },

  profileUrl: {
    type: String
  },

  status: {
    type: String,
    enum: [
      'connected',
      'syncing',
      'error',
      'disconnected'
    ],
    default: 'connected'
  },

  lastSyncedAt: {
    type: Date,
    default: null
  },

  lastSyncError: {
    type: String,
    default: null
  },

  accessTokenEncrypted: {
  type: String,
  select: false
},

tokenExpiresAt: {
  type: Date,
  default: null
}

}, { timestamps: true });

// Prevent duplicate external account connections
connectedAccountSchema.index(
  { user: 1, provider: 1, externalAccountId: 1 },
  { unique: true }
);

module.exports = mongoose.model(
  'ConnectedAccount',
  connectedAccountSchema
);
