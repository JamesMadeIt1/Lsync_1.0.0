const API_BASE_URL = 'https://www.googleapis.com/youtube/v3';

let categoryNamesPromise;

const getApiKey = () => {
  const apiKey = process.env.YOUTUBE_API_KEY;

  if (!apiKey) {
    throw new Error('YOUTUBE_API_KEY is not configured');
  }

  return apiKey;
};

const fetchYouTubeResource = async (resource, parameters, apiKey) => {
  const url = new URL(`${API_BASE_URL}/${resource}`);
  url.search = new URLSearchParams({
    ...parameters,
    key: apiKey
  }).toString();

  const response = await fetch(url, {
    signal: AbortSignal.timeout(10000)
  });

  if (!response.ok) {
    throw new Error(
      `YouTube ${resource} request failed with status ${response.status}`
    );
  }

  return response.json();
};

const getCategoryNames = async (apiKey) => {
  if (!categoryNamesPromise) {
    categoryNamesPromise = fetchYouTubeResource(
      'videoCategories',
      {
        part: 'snippet',
        regionCode: process.env.YOUTUBE_REGION_CODE || 'US'
      },
      apiKey
    )
      .then(({ items = [] }) => new Map(
        items.map((item) => [item.id, item.snippet.title])
      ))
      .catch((error) => {
        categoryNamesPromise = null;
        throw error;
      });
  }

  return categoryNamesPromise;
};

const parseDurationSeconds = (duration) => {
  const match = /^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/.exec(duration || '');

  if (!match) {
    return null;
  }

  const [, hours, minutes, seconds] = match;

  if (!hours && !minutes && !seconds) {
    return null;
  }

  return Number(hours || 0) * 3600 +
    Number(minutes || 0) * 60 +
    Number(seconds || 0);
};

const fetchVideoMetadata = async (videoId) => {
  const apiKey = getApiKey();
  const { items = [] } = await fetchYouTubeResource(
    'videos',
    {
      part: 'snippet,contentDetails',
      id: videoId
    },
    apiKey
  );
  const item = items[0];

  if (!item) {
    return null;
  }

  const categoryId = item.snippet.categoryId || null;
  const categories = categoryId
    ? await getCategoryNames(apiKey)
    : new Map();

  return {
    title: item.snippet.title,
    channelTitle: item.snippet.channelTitle || null,
    categoryId,
    categoryName: categories.get(categoryId) || 'Unknown',
    durationSeconds: parseDurationSeconds(item.contentDetails.duration),
    tags: item.snippet.tags || []
  };
};

module.exports = {
  fetchVideoMetadata,
  parseDurationSeconds
};
