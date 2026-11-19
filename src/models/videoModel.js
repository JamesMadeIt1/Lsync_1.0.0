const mongoose = require('mongoose');

const videoSchema = new mongoose.Schema({
  _id: {
    type: String,
    required: true,
    match: /^[A-Za-z0-9_-]{11}$/
  },

  platform: {
    type: String,
    enum: ['Youtube'],
    default: 'Youtube',
    immutable: true
  },

  title: {
    type: String,
    trim: true,
    default: 'Unknown video'
  },

  channelTitle: {
    type: String,
    trim: true,
    default: null
  },

  categoryId: {
    type: String,
    default: null
  },

  categoryName: {
    type: String,
    trim: true,
    default: 'Unknown'
  },

  durationSeconds: {
    type: Number,
    min: 0,
    default: null
  },

  tags: {
    type: [String],
    default: []
  },

  metadataFetchedAt: {
    type: Date,
    default: null
  },

  metadataStatus: {
    type: String,
    enum: ['pending', 'available', 'not_found'],
    default: 'pending'
  }
}, { timestamps: true });

module.exports = mongoose.model('Video', videoSchema);
