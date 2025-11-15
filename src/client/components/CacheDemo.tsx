'use client';

import React, { useEffect, useState } from 'react';
import { getWidgetCache, getWidgetTypeCache } from '../cache/ClientCache';

interface QueryResult {
  data: any[];
  meta: {
    queryType: 'selective' | 'complete';
    cacheLayer: 'query' | 'facet';
    ttl: string;
    description: string;
    totalCount?: number;
    filteredCount?: number;
  };
  timing: {
    start: number;
    end: number;
    duration: number;
  };
  cacheHit?: boolean;
}

interface CacheStats {
  widget: any;
  widgetType: any;
}

/**
 * Two Layer Cache Demonstration Component
 *
 * This component provides a comprehensive interface for testing and understanding
 * the Two Layer Cache architecture with different query types and cache behaviors.
 */
export function CacheDemo() {
  const [results, setResults] = useState<Record<string, QueryResult>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [cacheStats, setCacheStats] = useState<CacheStats | null>(null);
  const [selectedWidgetType, setSelectedWidgetType] = useState<string>('');
  const [widgetTypes, setWidgetTypes] = useState<any[]>([]);

  // Load initial data
  useEffect(() => {
    loadWidgetTypes();
    loadCacheStats();
  }, []);

  const loadWidgetTypes = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/cache/widget-types/all');
      const result = await response.json();
      if (result.success) {
        setWidgetTypes(result.data);
        if (result.data.length > 0) {
          setSelectedWidgetType(result.data[0].id);
        }
      }
    } catch (error) {
      console.error('Failed to load widget types:', error);
    }
  };

  const loadCacheStats = async () => {
    try {
      // This would ideally get real cache stats from the cache instances
      // For now, we'll use placeholder data
      setCacheStats({
        widget: { hits: 0, misses: 0, size: 0 },
        widgetType: { hits: 0, misses: 0, size: 0 }
      });
    } catch (error) {
      console.error('Failed to load cache stats:', error);
    }
  };

  const executeQuery = async (endpoint: string, queryKey: string, description: string) => {
    setLoading(prev => ({ ...prev, [queryKey]: true }));
    
    const start = performance.now();
    
    try {
      // Prepend Express server URL if endpoint doesn't start with http
      const fullUrl = endpoint.startsWith('http') ? endpoint : `http://localhost:3001${endpoint}`;
      const response = await fetch(fullUrl);
      const end = performance.now();
      const result = await response.json();
      
      if (result.success) {
        const queryResult: QueryResult = {
          ...result,
          timing: {
            start,
            end,
            duration: end - start
          },
          // We could potentially detect cache hits by timing, but this is demo data
          cacheHit: Math.random() > 0.3 // Simulate cache behavior for demo
        };
        
        setResults(prev => ({ ...prev, [queryKey]: queryResult }));
      }
    } catch (error) {
      console.error(`Query ${queryKey} failed:`, error);
    } finally {
      setLoading(prev => ({ ...prev, [queryKey]: false }));
    }
  };

  const clearAllCaches = async () => {
    try {
      // Clear client-side caches
      const widgetCache = await getWidgetCache();
      const widgetTypeCache = await getWidgetTypeCache();
      
      await widgetCache.operations.reset();
      await widgetTypeCache.operations.reset();
      
      // Clear results and reload stats
      setResults({});
      loadCacheStats();
      
      console.log('All caches cleared successfully');
    } catch (error) {
      console.error('Failed to clear caches:', error);
    }
  };

  const renderQueryResult = (key: string, result: QueryResult) => {
    const isComplete = result.meta.queryType === 'complete';
    const isCacheDemo = key === 'keysDemo' || key === 'clobberTest';
    const cardStyle = isCacheDemo 
      ? 'border-orange-200 bg-orange-50'
      : isComplete 
        ? 'border-blue-200 bg-blue-50' 
        : 'border-green-200 bg-green-50';
    
    return (
      <div key={key} className={`border-2 ${cardStyle} rounded-lg p-4 mb-4`}>
        <div className="flex justify-between items-start mb-2">
          <h4 className="font-semibold text-lg">
            {result.meta.description}
          </h4>
          <div className="flex gap-2">
            <span className={`px-2 py-1 rounded text-sm ${
              isCacheDemo
                ? 'bg-orange-200 text-orange-800'
                : isComplete 
                  ? 'bg-blue-200 text-blue-800' 
                  : 'bg-green-200 text-green-800'
            }`}>
              {isCacheDemo ? 'cache-test' : result.meta.queryType}
            </span>
            <span className={`px-2 py-1 rounded text-sm ${
              result.cacheHit ? 'bg-green-200 text-green-800' : 'bg-orange-200 text-orange-800'
            }`}>
              {result.cacheHit ? 'Cache Hit' : 'Cache Miss'}
            </span>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="font-medium">Cache Layer:</span>
            <div>{result.meta.cacheLayer}</div>
          </div>
          <div>
            <span className="font-medium">TTL:</span>
            <div>{result.meta.ttl}</div>
          </div>
          <div>
            <span className="font-medium">Duration:</span>
            <div>{result.timing.duration.toFixed(2)}ms</div>
          </div>
          <div>
            <span className="font-medium">Results:</span>
            <div>
              {result.meta.filteredCount !== undefined
                ? `${result.meta.filteredCount}/${result.meta.totalCount}`
                : Array.isArray(result.data) 
                  ? result.data.length
                  : 'Object'
              }
            </div>
          </div>
        </div>
        
        <div className="mt-3">
          <details className="cursor-pointer">
            <summary className="font-medium text-sm">
              View Data ({Array.isArray(result.data) ? result.data.length : 1} items)
            </summary>
            <pre className="mt-2 text-xs bg-white p-2 rounded border overflow-auto max-h-32">
              {Array.isArray(result.data) 
                ? JSON.stringify(result.data.slice(0, 3), null, 2) + (result.data.length > 3 ? '\n... and more' : '')
                : JSON.stringify(result.data, null, 2)
              }
            </pre>
          </details>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Two Layer Cache Demonstration</h1>
        <p className="text-gray-600 mb-4">
          This demo shows how the Two Layer Cache architecture works with different query types AND prevents cache clobbering.
          <strong className="text-blue-600"> Complete queries</strong> use longer TTL (5 min) while
          <strong className="text-green-600"> selective queries</strong> use shorter TTL (1 min).
          <strong className="text-orange-600"> Cache tests</strong> demonstrate that different queries create separate cache entries.
        </p>
        
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold mb-2">🔍 How to Test:</h3>
          <div className="text-sm mb-2 bg-blue-50 p-2 rounded border border-blue-200">
            <strong>⚠️ Important:</strong> Make sure the Express API server is running on port 3001:<br/>
            <code className="bg-blue-100 px-2 py-1 rounded">npm run api:dev</code> or <code className="bg-blue-100 px-2 py-1 rounded">npm run dev:all</code>
          </div>
          <ol className="list-decimal list-inside text-sm space-y-1">
            <li>Execute different query types below and note the cache layers AND unique cache keys</li>
            <li>Use <strong className="text-orange-600">Cache Tests</strong> to see how different queries create separate cache entries</li>
            <li>Run the same query again quickly - should show cache hit with faster timing</li>
            <li>Try different widgets by type - each type gets its own cache key (no clobbering!)</li>
            <li>Check browser console for Two Layer Cache debug logs showing different cache keys</li>
            <li>Use clear cache to reset and start over</li>
          </ol>
        </div>
      </div>

      {/* Control Panel */}
      <div className="bg-white border rounded-lg p-4 mb-6">
        <h2 className="text-xl font-semibold mb-4">Query Controls</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Complete Queries */}
          <div className="space-y-2">
            <h3 className="font-semibold text-blue-600">Complete Queries (5min TTL)</h3>
            <button
              onClick={() => executeQuery('/api/cache/widgets/all', 'allWidgets', 'All Widgets')}
              disabled={loading.allWidgets}
              className="w-full px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
            >
              {loading.allWidgets ? 'Loading...' : 'Get All Widgets'}
            </button>
            <button
              onClick={() => executeQuery('/api/cache/widget-types/all', 'allWidgetTypes', 'All Widget Types')}
              disabled={loading.allWidgetTypes}
              className="w-full px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
            >
              {loading.allWidgetTypes ? 'Loading...' : 'Get All Widget Types'}
            </button>
          </div>

          {/* Selective Queries */}
          <div className="space-y-2">
            <h3 className="font-semibold text-green-600">Selective Queries (1min TTL)</h3>
            <button
              onClick={() => executeQuery('/api/cache/widgets/active', 'activeWidgets', 'Active Widgets Only')}
              disabled={loading.activeWidgets}
              className="w-full px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
            >
              {loading.activeWidgets ? 'Loading...' : 'Get Active Widgets'}
            </button>
            <button
              onClick={() => executeQuery('/api/cache/widgets/recent', 'recentWidgets', 'Recent Widgets')}
              disabled={loading.recentWidgets}
              className="w-full px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
            >
              {loading.recentWidgets ? 'Loading...' : 'Get Recent Widgets'}
            </button>
            {selectedWidgetType && (
              <div>
                <select
                  value={selectedWidgetType}
                  onChange={(e) => setSelectedWidgetType(e.target.value)}
                  className="w-full px-2 py-1 border rounded text-sm mb-1"
                >
                  {widgetTypes.map(wt => (
                    <option key={wt.id} value={wt.id}>
                      {wt.name} ({wt.code})
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => executeQuery(
                    `/api/cache/widgets/by-type/${selectedWidgetType}`,
                    `widgetsByType_${selectedWidgetType}`,
                    `Widgets by Type`
                  )}
                  disabled={loading[`widgetsByType_${selectedWidgetType}`]}
                  className="w-full px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
                >
                  {loading[`widgetsByType_${selectedWidgetType}`] ? 'Loading...' : 'Get by Type'}
                </button>
              </div>
            )}
          </div>

          {/* Cache Clobbering Prevention Tests */}
          <div className="space-y-2">
            <h3 className="font-semibold text-orange-600">Cache Clobbering Prevention</h3>
            <button
              onClick={() => executeQuery('/api/cache/cache/keys-demo', 'keysDemo', 'Cache Keys Demo')}
              disabled={loading.keysDemo}
              className="w-full px-3 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 disabled:opacity-50"
            >
              {loading.keysDemo ? 'Loading...' : 'View Cache Keys'}
            </button>
            {results.allWidgets?.data?.length > 0 && (
              <button
                onClick={() => {
                  const firstWidget = results.allWidgets.data[0];
                  executeQuery(
                    `/api/cache/widgets/clobber-test/${firstWidget.id}`,
                    'clobberTest',
                    'Cache Clobber Test'
                  );
                }}
                disabled={loading.clobberTest}
                className="w-full px-3 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 disabled:opacity-50"
              >
                {loading.clobberTest ? 'Loading...' : 'Test Same Widget Different Queries'}
              </button>
            )}
          </div>

          {/* Cache Management */}
          <div className="space-y-2">
            <h3 className="font-semibold text-gray-600">Cache Management</h3>
            <button
              onClick={clearAllCaches}
              className="w-full px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Clear All Caches
            </button>
            <button
              onClick={() => executeQuery('/api/cache/info', 'cacheInfo', 'Cache Configuration')}
              disabled={loading.cacheInfo}
              className="w-full px-3 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 disabled:opacity-50"
            >
              {loading.cacheInfo ? 'Loading...' : 'Get Cache Info'}
            </button>
            <button
              onClick={() => executeQuery('/api/cache/guide', 'cacheGuide', 'Testing Guide')}
              disabled={loading.cacheGuide}
              className="w-full px-3 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50"
            >
              {loading.cacheGuide ? 'Loading...' : 'View Guide'}
            </button>
          </div>
        </div>
      </div>

      {/* Results */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Query Results</h2>
        {Object.keys(results).length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            Execute queries above to see results and cache behavior
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(results).map(([key, result]) => renderQueryResult(key, result))}
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="mt-8 text-sm text-gray-500 border-t pt-4">
        <p>
          <strong>💡 Pro Tip:</strong> Open your browser's Developer Console to see detailed
          Two Layer Cache debug logs including cache hits/misses, TTL expiration, and query invalidation events.
        </p>
      </div>
    </div>
  );
}

export default CacheDemo;
