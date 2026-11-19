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

module.exports = {
  recordWatchEvent
};
