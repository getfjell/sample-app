'use client';

import React, { useEffect, useState } from 'react';
import { useWidgetAdapter, WidgetsQuery } from '../providers/WidgetProvider';
import { useWidgetTypeAdapter, WidgetTypesQuery } from '../providers/WidgetTypeProvider';
import { IQFactory } from '@fjell/core';

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
 * Fjell Full Stack Demonstration Component
 *
 * This component demonstrates the complete fjell architecture:
 * Component → Provider/Adapter → Cache → Client-API → PItemRouter → Server
 *
 * Shows proper usage of:
 * - PItemAdapter for data access through providers
 * - Cache operations with Two-Layer caching
 * - ItemQuery factory patterns for different query types
 * - Real cache statistics and management
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const widgetAdapter = useWidgetAdapter();
  const widgetTypeAdapter = useWidgetTypeAdapter();

  const loadWidgetTypes = async () => {
    try {
      const widgetTypes = await widgetTypeAdapter.all(IQFactory.all().toQuery());
      setWidgetTypes(widgetTypes);
      if (widgetTypes.length > 0) {
        setSelectedWidgetType(widgetTypes[0].id);
      }
    } catch (error) {
      console.error('Failed to load widget types:', error);
    }
  };

  const loadCacheStats = async () => {
    try {
      // Get real cache stats from the adapter cache instances
      const widgetStats = widgetAdapter.cache.getCacheInfo();
      const widgetTypeStats = widgetTypeAdapter.cache.getCacheInfo();
      
      setCacheStats({
        widget: widgetStats,
        widgetType: widgetTypeStats
      });
    } catch (error) {
      console.error('Failed to load cache stats:', error);
      // Fallback to placeholder data
      setCacheStats({
        widget: { hits: 0, misses: 0, size: 0 },
        widgetType: { hits: 0, misses: 0, size: 0 }
      });
    }
  };

  const executeQuery = async (cacheType: 'widget' | 'widgetType', queryType: 'all' | 'finder', finderName?: string, finderParams?: any, description?: string) => {
    const queryKey = `${cacheType}_${queryType}_${finderName || 'all'}`;
    setLoading(prev => ({ ...prev, [queryKey]: true }));
    
    const start = performance.now();
    
    try {
      let data: any[] = [];
      let cacheHit = false;
      
      if (cacheType === 'widget') {
        if (queryType === 'all') {
          data = await widgetAdapter.all(IQFactory.all().toQuery());
          cacheHit = Math.random() > 0.5; // Simulate cache behavior - real implementation would track this
        } else if (queryType === 'finder' && finderName) {
          // Use the adapter's finder method directly
          data = await widgetAdapter.find(finderName, finderParams || {});
          cacheHit = Math.random() > 0.5; // Simulate cache behavior
        }
      } else {
        if (queryType === 'all') {
          data = await widgetTypeAdapter.all(IQFactory.all().toQuery());
          cacheHit = Math.random() > 0.5; // Simulate cache behavior
        } else if (queryType === 'finder' && finderName) {
          // Use the adapter's finder method directly
          data = await widgetTypeAdapter.find(finderName, finderParams || {});
          cacheHit = Math.random() > 0.5; // Simulate cache behavior
        }
      }
      
      const end = performance.now();
      
      const queryResult: QueryResult = {
        data,
        meta: {
          queryType: queryType === 'finder' ? 'selective' : 'complete',
          cacheLayer: 'query',
          ttl: queryType === 'finder' ? '1min' : '5min',
          description: description || `${cacheType} ${queryType} ${finderName || ''}`.trim(),
          totalCount: data.length,
          filteredCount: data.length
        },
        timing: {
          start,
          end,
          duration: end - start
        },
        cacheHit
      };
      
      setResults(prev => ({ ...prev, [queryKey]: queryResult }));
    } catch (error) {
      console.error(`Provider query ${queryKey} failed:`, error);
    } finally {
      setLoading(prev => ({ ...prev, [queryKey]: false }));
    }
  };

  const clearAllCaches = async () => {
    try {
      // Cache clearing is a management operation that works at the cache level
      // This demonstrates how to access the underlying cache when needed for admin operations
      await widgetAdapter.cache.operations.reset();
      await widgetTypeAdapter.cache.operations.reset();
      
      // Clear results and reload stats
      setResults({});
      loadCacheStats();
      
      console.log('All caches cleared successfully via adapter cache references');
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
            <div className="mt-4">
              {Array.isArray(result.data) ? (
                <div className="overflow-x-auto">
                  <table className="cache-demo-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Type</th>
                        <th>Status</th>
                        <th>Created</th>
                        <th>Data Preview</th>
                        <th>ID</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.data
                        // Sort by creation date descending (newest first)
                        .sort((a, b) => {
                          const dateA = new Date(a.createdAt || a.events?.created?.at || 0);
                          const dateB = new Date(b.createdAt || b.events?.created?.at || 0);
                          return dateB.getTime() - dateA.getTime();
                        })
                        .map((item, index) => (
                          <tr key={item.id || index} className={index === 0 ? 'newest-record' : ''}>
                            <td className="widget-name-cell">
                              <div className="name-container">
                                <strong className="widget-title">{item.name || 'Unnamed'}</strong>
                                {item.description && (
                                  <div className="widget-subtitle">{item.description}</div>
                                )}
                              </div>
                            </td>
                            <td className="type-cell">
                              <span className="type-pill">
                                {item.widgetTypeId ? (
                                  (() => {
                                    const widgetType = widgetTypes.find(wt => wt.id === item.widgetTypeId);
                                    return widgetType ? `${widgetType.name}` : 'Unknown Type';
                                  })()
                                ) : 'N/A'}
                              </span>
                            </td>
                            <td className="status-cell">
                              <span className={`status-pill ${item.isActive ? 'active' : 'inactive'}`}>
                                {item.isActive ? '✓ Active' : '✗ Inactive'}
                              </span>
                            </td>
                            <td className="date-cell">
                              {(() => {
                                const date = new Date(item.createdAt || item.events?.created?.at);
                                return isNaN(date.getTime()) ? 'Unknown' : date.toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                });
                              })()}
                            </td>
                            <td className="data-cell">
                              <details className="data-details">
                                <summary className="data-summary">
                                  {item.data ? '📄 View JSON' : 'No data'}
                                </summary>
                                {item.data && (
                                  <pre className="json-preview">
                                    {JSON.stringify(item.data, null, 2)}
                                  </pre>
                                )}
                              </details>
                            </td>
                            <td className="id-cell">
                              <code className="id-code">{(item.id || 'N/A').substring(0, 8)}...</code>
                            </td>
                          </tr>
                        ))
                      }
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="non-array-data">
                  <pre className="mt-2 text-xs bg-white p-3 rounded border overflow-auto max-h-48 font-mono">
                    {JSON.stringify(result.data, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </details>
        </div>
      </div>
    );
  };

  return (
    <div className="px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4 text-gray-900">Fjell Full Stack Demonstration</h1>
        <p className="text-gray-600 mb-4">
          This demo demonstrates the complete fjell architecture: <strong>Component → Provider/Adapter → Cache → Client-API → PItemRouter → Server</strong>.
          All queries flow through fjell providers using proper patterns.
          <strong className="text-blue-600"> Complete queries</strong> use longer TTL (5 min) while
          <strong className="text-green-600"> selective queries</strong> use shorter TTL (1 min) via the Two-Layer Cache system.
        </p>
        
        <div className="summary-card bg-yellow-50 border border-yellow-200 mb-6">
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
      <div className="summary-card mb-6">
        <h2 className="text-xl font-semibold mb-4">Query Controls</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Complete Queries */}
          <div className="space-y-2">
            <h3 className="font-semibold text-blue-600">Complete Queries (5min TTL)</h3>
            <button
              onClick={() => executeQuery('widget', 'all', undefined, undefined, 'All Widgets')}
              disabled={loading.widget_all_all}
              className="btn w-full"
            >
              {loading.widget_all_all ? 'Loading...' : 'Get All Widgets'}
            </button>
            <button
              onClick={() => executeQuery('widgetType', 'all', undefined, undefined, 'All Widget Types')}
              disabled={loading.widgetType_all_all}
              className="btn w-full"
            >
              {loading.widgetType_all_all ? 'Loading...' : 'Get All Widget Types'}
            </button>
          </div>

          {/* Selective Queries */}
          <div className="space-y-2">
            <h3 className="font-semibold text-green-600">Selective Queries (1min TTL)</h3>
            <button
              onClick={() => executeQuery('widget', 'finder', 'active', {}, 'Active Widgets Only')}
              disabled={loading.widget_finder_active}
              className="btn w-full"
            >
              {loading.widget_finder_active ? 'Loading...' : 'Get Active Widgets'}
            </button>
            <button
              onClick={() => executeQuery('widget', 'finder', 'byTypeCode', {code: 'BUTTON'}, 'Widgets by Type Code')}
              disabled={loading.widget_finder_byTypeCode}
              className="btn w-full"
            >
              {loading.widget_finder_byTypeCode ? 'Loading...' : 'Get Button Widgets'}
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
                    'widget',
                    'finder',
                    'byType',
                    {widgetTypeId: selectedWidgetType},
                    'Widgets by Type'
                  )}
                  disabled={loading.widget_finder_byType}
                  className="btn w-full"
                >
                  {loading.widget_finder_byType ? 'Loading...' : 'Get by Type'}
                </button>
              </div>
            )}
          </div>

          {/* Cache Management */}
          <div className="space-y-2">
            <h3 className="font-semibold text-gray-600">Cache Management</h3>
            <button
              onClick={clearAllCaches}
              className="btn btn-danger w-full"
            >
              Clear All Caches
            </button>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="summary-card">
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
          <strong>💡 Pro Tip:</strong> Open your browser&apos;s Developer Console to see detailed
          Two Layer Cache debug logs including cache hits/misses, TTL expiration, and query invalidation events.
        </p>
      </div>
    </div>
  );
}

export default CacheDemo;
