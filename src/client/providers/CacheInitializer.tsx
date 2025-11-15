"use client";

import React, { useEffect, useState } from 'react';
import { getWidgetCacheSync, getWidgetTypeCacheSync, initializeCaches } from '../cache/ClientCache';

interface CacheInitializerProps {
  children: React.ReactNode;
}

/**
 * CacheInitializer ensures that IndexedDB caches are fully initialized
 * before rendering children components. This prevents race conditions
 * where components try to access cache before IndexedDB is ready.
 *
 * This demonstrates proper handling of asynchronous IndexedDB initialization
 * in a React application using fjell-cache.
 */
export const CacheInitializer: React.FC<CacheInitializerProps> = ({ children }) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        console.log('🚀 Initializing IndexedDB caches...');

        // Initialize all caches
        await initializeCaches();

        // Get the initialized cache instances
        const widgetCache = getWidgetCacheSync();
        const widgetTypeCache = getWidgetTypeCacheSync();

        // Access the cache maps to check if they have initialization promises
        const widgetCacheMap = widgetCache.cacheMap as any;
        const widgetTypeCacheMap = widgetTypeCache.cacheMap as any;

        // Wait for IndexedDB initialization if needed
        const initPromises: Promise<void>[] = [];

        console.log('Checking initialization promises...');
        console.log('Widget cache map type:', widgetCacheMap?.implementationType);
        console.log('Widget cache map init promise:', !!widgetCacheMap?.initializationPromise);

        if (widgetCacheMap?.initializationPromise) {
          console.log('⏳ Waiting for widget cache IndexedDB initialization...');
          initPromises.push(widgetCacheMap.initializationPromise);
        }

        if (widgetTypeCacheMap?.initializationPromise) {
          console.log('⏳ Waiting for widget type cache IndexedDB initialization...');
          initPromises.push(widgetTypeCacheMap.initializationPromise);
        }

        // Wait for all initialization promises with timeout
        if (initPromises.length > 0) {
          console.log(`⏳ Waiting for ${initPromises.length} initialization promises...`);

          // Add timeout to prevent infinite hang
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('IndexedDB initialization timeout after 10 seconds')), 10000)
          );

          try {
            await Promise.race([
              Promise.all(initPromises),
              timeoutPromise
            ]);
            console.log('✅ IndexedDB initialization complete');
          } catch (error) {
            console.warn('⚠️ IndexedDB initialization failed or timed out:', error);
            console.log('⚠️ Continuing without IndexedDB initialization...');
            // Continue anyway - the caches will work but may not be fully initialized from IndexedDB
          }
        } else {
          console.log('✅ No initialization promises needed');
        }

        // Skip data loading in CacheInitializer - let the providers handle this
        console.log('✅ Cache initialization complete - skipping data preloading');
        console.log('📝 Providers will load data on-demand using cache-first operations');

        // Set dummy results to avoid breaking the rest of the initialization
        const widgetResult = [widgetCache, []];
        const widgetTypeResult = [widgetTypeCache, []];

        // Extract the actual data from the [CacheMap, Items[]] tuple
        const widgets = Array.isArray(widgetResult) ? widgetResult[1] : [];
        const widgetTypes = Array.isArray(widgetTypeResult) ? widgetTypeResult[1] : [];

        console.log(`✅ Caches initialized with ${widgets?.length || 0} widgets and ${widgetTypes?.length || 0} widget types`);

        // Check if data is actually in the cache maps
        console.log('🔍 Checking cache contents after initialization:');
        console.log('Widget cache keys:', widgetCache.cacheMap.keys());
        console.log('Widget type cache keys:', widgetTypeCache.cacheMap.keys());

        // Test direct cache queries
        const allWidgetsFromCache = widgetCache.cacheMap.queryIn({}, []);
        console.log('📦 All widgets from cache map:', allWidgetsFromCache);

        const allWidgetTypesFromCache = widgetTypeCache.cacheMap.queryIn({}, []);
        console.log('📦 All widget types from cache map:', allWidgetTypesFromCache);

        // Check IndexedDB storage for debugging
        if ('storage' in navigator && 'estimate' in navigator.storage) {
          const estimate = await navigator.storage.estimate();
          console.log(`💾 IndexedDB storage: ${(estimate.usage || 0) / 1024 / 1024}MB used of ${(estimate.quota || 0) / 1024 / 1024}MB`);
        }

        // Wait a bit to ensure React providers are set up before marking as initialized
        console.log('⏳ Waiting for React providers to be ready...');
        await new Promise(resolve => setTimeout(resolve, 100));

        console.log('✅ Cache initialization complete, enabling React providers');
        setIsInitialized(true);
      } catch (err) {
        console.error('❌ Failed to initialize caches:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        // Still set as initialized to not block the app entirely
        setIsInitialized(true);
      }
    };

    initializeApp();
  }, []);

  if (!isInitialized) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        color: '#333'
      }}>
        <div style={{
          padding: '40px',
          textAlign: 'center',
          maxWidth: '500px'
        }}>
          <h2 style={{ marginBottom: '20px', color: '#6366f1' }}>Initializing Application</h2>
          <p style={{ marginBottom: '30px', color: '#666' }}>
            Setting up IndexedDB cache for offline support...
          </p>
          <div style={{
            display: 'inline-block',
            width: '50px',
            height: '50px',
            border: '3px solid #f3f4f6',
            borderTopColor: '#6366f1',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
          <style>{`
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        padding: '20px',
        margin: '20px',
        backgroundColor: '#fef2f2',
        border: '1px solid #fecaca',
        borderRadius: '8px',
        color: '#991b1b'
      }}>
        <h3>Cache Initialization Warning</h3>
        <p>IndexedDB initialization encountered an issue: {error}</p>
        <p>The application will continue with limited offline capabilities.</p>
      </div>
    );
  }

  return <>{children}</>;
};
