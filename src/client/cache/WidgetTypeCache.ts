import { Cache, createCache } from '@fjell/cache';
import { createCoordinate } from '@fjell/core';
import type { WidgetType } from '../../model/WidgetType';
import { widgetTypeApi } from '../api/WidgetAPI';
import { cacheRegistry } from './registry';

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

// WidgetType Cache Instance
export const widgetTypeCache: Cache<WidgetType, 'widgetType'> = createCache(
  widgetTypeApi,
  createCoordinate('widgetType'),
  cacheRegistry,
  createCacheOptions('WidgetAppCache_WidgetTypes', 'widgetTypes')
);

// Utility functions for widget type cache management
export const widgetTypeCacheUtils = {
  /**
   * Clear widget type cache
   */
  clear: async () => {
    await widgetTypeCache.operations.reset();
  },

  /**
   * Get widget type cache information for debugging
   */
  getCacheInfo: () => widgetTypeCache.getCacheInfo(),

  /**
   * Manually invalidate widget type caches when external changes occur
   */
  invalidate: () => {
    widgetTypeCache.cacheMap.clearQueryResults();
  },

  /**
   * Get widget type cache statistics for monitoring
   */
  getCacheStats: async () => {
    const sizeInfo = await widgetTypeCache.cacheMap.getCurrentSize();
    
    // Get two-layer stats if available
    let queryCount = 0;
    let facetCount = 0;
    
    if ('getTwoLayerStats' in widgetTypeCache.cacheMap && typeof widgetTypeCache.cacheMap.getTwoLayerStats === 'function') {
      const twoLayerStats = widgetTypeCache.cacheMap.getTwoLayerStats();
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
