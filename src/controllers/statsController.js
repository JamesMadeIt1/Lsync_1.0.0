const Learninglog = require('../models/learningLogModel.js');
const WatchEvent = require('../models/watchEventModel');
const Video = require('../models/videoModel');

const parseStatsDays = (value) => {
    if (value === undefined) {
        return 30;
    }

    if (typeof value !== 'string' || !/^\d+$/.test(value)) {
        return null;
    }

    const days = Number(value);
    return Number.isSafeInteger(days) && days >= 1 && days <= 365
        ? days
        : null;
};

const getStatsDateRange = (days) => {
    const to = new Date();
    const from = new Date(to.getTime() - days * 24 * 60 * 60 * 1000);
    return { from, to };
};

const invalidDaysResponse = (res) => res.status(400).json({
    success: false,
    message: 'days must be an integer between 1 and 365'
});

const getMyStats = async (req, res, next) => {
    try {
        const logs = await Learninglog.find({ user: req.user })
            .populate('platform')
            .populate('track')
            .populate('skill');

        let totalMinutes = 0;
        const byPlatform = {};
        const byType = {};

        logs.forEach((log) => {
            totalMinutes += Number(log.durationMinutes) || 0;

            const pName = log.platform && log.platform.name ? log.platform.name : 'Other';
            byPlatform[pName] = (byPlatform[pName] || 0) + (Number(log.durationMinutes) || 0);

            const type = log.type || 'Unknown';
            byType[type] = (byType[type] || 0) + 1;
        });

        res.status(200).json({
            success: true,
            data: {
                totalLogs: logs.length,
                totalHours: (totalMinutes / 60).toFixed(1),
                byPlatform,
                byType
            }
        });
    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};

const getWatchTimeByCategory = async (req, res, next) => {
    try {
        const days = parseStatsDays(req.query.days);

        if (days === null) {
            return invalidDaysResponse(res);
        }

        const { from, to } = getStatsDateRange(days);
        const data = await WatchEvent.aggregate([
            {
                $match: {
                    user: req.user,
                    watchedAt: { $gte: from, $lte: to }
                }
            },
            {
                $lookup: {
                    from: Video.collection.name,
                    localField: 'videoId',
                    foreignField: '_id',
                    as: 'video'
                }
            },
            {
                $unwind: {
                    path: '$video',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $project: {
                    videoId: 1,
                    secondsWatched: 1,
                    category: {
                        $cond: [
                            {
                                $in: [
                                    { $ifNull: ['$categoryName', 'Unknown'] },
                                    ['', 'Unknown']
                                ]
                            },
                            { $ifNull: ['$video.categoryName', 'Unknown'] },
                            '$categoryName'
                        ]
                    }
                }
            },
            {
                $group: {
                    _id: '$category',
                    totalSeconds: { $sum: '$secondsWatched' },
                    events: { $sum: 1 },
                    videos: { $addToSet: '$videoId' }
                }
            },
            {
                $project: {
                    _id: 0,
                    category: { $ifNull: ['$_id', 'Unknown'] },
                    totalSeconds: 1,
                    totalMinutes: {
                        $round: [
                            { $divide: ['$totalSeconds', 60] },
                            1
                        ]
                    },
                    events: 1,
                    uniqueVideos: { $size: '$videos' }
                }
            },
            { $sort: { totalSeconds: -1 } }
        ]);

        return res.status(200).json({
            success: true,
            data: {
                days,
                byCategory: data
            }
        });
    } catch (error) {
        return next(error);
    }
};

const getWatchTimeByVideo = async (req, res, next) => {
    try {
        const days = parseStatsDays(req.query.days);

        if (days === null) {
            return invalidDaysResponse(res);
        }

        const { from, to } = getStatsDateRange(days);
        const data = await WatchEvent.aggregate([
            {
                $match: {
                    user: req.user,
                    watchedAt: { $gte: from, $lte: to }
                }
            },
            {
                $group: {
                    _id: '$videoId',
                    totalSeconds: { $sum: '$secondsWatched' },
                    events: { $sum: 1 }
                }
            },
            {
                $lookup: {
                    from: Video.collection.name,
                    localField: '_id',
                    foreignField: '_id',
                    as: 'video'
                }
            },
            {
                $unwind: {
                    path: '$video',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $project: {
                    _id: 0,
                    videoId: '$_id',
                    title: {
                        $ifNull: ['$video.title', 'Unknown video']
                    },
                    category: {
                        $ifNull: ['$video.categoryName', 'Unknown']
                    },
                    watchedSeconds: '$totalSeconds',
                    watchedMinutes: {
                        $round: [
                            { $divide: ['$totalSeconds', 60] },
                            1
                        ]
                    },
                    events: 1,
                    completionRate: {
                        $cond: [
                            {
                                $gt: [
                                    { $ifNull: ['$video.durationSeconds', 0] },
                                    0
                                ]
                            },
                            {
                                $min: [
                                    1,
                                    {
                                        $divide: [
                                            '$totalSeconds',
                                            '$video.durationSeconds'
                                        ]
                                    }
                                ]
                            },
                            null
                        ]
                    }
                }
            },
            { $sort: { watchedSeconds: -1 } }
        ]);

        return res.status(200).json({
            success: true,
            data: {
                days,
                byVideo: data
            }
        });
    } catch (error) {
        return next(error);
    }
};

module.exports = {
    getMyStats,
    getWatchTimeByCategory,
    getWatchTimeByVideo
};
