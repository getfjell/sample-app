import { Cache } from '@fjell/cache';
import { Widget } from '../../model/Widget';
import { WidgetType } from '../../model/WidgetType';
import { WidgetComponent } from '../../model/WidgetComponent';

// Type-only imports to avoid triggering cache creation during SSR
type WidgetCache = Cache<Widget, 'widget'>;
type WidgetTypeCache = Cache<WidgetType, 'widgetType'>;
type WidgetComponentCache = Cache<WidgetComponent, 'widgetComponent', 'widget'>;

/**
 * Client-side cache instances that are only initialized when accessed in the browser.
 * This prevents SSR issues with IndexedDB.
 */
let _widgetCache: WidgetCache | null = null;
let _widgetTypeCache: WidgetTypeCache | null = null;
let _widgetComponentCache: WidgetComponentCache | null = null;
let _isInitializing = false;
let _initPromise: Promise<void> | null = null;

/**
 * Initialize all caches - called once by CacheInitializer
 */
export const initializeCaches = async (): Promise<void> => {
  if (_isInitializing || (_widgetCache && _widgetTypeCache && _widgetComponentCache)) {
    // If already initializing or initialized, wait for the existing promise
    if (_initPromise) {
      await _initPromise;
    }
    return;
  }

  _isInitializing = true;
  console.log('🚀 Starting cache initialization...');

  _initPromise = (async () => {
    try {
      if (typeof window === 'undefined') {
        throw new Error('Caches can only be initialized in browser environment');
      }

      console.log('📦 Loading WidgetCache module...');
      const { widgetCache } = await import('./WidgetCache');
      _widgetCache = widgetCache;
      console.log('✅ Widget cache loaded');

      console.log('📦 Loading WidgetTypeCache module...');
      const { widgetTypeCache } = await import('./WidgetTypeCache');
      _widgetTypeCache = widgetTypeCache;
      console.log('✅ Widget type cache loaded');

      console.log('📦 Loading WidgetComponentCache module...');
      const { widgetComponentCache } = await import('./WidgetComponentCache');
      _widgetComponentCache = widgetComponentCache;
      console.log('✅ Widget component cache loaded');

      console.log('🎉 All caches initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize caches:', error);
      _isInitializing = false;
      _initPromise = null;
      throw error;
    } finally {
      _isInitializing = false;
    }
  })();

  await _initPromise;
};

/**
 * Get widget cache instance, initializing it only on first access in the browser
 */
export const getWidgetCache = async (): Promise<WidgetCache> => {
  if (!_widgetCache) {
    await initializeCaches();
  }
  return _widgetCache!;
};

/**
 * Get widget cache instance synchronously (must be called after async initialization)
 */
export const getWidgetCacheSync = (): WidgetCache => {
  if (!_widgetCache) {
    throw new Error('Widget cache not yet initialized. Call initializeCaches() first.');
  }
  return _widgetCache;
};

/**
 * Get widget type cache instance, initializing it only on first access in the browser
 */
export const getWidgetTypeCache = async (): Promise<WidgetTypeCache> => {
  if (!_widgetTypeCache) {
    await initializeCaches();
  }
  return _widgetTypeCache!;
};

/**
 * Get widget type cache instance synchronously (must be called after async initialization)
 */
export const getWidgetTypeCacheSync = (): WidgetTypeCache => {
  if (!_widgetTypeCache) {
    console.error('❌ Widget type cache not initialized! Call initializeCaches() first.');
    throw new Error('Widget type cache not yet initialized. Call initializeCaches() first.');
  }
  return _widgetTypeCache;
};

/**
 * Get widget component cache instance, initializing it only on first access in the browser
 */
export const getWidgetComponentCache = async (): Promise<WidgetComponentCache> => {
  if (!_widgetComponentCache) {
    await initializeCaches();
  }
  return _widgetComponentCache!;
};

/**
 * Get widget component cache instance synchronously (must be called after async initialization)
 */
export const getWidgetComponentCacheSync = (): WidgetComponentCache => {
  if (!_widgetComponentCache) {
    console.error('❌ Widget component cache not initialized! Call initializeCaches() first.');
    throw new Error('Widget component cache not yet initialized. Call initializeCaches() first.');
  }
  return _widgetComponentCache;
};

/**
 * Get all cache utilities, initializing them only on first access in the browser
 */
export const getCacheUtils = async () => {
  if (typeof window === 'undefined') {
    throw new Error('Cache utils can only be accessed in browser environment');
  }

  // Import utilities only in browser
  const { cacheUtils } = await import('./index');
  return cacheUtils;
};

/**
 * Check if we're in a browser environment
 */
export const isBrowser = () => typeof window !== 'undefined';
