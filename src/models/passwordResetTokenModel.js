const mongoose = require('mongoose');

const passwordResetTokenSchema = new mongoose.Schema({
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
  },
  expiresAt: {
    type: Date,
    required: true,
    expires: 0
  }
}, { timestamps: true });

module.exports = mongoose.model(
  'PasswordResetToken',
  passwordResetTokenSchema
);
