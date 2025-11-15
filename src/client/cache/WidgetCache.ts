import { Cache, createCache } from '@fjell/cache';
import { createCoordinate } from '@fjell/core';
import type { Widget } from '../../model/Widget';
import { widgetApi } from '../api/WidgetAPI';
import { cacheRegistry } from './registry';
// Removed circular dependency import

// Cache configuration optimized for browser environment with IndexedDB and Two Layer Caching
const createCacheOptions = (dbName: string, storeName: string) => ({
  cacheType: 'indexedDB' as const,
  indexedDBConfig: {
    dbName,
    version: 1,
    storeName
  },
  enableDebugLogging: true, // Enable debug logging
  autoSync: true,
  maxRetries: 5,
  retryDelay: 2000,
  ttl: 900000, // 15 minutes
  evictionConfig: {
    type: 'lru' as const
  },
  // Enable Two Layer Caching for advanced query management and cache poisoning prevention
  twoLayer: {
    itemTTL: 900, // 15 minutes for items (in seconds)
    queryTTL: 300, // 5 minutes for complete query results
    facetTTL: 60,  // 1 minute for partial/filtered query results
    debug: true    // Enable two-layer debug logging
  }
});

// Widget Cache Instance
export const widgetCache: Cache<Widget, 'widget'> = createCache(
  widgetApi,
  createCoordinate('widget'),
  cacheRegistry,
  createCacheOptions('WidgetAppCache_Widgets', 'widgets')
);

// Utility functions for widget cache management
export const widgetCacheUtils = {
  /**
   * Clear widget cache
   */
  clear: async () => {
    await widgetCache.operations.reset();
  },

  /**
   * Get widget cache information for debugging
   */
  getCacheInfo: () => widgetCache.getCacheInfo(),

  /**
   * Manually invalidate widget caches when external changes occur
   */
  invalidate: () => {
    widgetCache.cacheMap.clearQueryResults();
  },

  /**
   * Get widget cache statistics for monitoring
   */
  getCacheStats: async () => {
    const sizeInfo = await widgetCache.cacheMap.getCurrentSize();
    
    // Get two-layer stats if available
    let queryCount = 0;
    let facetCount = 0;
    
    if ('getTwoLayerStats' in widgetCache.cacheMap && typeof widgetCache.cacheMap.getTwoLayerStats === 'function') {
      const twoLayerStats = widgetCache.cacheMap.getTwoLayerStats();
      queryCount = twoLayerStats.queryMetadata.complete;
      facetCount = twoLayerStats.queryMetadata.partial;
    }
    
    return {
      itemCount: sizeInfo.itemCount,
      queryCount,
      facetCount
    };
  }
};

// Export the cache registry for test access
export { cacheRegistry };

// Cross-cache utilities moved to index.ts to avoid circular dependencies
