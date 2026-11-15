
const mongoose = require('mongoose');

const githubActivitySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },

    provider: {
      type: String,
      default: 'GitHub',
      immutable: true
    },

    repository: {
      type: String,
      required: true,
      trim: true
    },


repositoryPrivate: {
  type: Boolean,
  default: true
},


    commitSha: {
      type: String,
      required: true,
      trim: true
    },

    message: {
      type: String,
      required: true,
      trim: true
    },

    author: {
      type: String,
      trim: true
    },


githubAuthorId: {
  type: String,
  default: null
},

githubAuthorLogin: {
  type: String,
  trim: true,
  default: null
},

verificationStatus: {
  type: String,
  enum: [
    'pending',
    'matched',
    'unverified'
  ],
  default: 'pending'
},

verifiedAt: {
  type: Date,
  default: null
},

    committedAt: {
      type: Date,
      required: true
    },

    commitUrl: {
      type: String,
      required: true
    },

    syncedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

// Prevent the same commit from being saved twice
// for the same user and repository.
githubActivitySchema.index(
  {
    user: 1,
    repository: 1,
    commitSha: 1
  },
  {
    unique: true
  }
);

module.exports = mongoose.model(
  'GitHubActivity',
  githubActivitySchema
);
