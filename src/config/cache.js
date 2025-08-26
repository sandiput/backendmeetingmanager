const NodeCache = require('node-cache');
const APP_CONSTANTS = require('./constants');

class CacheManager {
  constructor() {
    this.cache = new NodeCache({
      stdTTL: APP_CONSTANTS.CACHE.TTL, // Time to live in seconds
      checkperiod: APP_CONSTANTS.CACHE.TTL * 0.2, // Check for expired keys
      maxKeys: APP_CONSTANTS.CACHE.MAX_ITEMS // Maximum number of items in cache
    });

    // Setup event listeners
    this.cache.on('expired', (key, value) => {
      console.log(`Cache key expired: ${key}`);
    });

    this.cache.on('del', (key, value) => {
      console.log(`Cache key deleted: ${key}`);
    });

    this.cache.on('flush', () => {
      console.log('Cache flushed');
    });
  }

  // Set cache with custom TTL
  set(key, value, ttl = APP_CONSTANTS.CACHE.TTL) {
    try {
      return this.cache.set(key, value, ttl);
    } catch (error) {
      console.error('Error setting cache:', error);
      return false;
    }
  }

  // Get cache
  get(key) {
    try {
      return this.cache.get(key);
    } catch (error) {
      console.error('Error getting cache:', error);
      return undefined;
    }
  }

  // Delete cache
  delete(key) {
    try {
      return this.cache.del(key);
    } catch (error) {
      console.error('Error deleting cache:', error);
      return false;
    }
  }

  // Clear all cache
  clear() {
    try {
      return this.cache.flushAll();
    } catch (error) {
      console.error('Error clearing cache:', error);
      return false;
    }
  }

  // Get cache stats
  getStats() {
    try {
      return this.cache.getStats();
    } catch (error) {
      console.error('Error getting cache stats:', error);
      return {};
    }
  }

  // Check if key exists
  has(key) {
    try {
      return this.cache.has(key);
    } catch (error) {
      console.error('Error checking cache key:', error);
      return false;
    }
  }

  // Get multiple keys
  mget(keys) {
    try {
      return this.cache.mget(keys);
    } catch (error) {
      console.error('Error getting multiple cache keys:', error);
      return {};
    }
  }

  // Set multiple keys
  mset(keyValuePairs, ttl = APP_CONSTANTS.CACHE.TTL) {
    try {
      const pairs = Object.entries(keyValuePairs).map(([key, value]) => ({
        key,
        val: value,
        ttl
      }));
      return this.cache.mset(pairs);
    } catch (error) {
      console.error('Error setting multiple cache keys:', error);
      return false;
    }
  }

  // Get all keys
  keys() {
    try {
      return this.cache.keys();
    } catch (error) {
      console.error('Error getting cache keys:', error);
      return [];
    }
  }

  // Get cache size
  size() {
    try {
      const stats = this.cache.getStats();
      return stats.keys;
    } catch (error) {
      console.error('Error getting cache size:', error);
      return 0;
    }
  }

  // Get or set cache
  getOrSet(key, callback, ttl = APP_CONSTANTS.CACHE.TTL) {
    try {
      let value = this.get(key);
      if (value === undefined) {
        value = callback();
        this.set(key, value, ttl);
      }
      return value;
    } catch (error) {
      console.error('Error in getOrSet cache:', error);
      return undefined;
    }
  }

  // Get or set cache async
  async getOrSetAsync(key, callback, ttl = APP_CONSTANTS.CACHE.TTL) {
    try {
      let value = this.get(key);
      if (value === undefined) {
        value = await callback();
        this.set(key, value, ttl);
      }
      return value;
    } catch (error) {
      console.error('Error in getOrSetAsync cache:', error);
      return undefined;
    }
  }
}

// Create singleton instance
const cacheManager = new CacheManager();

module.exports = cacheManager;