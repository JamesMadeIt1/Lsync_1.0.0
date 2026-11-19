const mongoose = require('mongoose');

const watchEventSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  videoId: {
    type: String,
    ref: 'Video',
    required: true,
    match: /^[A-Za-z0-9_-]{11}$/
  },

  categoryName: {
    type: String,
    trim: true,
    default: 'Unknown'
  },

  secondsWatched: {
    type: Number,
    required: true,
    min: 1,
    max: 6 * 60 * 60
  },

  watchedAt: {
    type: Date,
    required: true
  },

  clientEventId: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },

  source: {
    type: String,
    enum: ['extension', 'iframe', 'takeout'],
    default: 'extension'
  }
}, { timestamps: true });

watchEventSchema.index(
  { user: 1, clientEventId: 1 },
  { unique: true }
);

watchEventSchema.index({ user: 1, watchedAt: -1 });
watchEventSchema.index({ user: 1, videoId: 1, watchedAt: -1 });

module.exports = mongoose.model('WatchEvent', watchEventSchema);
