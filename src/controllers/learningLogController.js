
const mongoose = require('mongoose');
const LearningLog = require('../models/learningLogModel');

// CREATE LEARNING LOG
const createLog = async (req, res, next) => {
  try {
    const {
      title,
      description,
      durationMinutes,
      durationSeconds,
      type,
      proofUrl,
      date,
      skill,
      platform,
      track
    } = req.body;

    const log = await LearningLog.create({
      user: req.user,
      title,
      description,
      durationMinutes,
      durationSeconds: durationSeconds === undefined
        ? Math.round(Number(durationMinutes) * 60)
        : durationSeconds,
      type,
      proofUrl,
      date,
      skill,
      platform,
      track
    });

    const populatedLog = await log.populate([
      'skill',
      'platform',
      'track'
    ]);

    return res.status(201).json({
      success: true,
      message: 'Learning activity created successfully',
      data: populatedLog
    });

  } catch (error) {
    next(error);
  }
};

// GET AUTHENTICATED USER'S LOGS
const getMyLogs = async (req, res, next) => {
  try {
    const logs = await LearningLog.find({
      user: req.user
    })
      .populate(['skill', 'platform', 'track'])
      .sort({ date: -1 });

    return res.status(200).json({
      success: true,
      count: logs.length,
      data: logs
    });

  } catch (error) {
    next(error);
  }
};

const updateLogProgress = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid learning activity ID'
      });
    }

    const log = await LearningLog.findOne({
      _id: id,
      user: req.user
    });

    if (!log) {
      return res.status(404).json({
        success: false,
        message: 'Learning activity not found'
      });
    }

    const durationSeconds = log.durationSeconds ||
      Math.round(Number(log.durationMinutes) * 60);

    if (!Number.isFinite(durationSeconds) || durationSeconds < 1) {
      return res.status(400).json({
        success: false,
        message: 'Learning activity has an invalid duration'
      });
    }

    const previousWatchedSeconds = Math.min(
      log.watchedSeconds || 0,
      durationSeconds
    );
    const reportedWatchedSeconds = Math.min(
      req.body.watchedSeconds,
      durationSeconds
    );

    log.durationSeconds = durationSeconds;
    log.watchedSeconds = Math.max(
      previousWatchedSeconds,
      reportedWatchedSeconds
    );
    log.completionRate = log.watchedSeconds / durationSeconds;

    await log.save();
    await log.populate(['skill', 'platform', 'track']);

    return res.status(200).json({
      success: true,
      message: 'Learning progress updated successfully',
      data: log
    });
  } catch (error) {
    return next(error);
  }
};

// DELETE OWN LEARNING LOG
const deleteLog = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid learning activity ID'
      });
    }

    const log = await LearningLog.findOneAndDelete({
      _id: id,
      user: req.user
    });

    if (!log) {
      return res.status(404).json({
        success: false,
        message: 'Learning activity not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Learning activity deleted successfully'
    });

  } catch (error) {
    next(error);
  }
};

module.exports = {
  createLog,
  getMyLogs,
  updateLogProgress,
  deleteLog
};
