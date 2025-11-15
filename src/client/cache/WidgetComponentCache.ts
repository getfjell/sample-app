import { Cache, createCache } from '@fjell/cache';
import { createCoordinate } from '@fjell/core';
import type { WidgetComponent } from '../../model/WidgetComponent';
import { widgetComponentApi } from '../api/WidgetAPI';
import { cacheRegistry } from './registry';

// Cache configuration for WidgetComponent with IndexedDB and Two Layer Caching
// This demonstrates composite entity relationships with widget as parent
const createCacheOptions = (dbName: string, storeName: string) => ({
  cacheType: 'indexedDB' as const,
  indexedDBConfig: {
    dbName,
    version: 1,
    storeName
  },
  enableDebugLogging: true,
  autoSync: true,
  maxRetries: 5,
  retryDelay: 2000,
  ttl: 900000, // 15 minutes
  evictionConfig: {
    type: 'lru' as const
  },
  // Two Layer Caching configuration optimized for component data
  twoLayer: {
    itemTTL: 900, // 15 minutes for items (in seconds)
    queryTTL: 300, // 5 minutes for complete query results
    facetTTL: 60,  // 1 minute for filtered results (by status, type, etc.)
    debug: true    // Enable two-layer debug logging for certification testing
  }
});

// WidgetComponent Cache Instance
// Note: Uses composite coordinate ['widgetComponent', 'widget'] to establish hierarchy
export const widgetComponentCache: Cache<WidgetComponent, 'widgetComponent', 'widget'> = createCache(
  widgetComponentApi,
  createCoordinate(['widgetComponent', 'widget']),
  cacheRegistry,
  createCacheOptions('FjellTestCache_Components', 'widget_components')
);

// Utility functions for widget component cache management
export const widgetComponentCacheUtils = {
  /**
   * Clear widget component cache
   */
  clear: async () => {
    await widgetComponentCache.operations.reset();
  },

  /**
   * Get cache information for debugging
   */
  getCacheInfo: () => widgetComponentCache.getCacheInfo(),

  /**
   * Manually invalidate component caches when external changes occur
   */
  invalidate: () => {
    widgetComponentCache.cacheMap.clearQueryResults();
  },

  /**
   * Get cache statistics for monitoring and certification
   */
  getCacheStats: async () => {
    const sizeInfo = await widgetComponentCache.cacheMap.getCurrentSize();
    
    // Get two-layer stats if available
    let queryCount = 0;
    let facetCount = 0;
    
    if ('getTwoLayerStats' in widgetComponentCache.cacheMap && typeof widgetComponentCache.cacheMap.getTwoLayerStats === 'function') {
      const twoLayerStats = widgetComponentCache.cacheMap.getTwoLayerStats();
      queryCount = twoLayerStats.queryMetadata.complete;
      facetCount = twoLayerStats.queryMetadata.partial;
    }
    
    return {
      itemCount: sizeInfo.itemCount,
      queryCount,
      facetCount
    };
  },

  /**
   * Get components by widget ID (for testing location-based queries)
   */
  getByWidget: async (widgetId: string) => {
    return await widgetComponentCache.operations.query({
      location: [{ kt: 'widget', lk: widgetId }],
      params: {
        finder: 'byWidget',
        finderParams: { widgetId }
      }
    });
  },

  /**
   * Get components by status (for testing facet queries)
   */
  getByStatus: async (status: 'pending' | 'active' | 'complete') => {
    return await widgetComponentCache.operations.query({
      params: {
        finder: 'byStatus',
        finderParams: { status }
      }
    });
  }
};

// Export the cache registry for test access
export { cacheRegistry };

