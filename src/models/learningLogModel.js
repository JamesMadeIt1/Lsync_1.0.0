
const mongoose = require('mongoose');

const LogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  skill: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Skill'
  },

  platform: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Platform'
  },

  track: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Track'
  },

  title: {
    type: String,
    required: true,
    trim: true
  },

  description: {
    type: String,
    trim: true
  },

  durationMinutes: {
    type: Number,
    required: true,
    min: 1
  },

  durationSeconds: {
    type: Number,
    min: 1
  },

  watchedSeconds: {
    type: Number,
    min: 0,
    default: 0
  },

  completionRate: {
    type: Number,
    min: 0,
    max: 1,
    default: 0
  },

  type: {
    type: String,
    enum: [
      'Video',
      'Reading',
      'Coding',
      'Project',
      'Practice',
      'Certificate'
    ],
    default: 'Reading'
  },

  proofUrl: {
    type: String,
    trim: true
  },

  date: {
    type: Date,
    default: Date.now
  }

}, { timestamps: true });

LogSchema.index({ user: 1, date: -1 });

const LearningLog = mongoose.model(
  'LearningLog',
  LogSchema
);

module.exports = LearningLog;
