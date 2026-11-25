const Video = require('../models/videoModel');
const WatchEvent = require('../models/watchEventModel');
const { fetchVideoMetadata } = require('../services/youtubeMetadataService');

const ensureVideoExists = async (videoId) => {
  const existingVideo = await Video.findById(videoId);

  if (existingVideo) {
    return existingVideo;
  }

  try {
    return await Video.create({ _id: videoId });
  } catch (error) {
    if (error.code !== 11000) {
      throw error;
    }

    const videoCreatedByAnotherRequest = await Video.findById(videoId);

    if (!videoCreatedByAnotherRequest) {
      throw error;
    }

    return videoCreatedByAnotherRequest;
  }
};

const recordWatchEvent = async (req, res, next) => {
  try {
    const {
      clientEventId,
      videoId,
      secondsWatched,
      watchedAt
    } = req.body;

    const duplicateEvent = await WatchEvent.exists({
      user: req.user,
      clientEventId
    });

    if (duplicateEvent) {
      return res.status(200).json({
        success: true,
        data: { status: 'duplicate' }
      });
    }

    const video = await ensureVideoExists(videoId);
    let metadataStatus = 'pending';

    if (video.metadataFetchedAt) {
      metadataStatus = video.metadataStatus === 'not_found'
        ? 'not_found'
        : 'cached';
    } else {
      try {
        const metadata = await fetchVideoMetadata(videoId);

        if (metadata) {
          const enrichedVideo = await Video.findByIdAndUpdate(
            videoId,
            {
              $set: {
                ...metadata,
                metadataFetchedAt: new Date(),
                metadataStatus: 'available'
              }
            },
            {
              new: true,
              runValidators: true
            }
          );

          if (!enrichedVideo) {
            throw new Error('Video cache entry disappeared during enrichment');
          }

          metadataStatus = 'available';
        } else {
          await Video.findByIdAndUpdate(
            videoId,
            {
              $set: {
                metadataFetchedAt: new Date(),
                metadataStatus: 'not_found'
              }
            },
            {
              new: true,
              runValidators: true
            }
          );
          metadataStatus = 'not_found';
        }
      } catch (error) {
        console.error(
          `YouTube metadata enrichment failed for ${videoId}:`,
          error.message
        );
        metadataStatus = 'pending';
      }
    }

    const currentVideo = await Video.findById(videoId);

    let event;
    try {
      event = await WatchEvent.create({
        user: req.user,
        videoId,
        categoryName: currentVideo?.categoryName || 'Unknown',
        secondsWatched,
        watchedAt,
        clientEventId,
        source: 'extension'
      });
    } catch (error) {
      if (error.code === 11000) {
        return res.status(200).json({
          success: true,
          data: { status: 'duplicate' }
        });
      }

      throw error;
    }

    return res.status(201).json({
      success: true,
      data: {
        status: 'recorded',
        eventId: event._id,
        videoId: event.videoId,
        secondsWatched: event.secondsWatched,
        watchedAt: event.watchedAt,
        metadataStatus
      }
    });
  } catch (error) {
    return next(error);
  }
};

const listMyWatchEvents = async (req, res, next) => {
  try {
    const pageValue = req.query.page === undefined ? '1' : req.query.page;
    const limitValue = req.query.limit === undefined ? '20' : req.query.limit;
    const page = Number(pageValue);
    const limit = Number(limitValue);
    const skip = (page - 1) * limit;

    if (
      typeof pageValue !== 'string' ||
      !/^[1-9]\d*$/.test(pageValue) ||
      !Number.isSafeInteger(page) ||
      typeof limitValue !== 'string' ||
      !/^[1-9]\d*$/.test(limitValue) ||
      !Number.isSafeInteger(limit) ||
      limit > 100 ||
      !Number.isSafeInteger(skip)
    ) {
      return res.status(400).json({
        success: false,
        message: 'page must be a positive integer and limit must be between 1 and 100'
      });
    }

    const filter = {
      user: req.user,
      source: 'extension'
    };
    const [events, total] = await Promise.all([
      WatchEvent.find(filter)
        .select('videoId categoryName secondsWatched watchedAt source createdAt')
        .populate({
          path: 'videoId',
          select: 'title channelTitle categoryName durationSeconds'
        })
        .sort({ watchedAt: -1, _id: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      WatchEvent.countDocuments(filter)
    ]);

    const data = events.map((event) => {
      const video = event.videoId && typeof event.videoId === 'object'
        ? event.videoId
        : null;

      return {
        ...event,
        videoId: video ? video._id : event.videoId,
        video
      };
    });

    const totalPages = Math.ceil(total / limit);

    return res.status(200).json({
      success: true,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasMore: page < totalPages
      },
      count: data.length,
      data
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  recordWatchEvent,
  listMyWatchEvents
};
