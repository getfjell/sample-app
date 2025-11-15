"use client";

import React, { useEffect, useState } from 'react';
import { getCacheUtils } from '../../client/cache/ClientCache';

interface CacheInfo {
  dbName?: string;
  storeName?: string;
  itemCount?: number;
  queryCount?: number;
  facetCount?: number;
  totalSize?: number;
}

interface CacheStats {
  itemCount: number;
  queryCount: number;
  facetCount: number;
}

interface AllCacheInfo {
  widget: CacheInfo;
  widgetType: CacheInfo;
  widgetComponent: CacheInfo;
}

interface AllCacheStats {
  widget: CacheStats;
  widgetType: CacheStats;
  widgetComponent: CacheStats;
}

export default function CacheDebugPage() {
  const [cacheInfo, setCacheInfo] = useState<AllCacheInfo | null>(null);
  const [cacheStats, setCacheStats] = useState<AllCacheStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const loadCacheData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const utils = await getCacheUtils();
      const info = utils.getCacheInfo();
      const stats = await utils.getCacheStats();
      
      setCacheInfo(info);
      setCacheStats(stats);
      setLastRefresh(new Date());
    } catch (err) {
      console.error('Failed to load cache data:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCacheData();
    
    // Auto-refresh every 5 seconds
    const interval = setInterval(loadCacheData, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleClearCache = async (cacheName: 'widget' | 'widgetType' | 'widgetComponent' | 'all') => {
    try {
      const utils = await getCacheUtils();
      
      if (cacheName === 'all') {
        await utils.clearAll();
      } else {
        await utils[cacheName].clear();
      }
      
      await loadCacheData();
      alert(`${cacheName} cache cleared successfully`);
    } catch (err) {
      console.error(`Failed to clear ${cacheName} cache:`, err);
      alert(`Failed to clear ${cacheName} cache: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handleInvalidateCache = async (cacheName: 'widget' | 'widgetType' | 'widgetComponent' | 'all') => {
    try {
      const utils = await getCacheUtils();
      
      if (cacheName === 'all') {
        utils.invalidateAll();
      } else {
        utils[cacheName].invalidate();
      }
      
      await loadCacheData();
      alert(`${cacheName} cache invalidated successfully`);
    } catch (err) {
      console.error(`Failed to invalidate ${cacheName} cache:`, err);
      alert(`Failed to invalidate ${cacheName} cache: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  if (loading && !cacheInfo) {
    return (
      <div className="max-w-7xl mx-auto px-8 py-8">
        <h1 className="text-3xl font-bold mb-8">Cache Diagnostic Dashboard</h1>
          <div className="bg-white rounded-lg shadow p-6">
            <p>Loading cache data...</p>
          </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-8 py-8">
        <h1 className="text-3xl font-bold mb-8">Cache Diagnostic Dashboard</h1>
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-red-800 mb-2">Error</h2>
            <p className="text-red-600">{error}</p>
            <button
              onClick={loadCacheData}
              className="mt-4 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
            >
              Retry
            </button>
          </div>
      </div>
    );
  }

  const CacheCard = ({
    title,
    info,
    stats,
    cacheName
  }: {
    title: string;
    info: CacheInfo;
    stats: CacheStats;
    cacheName: 'widget' | 'widgetType' | 'widgetComponent';
  }) => (
    <div className="summary-card">
      <h2 className="text-xl font-semibold mb-4">{title}</h2>
      
      <div className="space-y-3 mb-4">
        <div className="flex justify-between">
          <span className="text-gray-600">Database:</span>
          <span className="font-mono text-sm">{info.dbName || 'N/A'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Store:</span>
          <span className="font-mono text-sm">{info.storeName || 'N/A'}</span>
        </div>
        <div className="h-px bg-gray-200"></div>
        <div className="flex justify-between">
          <span className="text-gray-600">Items:</span>
          <span className="font-bold text-blue-600">{stats.itemCount}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Queries:</span>
          <span className="font-bold text-green-600">{stats.queryCount}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Facets:</span>
          <span className="font-bold text-purple-600">{stats.facetCount}</span>
        </div>
      </div>
      
      <div className="flex gap-2">
        <button
          onClick={() => handleInvalidateCache(cacheName)}
          className="btn flex-1"
        >
          Invalidate
        </button>
        <button
          onClick={() => handleClearCache(cacheName)}
          className="btn btn-danger flex-1"
        >
          Clear
        </button>
      </div>
    </div>
  );

  const totalItems = cacheStats ?
      (cacheStats.widget?.itemCount || 0) + (cacheStats.widgetType?.itemCount || 0) + (cacheStats.widgetComponent?.itemCount || 0) : 0;
  const totalQueries = cacheStats ?
      (cacheStats.widget?.queryCount || 0) + (cacheStats.widgetType?.queryCount || 0) + (cacheStats.widgetComponent?.queryCount || 0) : 0;
  const totalFacets = cacheStats ?
      (cacheStats.widget?.facetCount || 0) + (cacheStats.widgetType?.facetCount || 0) + (cacheStats.widgetComponent?.facetCount || 0) : 0;

  return (
    <div className="px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Cache Diagnostic Dashboard</h1>
        <div className="flex gap-2 items-center">
          <span className="text-sm text-gray-600">
            Last refresh: {lastRefresh.toLocaleTimeString()}
          </span>
          <button
            onClick={loadCacheData}
            disabled={loading}
            className="btn"
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="summary-card">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">Total Items</h3>
          <p className="text-4xl font-bold text-blue-600">{totalItems}</p>
          <p className="text-sm text-blue-700 mt-1">Cached entities across all caches</p>
        </div>
        
        <div className="summary-card">
          <h3 className="text-lg font-semibold text-green-900 mb-2">Total Queries</h3>
          <p className="text-4xl font-bold text-green-600">{totalQueries}</p>
          <p className="text-sm text-green-700 mt-1">Complete query results</p>
        </div>
        
        <div className="summary-card">
          <h3 className="text-lg font-semibold text-purple-900 mb-2">Total Facets</h3>
          <p className="text-4xl font-bold text-purple-600">{totalFacets}</p>
          <p className="text-sm text-purple-700 mt-1">Filtered/partial query results</p>
        </div>
      </div>

        {/* Individual Cache Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {cacheInfo && cacheStats && (
            <>
              <CacheCard
                title="Widget Cache"
                info={cacheInfo.widget}
                stats={cacheStats.widget}
                cacheName="widget"
              />
              <CacheCard
                title="WidgetType Cache"
                info={cacheInfo.widgetType}
                stats={cacheStats.widgetType}
                cacheName="widgetType"
              />
              <CacheCard
                title="WidgetComponent Cache"
                info={cacheInfo.widgetComponent}
                stats={cacheStats.widgetComponent}
                cacheName="widgetComponent"
              />
            </>
          )}
        </div>

        {/* Global Actions */}
        <div className="summary-card">
          <h2 className="text-xl font-semibold mb-4">Global Cache Actions</h2>
          <div className="flex gap-4">
            <button
              onClick={() => handleInvalidateCache('all')}
              className="btn"
            >
              Invalidate All Caches
            </button>
            <button
              onClick={() => handleClearCache('all')}
              className="btn btn-danger"
            >
              Clear All Caches
            </button>
          </div>
        </div>

        {/* Information Panel */}
        <div className="mt-8 summary-card bg-blue-50 border border-blue-200">
          <h2 className="text-xl font-semibold mb-3">About This Dashboard</h2>
          <div className="space-y-2 text-sm text-gray-700">
            <p>
              <strong>Items:</strong> Individual entities cached in memory or IndexedDB
            </p>
            <p>
              <strong>Queries:</strong> Complete query results (e.g., all widgets, all widget types)
            </p>
            <p>
              <strong>Facets:</strong> Filtered/partial query results (e.g., widgets by type, active widgets)
            </p>
            <p className="mt-4">
              <strong>Invalidate:</strong> Clears query and facet caches but keeps items
            </p>
            <p>
              <strong>Clear:</strong> Completely removes all data from the cache
            </p>
          </div>
        </div>
    </div>
  );
}

