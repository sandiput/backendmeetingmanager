const cache = require('../config/cache');
const APP_CONSTANTS = require('../config/constants');

// Cache middleware factory
const createCacheMiddleware = (options = {}) => {
  const {
    key = (req) => req.originalUrl,
    duration = APP_CONSTANTS.CACHE.DEFAULT_DURATION,
    condition = () => true
  } = options;

  return async (req, res, next) => {
    // Skip cache based on condition
    if (!condition(req)) {
      return next();
    }

    // Generate cache key
    const cacheKey = typeof key === 'function' ? key(req) : key;

    try {
      // Check cache
      const cachedData = await cache.get(cacheKey);

      if (cachedData) {
        // Return cached data
        return res.json(cachedData);
      }

      // Override res.json to cache the response
      const originalJson = res.json;
      res.json = function(data) {
        // Cache the response data
        cache.set(cacheKey, data, duration);

        // Call the original json method
        return originalJson.call(this, data);
      };

      next();
    } catch (error) {
      // If cache fails, continue without caching
      next();
    }
  };
};

// Predefined cache middleware instances
const cacheMiddleware = {
  // Cache for dashboard statistics
  dashboard: createCacheMiddleware({
    key: 'dashboard_stats',
    duration: APP_CONSTANTS.CACHE.DASHBOARD_DURATION,
    condition: (req) => req.method === 'GET'
  }),

  // Cache for review statistics
  review: createCacheMiddleware({
    key: 'review_stats',
    duration: APP_CONSTANTS.CACHE.REVIEW_DURATION,
    condition: (req) => req.method === 'GET'
  }),

  // Cache for participant list
  participants: createCacheMiddleware({
    key: (req) => `participants_${req.query.page || 1}_${req.query.limit || APP_CONSTANTS.PAGINATION.DEFAULT_LIMIT}`,
    duration: APP_CONSTANTS.CACHE.LIST_DURATION,
    condition: (req) => req.method === 'GET'
  }),

  // Cache for meeting list
  meetings: createCacheMiddleware({
    key: (req) => `meetings_${req.query.page || 1}_${req.query.limit || APP_CONSTANTS.PAGINATION.DEFAULT_LIMIT}_${req.query.status || 'all'}`,
    duration: APP_CONSTANTS.CACHE.LIST_DURATION,
    condition: (req) => req.method === 'GET'
  }),

  // Cache for settings
  settings: createCacheMiddleware({
    key: 'settings',
    duration: APP_CONSTANTS.CACHE.SETTINGS_DURATION,
    condition: (req) => req.method === 'GET'
  })
};

// Cache clear middleware
const clearCache = (patterns) => {
  return async (req, res, next) => {
    // Store the original json method
    const originalJson = res.json;

    // Override the json method
    res.json = function(data) {
      try {
        // Clear cache based on patterns
        if (Array.isArray(patterns)) {
          patterns.forEach(pattern => cache.del(pattern));
        } else if (typeof patterns === 'string') {
          cache.del(patterns);
        }
      } catch (error) {
        console.error('Cache clear error:', error);
      }

      // Call the original json method
      return originalJson.call(this, data);
    };

    next();
  };
};

// Predefined cache clear middleware instances
const clearCacheMiddleware = {
  // Clear dashboard cache
  dashboard: clearCache('dashboard_stats'),

  // Clear review cache
  review: clearCache('review_stats'),

  // Clear participants cache
  participants: clearCache((req) => `participants_*`),

  // Clear meetings cache
  meetings: clearCache((req) => `meetings_*`),

  // Clear settings cache
  settings: clearCache('settings'),

  // Clear all cache
  all: clearCache('*')
};

module.exports = {
  createCacheMiddleware,
  cacheMiddleware,
  clearCache,
  clearCacheMiddleware
};