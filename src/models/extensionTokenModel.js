const mongoose = require('mongoose');

const extensionTokenSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },

  tokenHash: {
    type: String,
    required: true,
    unique: true,
    select: false
  }
}, { timestamps: true });

module.exports = mongoose.model(
  'ExtensionToken',
  extensionTokenSchema
);
