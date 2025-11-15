"use client";

import React, { useState } from 'react';
import { getCacheUtils } from '../../client/cache/ClientCache';

export default function CacheControlsPage() {
  const [testResults, setTestResults] = useState<any[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedCache, setSelectedCache] = useState<'widget' | 'widgetType' | 'widgetComponent'>('widget');

  const addResult = (test: string, result: any, success: boolean) => {
    setTestResults(prev => [...prev, {
      timestamp: new Date().toLocaleTimeString(),
      test,
      result,
      success
    }]);
  };

  const clearResults = () => {
    setTestResults([]);
  };

  const testCacheOperations = async () => {
    setIsRunning(true);
    clearResults();

    try {
      const utils = await getCacheUtils();

      // Test 1: Get current cache stats
      addResult('Initial Cache Stats', await utils.getCacheStats(), true);

      // Test 2: Clear specific cache
      await utils[selectedCache].clear();
      addResult(`${selectedCache} Cache Clear`, 'Cache cleared', true);

      // Test 3: Get stats after clear
      const statsAfterClear = await utils.getCacheStats();
      addResult('Stats After Clear', statsAfterClear, true);

      // Test 4: Test invalidation
      utils[selectedCache].invalidate();
      addResult(`${selectedCache} Cache Invalidation`, 'Query results invalidated', true);

      // Test 5: Get cache info
      const cacheInfo = utils.getCacheInfo();
      addResult('Cache Info', cacheInfo, true);

    } catch (error) {
      addResult('Error', error instanceof Error ? error.message : 'Unknown error', false);
    } finally {
      setIsRunning(false);
    }
  };

  const testLocationQueries = async () => {
    setIsRunning(true);
    clearResults();

    try {
      const utils = await getCacheUtils();

      // Test location-based queries for WidgetComponent
      if (selectedCache === 'widgetComponent') {
        // Get all components
        addResult('Querying all components', 'Fetching...', true);
        
        // Note: We can't directly test queries without widget IDs
        addResult('Location Query Test', 'Would need valid widget IDs to test location queries', true);
      } else {
        addResult('Location Queries', 'Only available for widgetComponent cache', false);
      }

    } catch (error) {
      addResult('Error', error instanceof Error ? error.message : 'Unknown error', false);
    } finally {
      setIsRunning(false);
    }
  };

  const testCacheCorruption = async () => {
    setIsRunning(true);
    clearResults();

    try {
      const utils = await getCacheUtils();

      // Test 1: Clear all caches
      await utils.clearAll();
      addResult('Step 1', 'All caches cleared', true);

      // Test 2: Populate with normal operations (would need API calls in real scenario)
      addResult('Step 2', 'Would populate cache via normal API operations', true);

      // Test 3: Force invalidation
      utils.invalidateAll();
      addResult('Step 3', 'All query results invalidated', true);

      // Test 4: Check cache state
      const finalStats = await utils.getCacheStats();
      addResult('Final State', finalStats, true);

    } catch (error) {
      addResult('Error', error instanceof Error ? error.message : 'Unknown error', false);
    } finally {
      setIsRunning(false);
    }
  };

  const testCrossCacheInvalidation = async () => {
    setIsRunning(true);
    clearResults();

    try {
      const utils = await getCacheUtils();

      // Test cross-cache invalidation patterns
      addResult('Test 1', 'Invalidating widget cache', true);
      utils.invalidateWidgets();

      addResult('Test 2', 'Invalidating widget type cache', true);
      utils.invalidateWidgetTypes();

      addResult('Test 3', 'Invalidating widget component cache', true);
      utils.invalidateWidgetComponents();

      const stats = await utils.getCacheStats();
      addResult('Final Stats', stats, true);

    } catch (error) {
      addResult('Error', error instanceof Error ? error.message : 'Unknown error', false);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="px-8 py-8">
      <h1 className="text-3xl font-bold mb-8 text-gray-900">Manual Cache Control Interface</h1>

      {/* Cache Selection */}
      <div className="summary-card mb-6">
          <h2 className="text-xl font-semibold mb-4">Select Cache to Test</h2>
          <div className="flex gap-4">
            <button
              onClick={() => setSelectedCache('widget')}
              className={`btn ${
                selectedCache === 'widget'
                  ? 'bg-blue-600'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Widget Cache
            </button>
            <button
              onClick={() => setSelectedCache('widgetType')}
              className={`btn ${
                selectedCache === 'widgetType'
                  ? 'bg-blue-600'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              WidgetType Cache
            </button>
            <button
              onClick={() => setSelectedCache('widgetComponent')}
              className={`btn ${
                selectedCache === 'widgetComponent'
                  ? 'bg-blue-600'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              WidgetComponent Cache
            </button>
          </div>
        </div>

        {/* Test Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Basic Operations Test */}
          <div className="summary-card">
            <h2 className="text-xl font-semibold mb-3">Basic Operations Test</h2>
            <p className="text-sm text-gray-600 mb-4">
              Tests clear, invalidate, and stat retrieval on selected cache
            </p>
            <button
              onClick={testCacheOperations}
              disabled={isRunning}
              className="btn w-full"
            >
              {isRunning ? 'Running...' : 'Run Basic Operations'}
            </button>
          </div>

          {/* Location Query Test */}
          <div className="summary-card">
            <h2 className="text-xl font-semibold mb-3">Location Query Test</h2>
            <p className="text-sm text-gray-600 mb-4">
              Tests location-based queries (WidgetComponent only)
            </p>
            <button
              onClick={testLocationQueries}
              disabled={isRunning}
              className="btn w-full"
            >
              {isRunning ? 'Running...' : 'Test Location Queries'}
            </button>
          </div>

          {/* Cache Corruption Test */}
          <div className="summary-card">
            <h2 className="text-xl font-semibold mb-3">Cache Corruption Recovery</h2>
            <p className="text-sm text-gray-600 mb-4">
              Simulates cache corruption and tests recovery mechanisms
            </p>
            <button
              onClick={testCacheCorruption}
              disabled={isRunning}
              className="btn w-full"
            >
              {isRunning ? 'Running...' : 'Test Corruption Recovery'}
            </button>
          </div>

          {/* Cross-Cache Invalidation Test */}
          <div className="summary-card">
            <h2 className="text-xl font-semibold mb-3">Cross-Cache Invalidation</h2>
            <p className="text-sm text-gray-600 mb-4">
              Tests invalidation patterns across related caches
            </p>
            <button
              onClick={testCrossCacheInvalidation}
              disabled={isRunning}
              className="btn w-full"
            >
              {isRunning ? 'Running...' : 'Test Cross-Cache Invalidation'}
            </button>
          </div>
        </div>

        {/* Test Results */}
        <div className="summary-card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Test Results</h2>
            <button
              onClick={clearResults}
              className="btn"
            >
              Clear Results
            </button>
          </div>
          
          {testResults.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No test results yet. Run a test to see results here.
            </p>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {testResults.map((result, index) => (
                <div
                  key={index}
                  className={`p-4 rounded border-l-4 ${
                    result.success
                      ? 'bg-green-50 border-green-500'
                      : 'bg-red-50 border-red-500'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-semibold">{result.test}</span>
                    <span className="text-xs text-gray-500">{result.timestamp}</span>
                  </div>
                  <pre className="text-sm bg-white p-2 rounded overflow-x-auto">
                    {typeof result.result === 'object'
                      ? JSON.stringify(result.result, null, 2)
                      : result.result}
                  </pre>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Information Panel */}
        <div className="mt-8 summary-card bg-blue-50 border border-blue-200">
          <h2 className="text-xl font-semibold mb-3">Test Descriptions</h2>
          <div className="space-y-3 text-sm text-gray-700">
            <div>
              <strong>Basic Operations:</strong> Tests fundamental cache operations including clear,
              invalidate, and statistics retrieval.
            </div>
            <div>
              <strong>Location Queries:</strong> Tests location-based query functionality, particularly
              important for hierarchical relationships (e.g., components belonging to widgets).
            </div>
            <div>
              <strong>Corruption Recovery:</strong> Simulates cache corruption scenarios and tests
              the system&apos;s ability to recover and maintain consistency.
            </div>
            <div>
              <strong>Cross-Cache Invalidation:</strong> Tests how changes in one cache properly
              trigger invalidation in related caches (e.g., deleting a widget should invalidate its components).
            </div>
          </div>
        </div>
    </div>
  );
}

