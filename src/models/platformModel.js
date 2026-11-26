
const mongoose = require('mongoose');

const platformSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },

  type: {
    type: String,
    enum: [
      'YouTube',
      'Udemy',
      'Coursera',
      'GitHub',
      'Blogs',
      'Book',
      'edX',
      'Other'
    ],
    required: true
  },

  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }

}, { timestamps: true });

// Prevent duplicate platform types for a user
platformSchema.index(
  { user: 1, type: 1 },
  { unique: true }
);

const Platform = mongoose.model(
  'Platform',
  platformSchema
);

module.exports = Platform;
