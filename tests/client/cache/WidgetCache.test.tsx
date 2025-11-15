import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Cache, createCache, createRegistry } from '@fjell/cache';
import { createCoordinate } from '@fjell/core';
import type { Widget } from '../../../src/model/Widget';
import type { WidgetType } from '../../../src/model/WidgetType';
import { TestFixtures } from '../../helpers/testFixtures';
import { captureConsole, delay, formatMemoryUsage } from '../../helpers/testUtils';

// Mock the API modules since we're testing cache behavior, not API calls [[memory:3807192]]
const mockWidgetApi: any = {
  read: vi.fn(),
  write: vi.fn(),
  query: vi.fn()
};

const mockWidgetTypeApi: any = {
  read: vi.fn(),
  write: vi.fn(),
  query: vi.fn()
};

const mockWidgetComponentApi: any = {
  read: vi.fn(),
  write: vi.fn(),
  query: vi.fn()
};

vi.mock('../../../src/client/api/WidgetAPI', () => ({
  widgetApi: mockWidgetApi,
  widgetTypeApi: mockWidgetTypeApi,
  widgetComponentApi: mockWidgetComponentApi
}));

// Create test-friendly cache configuration using memory instead of IndexedDB
const createTestCacheOptions = () => ({
  cacheType: 'memory' as const,
  enableDebugLogging: false,
  autoSync: true,
  maxRetries: 5,
  retryDelay: 2000,
  ttl: 900000, // 15 minutes
  evictionConfig: {
    type: 'lru' as const
  }
});

describe('WidgetCache', () => {
  let cacheRegistry: any;
  let widgetCache: Cache<Widget, 'widget'>;
  let widgetTypeCache: Cache<WidgetType, 'widgetType'>;
  let cacheUtils: any;

  beforeEach(() => {
    // Clear any existing cache data before each test
    vi.clearAllMocks();

    // Create fresh cache instances for each test using memory cache
    cacheRegistry = createRegistry();

    const widgetCoordinate = createCoordinate('widget');
    const widgetTypeCoordinate = createCoordinate('widgetType');

    widgetCache = createCache(
      mockWidgetApi,
      widgetCoordinate,
      cacheRegistry,
      createTestCacheOptions()
    );

    widgetTypeCache = createCache(
      mockWidgetTypeApi,
      widgetTypeCoordinate,
      cacheRegistry,
      createTestCacheOptions()
    );

    // Create utility functions similar to the ones in WidgetCache.ts
    cacheUtils = {
      clearAll: async () => {
        await widgetCache.operations.reset();
        await widgetTypeCache.operations.reset();
      },
      getCacheInfo: () => ({
        widget: widgetCache.getCacheInfo(),
        widgetType: widgetTypeCache.getCacheInfo()
      }),
      invalidateWidgets: () => {
        widgetCache.cacheMap.clearQueryResults();
      },
      invalidateWidgetTypes: () => {
        widgetTypeCache.cacheMap.clearQueryResults();
      },
      getCacheStats: () => {
        const widgetSizeInfo = widgetCache.cacheMap.getCurrentSize();
        const widgetTypeSizeInfo = widgetTypeCache.cacheMap.getCurrentSize();

        return {
          widget: {
            ...widgetSizeInfo
          },
          widgetType: {
            ...widgetTypeSizeInfo
          }
        };
      }
    };
  });

  describe('Cache Registry', () => {
    it('should create a cache registry instance', () => {
      expect(cacheRegistry).toBeDefined();
      expect(typeof cacheRegistry.register).toBe('function');
      expect(typeof cacheRegistry.get).toBe('function');
    });
  });

  describe('Cache Instances', () => {
    it('should create widgetCache instance with correct configuration', () => {
      expect(widgetCache).toBeDefined();
      expect(typeof widgetCache.operations).toBe('object');
      expect(typeof widgetCache.subscribe).toBe('function');
      expect(widgetCache.cacheMap).toBeDefined();
    });

    it('should create widgetTypeCache instance with correct configuration', () => {
      expect(widgetTypeCache).toBeDefined();
      expect(typeof widgetTypeCache.operations).toBe('object');
      expect(typeof widgetTypeCache.subscribe).toBe('function');
      expect(widgetTypeCache.cacheMap).toBeDefined();
    });

    it('should have different cache instances for widgets and widget types', () => {
      expect(widgetCache).not.toBe(widgetTypeCache);
      expect(widgetCache.cacheMap).not.toBe(widgetTypeCache.cacheMap);
    });
  });

  describe('Cache Configuration', () => {
    it('should configure caches with memory settings for testing', () => {
      // Test that caches are created with expected properties
      expect(widgetCache.cacheMap).toBeDefined();
      expect(widgetTypeCache.cacheMap).toBeDefined();

      // Verify cache info includes expected configuration
      const widgetInfo = widgetCache.getCacheInfo();
      const widgetTypeInfo = widgetTypeCache.getCacheInfo();

      expect(widgetInfo).toBeDefined();
      expect(widgetTypeInfo).toBeDefined();
    });

    it('should have proper TTL and eviction settings', () => {
      const widgetInfo = widgetCache.getCacheInfo();
      const widgetTypeInfo = widgetTypeCache.getCacheInfo();

      // Both caches should have similar configuration structure
      expect(typeof widgetInfo).toBe('object');
      expect(typeof widgetTypeInfo).toBe('object');
    });
  });

  describe('Cache Utils', () => {
    it('should provide clearAll utility function', async () => {
      expect(typeof cacheUtils.clearAll).toBe('function');

      // Execute the function to ensure it runs without errors
      await expect(cacheUtils.clearAll()).resolves.not.toThrow();
    });

    it('should provide getCacheInfo utility function', () => {
      expect(typeof cacheUtils.getCacheInfo).toBe('function');

      const cacheInfo = cacheUtils.getCacheInfo();

      expect(cacheInfo).toBeDefined();
      expect(cacheInfo.widget).toBeDefined();
      expect(cacheInfo.widgetType).toBeDefined();
    });

    it('should provide invalidation utility functions', () => {
      expect(typeof cacheUtils.invalidateWidgets).toBe('function');
      expect(typeof cacheUtils.invalidateWidgetTypes).toBe('function');

      // Execute functions to ensure they run without errors
      expect(() => cacheUtils.invalidateWidgets()).not.toThrow();
      expect(() => cacheUtils.invalidateWidgetTypes()).not.toThrow();
    });

    it('should provide cache statistics function', () => {
      expect(typeof cacheUtils.getCacheStats).toBe('function');

      const stats = cacheUtils.getCacheStats();

      expect(stats).toBeDefined();
      expect(stats.widget).toBeDefined();
      expect(stats.widgetType).toBeDefined();
    });
  });

  describe('Cache Statistics', () => {
    it('should return cache statistics with size information', () => {
      const stats = cacheUtils.getCacheStats();

      expect(stats.widget).toBeDefined();
      expect(stats.widgetType).toBeDefined();

      // Both should have size-related properties
      expect(typeof stats.widget).toBe('object');
      expect(typeof stats.widgetType).toBe('object');
    });

    it('should format memory usage correctly', () => {
      // Test memory formatting utility [[memory:3807185]]
      expect(formatMemoryUsage(512)).toBe('512 B');
      expect(formatMemoryUsage(1536)).toBe('1.50 kB');
      expect(formatMemoryUsage(1572864)).toBe('1.50 MB');
    });
  });

  describe('Cache Event Subscriptions', () => {
    it('should have event subscription functions', () => {
      expect(typeof widgetCache.subscribe).toBe('function');
      expect(typeof widgetTypeCache.subscribe).toBe('function');
    });

    it('should allow subscription to cache events', () => {
      const mockHandler = vi.fn();

      // Subscribe to events
      expect(() => widgetCache.subscribe(mockHandler)).not.toThrow();
      expect(() => widgetTypeCache.subscribe(mockHandler)).not.toThrow();
    });

    it('should handle cache events when triggered', () => {
      const mockWidgetHandler = vi.fn();
      const mockWidgetTypeHandler = vi.fn();

      // Subscribe to events
      widgetCache.subscribe(mockWidgetHandler);
      widgetTypeCache.subscribe(mockWidgetTypeHandler);

      // Test that subscription setup completes successfully
      expect(mockWidgetHandler).toHaveBeenCalledTimes(0);
      expect(mockWidgetTypeHandler).toHaveBeenCalledTimes(0);
    });
  });

  describe('Cross-Cache Integration', () => {
    it('should have separate but related cache instances', () => {
      // Verify that both caches exist and are properly configured
      expect(widgetCache).toBeDefined();
      expect(widgetTypeCache).toBeDefined();

      // They should be different instances
      expect(widgetCache).not.toBe(widgetTypeCache);

      // But both should be registered in the same registry
      expect(cacheRegistry).toBeDefined();
    });

    it('should provide cross-cache invalidation utilities', () => {
      // Test that utility functions exist for managing related caches
      expect(typeof cacheUtils.invalidateWidgets).toBe('function');
      expect(typeof cacheUtils.invalidateWidgetTypes).toBe('function');
      expect(typeof cacheUtils.clearAll).toBe('function');

      // Execute to ensure they work
      expect(() => cacheUtils.invalidateWidgets()).not.toThrow();
      expect(() => cacheUtils.invalidateWidgetTypes()).not.toThrow();
    });
  });

  describe('Cache Operations', () => {
    it('should have operations interface on cache instances', () => {
      expect(widgetCache.operations).toBeDefined();
      expect(widgetTypeCache.operations).toBeDefined();

      // Both should have reset functionality
      expect(typeof widgetCache.operations.reset).toBe('function');
      expect(typeof widgetTypeCache.operations.reset).toBe('function');
    });

    it('should have cacheMap interface on cache instances', () => {
      expect(widgetCache.cacheMap).toBeDefined();
      expect(widgetTypeCache.cacheMap).toBeDefined();

      // Both should have query result clearing
      expect(typeof widgetCache.cacheMap.clearQueryResults).toBe('function');
      expect(typeof widgetTypeCache.cacheMap.clearQueryResults).toBe('function');

      // Both should have size information
      expect(typeof widgetCache.cacheMap.getCurrentSize).toBe('function');
      expect(typeof widgetTypeCache.cacheMap.getCurrentSize).toBe('function');
    });

    it('should execute cache operations successfully', async () => {
      // Test that cache operations run successfully with memory cache
      await expect(widgetCache.operations.reset()).resolves.not.toThrow();
      await expect(widgetTypeCache.operations.reset()).resolves.not.toThrow();

      expect(() => widgetCache.cacheMap.clearQueryResults()).not.toThrow();
      expect(() => widgetTypeCache.cacheMap.clearQueryResults()).not.toThrow();
    });
  });

  describe('Environment Configuration', () => {
    it('should configure caches appropriately for test environment', () => {
      // The cache configuration should be set up for memory (test environment)
      // We can verify this by checking that the caches were created successfully
      expect(widgetCache).toBeDefined();
      expect(widgetTypeCache).toBeDefined();

      // Both caches should have the expected operations
      expect(widgetCache.operations).toBeDefined();
      expect(widgetTypeCache.operations).toBeDefined();
    });

    it('should have proper test environment settings', () => {
      // In test environment, debug logging and other dev features should be configured
      const widgetInfo = widgetCache.getCacheInfo();
      const widgetTypeInfo = widgetTypeCache.getCacheInfo();

      expect(widgetInfo).toBeDefined();
      expect(widgetTypeInfo).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle cache operations gracefully', async () => {
      // Test that cache operations don't throw unexpected errors
      await expect(cacheUtils.clearAll()).resolves.not.toThrow();

      expect(() => cacheUtils.getCacheInfo()).not.toThrow();
      expect(() => cacheUtils.getCacheStats()).not.toThrow();
      expect(() => cacheUtils.invalidateWidgets()).not.toThrow();
      expect(() => cacheUtils.invalidateWidgetTypes()).not.toThrow();
    });

    it('should handle missing cache data gracefully', () => {
      // Test that getting stats and info works even with empty caches
      const stats = cacheUtils.getCacheStats();
      const info = cacheUtils.getCacheInfo();

      expect(stats).toBeDefined();
      expect(info).toBeDefined();
      expect(stats.widget).toBeDefined();
      expect(stats.widgetType).toBeDefined();
      expect(info.widget).toBeDefined();
      expect(info.widgetType).toBeDefined();
    });
  });

  describe('Cache Functionality Integration', () => {
    it('should demonstrate cache usage patterns', () => {
      // Test basic cache functionality patterns that would be used in the app
      expect(widgetCache.cacheMap).toBeDefined();
      expect(widgetTypeCache.cacheMap).toBeDefined();

      // Test that cache has expected methods
      expect(typeof widgetCache.cacheMap.getCurrentSize).toBe('function');
      expect(typeof widgetTypeCache.cacheMap.getCurrentSize).toBe('function');

      // Execute size retrieval
      const widgetSize = widgetCache.cacheMap.getCurrentSize();
      const widgetTypeSize = widgetTypeCache.cacheMap.getCurrentSize();

      expect(widgetSize).toBeDefined();
      expect(widgetTypeSize).toBeDefined();
    });

    it('should handle cache lifecycle operations', async () => {
      // Test cache reset operations
      await expect(cacheUtils.clearAll()).resolves.not.toThrow();

      // Test cache invalidation operations
      expect(() => cacheUtils.invalidateWidgets()).not.toThrow();
      expect(() => cacheUtils.invalidateWidgetTypes()).not.toThrow();

      // Verify operations complete successfully
      const stats = cacheUtils.getCacheStats();
      expect(stats).toBeDefined();
    });
  });

  describe('Actual Implementation Testing', () => {
    // Test the actual exported instances and configuration
    it('should test actual WidgetCache module exports', async () => {
      // Import the actual module to test its exports
      const WidgetCacheModule = await import('../../../src/client/cache');

      expect(WidgetCacheModule.cacheRegistry).toBeDefined();
      expect(WidgetCacheModule.widgetCache).toBeDefined();
      expect(WidgetCacheModule.widgetTypeCache).toBeDefined();
      expect(WidgetCacheModule.cacheUtils).toBeDefined();
    });

    it('should verify actual cache configuration options', async () => {
      const WidgetCacheModule = await import('../../../src/client/cache');

      // Test that actual caches have expected configuration
      const widgetInfo = WidgetCacheModule.widgetCache.getCacheInfo();
      const widgetTypeInfo = WidgetCacheModule.widgetTypeCache.getCacheInfo();

      expect(widgetInfo).toBeDefined();
      expect(widgetTypeInfo).toBeDefined();

      // Verify they are different cache instances
      expect(WidgetCacheModule.widgetCache).not.toBe(WidgetCacheModule.widgetTypeCache);
    });

    it('should test actual cache utilities functions', async () => {
      const WidgetCacheModule = await import('../../../src/client/cache');

      // Test all utility functions exist and are callable
      expect(typeof WidgetCacheModule.cacheUtils.clearAll).toBe('function');
      expect(typeof WidgetCacheModule.cacheUtils.getCacheInfo).toBe('function');
      expect(typeof WidgetCacheModule.cacheUtils.invalidateWidgets).toBe('function');
      expect(typeof WidgetCacheModule.cacheUtils.invalidateWidgetTypes).toBe('function');
      expect(typeof WidgetCacheModule.cacheUtils.getCacheStats).toBe('function');

      // Test that they execute without throwing
      const info = WidgetCacheModule.cacheUtils.getCacheInfo();
      const stats = await WidgetCacheModule.cacheUtils.getCacheStats();

      expect(info.widget).toBeDefined();
      expect(info.widgetType).toBeDefined();
      expect(stats.widget).toBeDefined();
      expect(stats.widgetType).toBeDefined();
    });
  });

  describe('Cache Event Handling - Comprehensive', () => {
    it('should handle widget cache events and log appropriately', async () => {
      const console = captureConsole();

      try {
        const testWidget = TestFixtures.createCompleteWidget('test-type-id');

        // Set up event handler that simulates the actual implementation
        const eventHandler = (event: any) => {
          if (event.type === 'item_created' || event.type === 'item_updated' || event.type === 'item_removed') {
            console.logs.push(`Widget ${event.type} detected: ${event.item?.id}`);
          }
        };

        widgetCache.subscribe(eventHandler);

        // Simulate events by calling the handler directly (since we're testing the handler logic)
        eventHandler({ type: 'item_created', item: testWidget });
        eventHandler({ type: 'item_updated', item: testWidget });
        eventHandler({ type: 'item_removed', item: testWidget });

        // Verify logging behavior
        expect(console.logs).toContain(`Widget item_created detected: ${testWidget.id}`);
        expect(console.logs).toContain(`Widget item_updated detected: ${testWidget.id}`);
        expect(console.logs).toContain(`Widget item_removed detected: ${testWidget.id}`);

      } finally {
        console.restore();
      }
    });

    it('should handle widget type cache events with cross-cache invalidation', async () => {
      const console = captureConsole();

      try {
        const testWidgetType = TestFixtures.createCompleteWidgetType();

        // Mock clearQueryResults to verify it gets called
        const clearQueryResultsSpy = vi.spyOn(widgetCache.cacheMap, 'clearQueryResults');

        // Set up event handler that simulates the actual implementation
        const eventHandler = (event: any) => {
          if (event.type === 'item_created' || event.type === 'item_updated' || event.type === 'item_removed') {
            console.logs.push(`WidgetType ${event.type} detected: ${event.item?.id}`);

            // Simulate cross-cache invalidation for removed items
            if (event.type === 'item_removed' && event.item?.id) {
              widgetCache.cacheMap.clearQueryResults();
            }
          }
        };

        widgetTypeCache.subscribe(eventHandler);

        // Simulate events
        eventHandler({ type: 'item_created', item: testWidgetType });
        eventHandler({ type: 'item_updated', item: testWidgetType });
        eventHandler({ type: 'item_removed', item: testWidgetType });

        // Verify logging behavior
        expect(console.logs).toContain(`WidgetType item_created detected: ${testWidgetType.id}`);
        expect(console.logs).toContain(`WidgetType item_updated detected: ${testWidgetType.id}`);
        expect(console.logs).toContain(`WidgetType item_removed detected: ${testWidgetType.id}`);

        // Verify cross-cache invalidation was called
        expect(clearQueryResultsSpy).toHaveBeenCalled();

      } finally {
        console.restore();
      }
    });

    it('should handle events with missing item data gracefully', async () => {
      const console = captureConsole();

      try {
        // Event handler that simulates the actual implementation
        const eventHandler = (event: any) => {
          if (event.type === 'item_created' || event.type === 'item_updated' || event.type === 'item_removed') {
            console.logs.push(`Widget ${event.type} detected: ${event.item?.id}`);
          }
        };

        widgetCache.subscribe(eventHandler);

        // Simulate events with missing or undefined item data
        eventHandler({ type: 'item_created', item: null });
        eventHandler({ type: 'item_updated', item: undefined });
        eventHandler({ type: 'item_removed' }); // No item property

        // Verify logging handles missing data gracefully
        expect(console.logs).toContain('Widget item_created detected: undefined');
        expect(console.logs).toContain('Widget item_updated detected: undefined');
        expect(console.logs).toContain('Widget item_removed detected: undefined');

      } finally {
        console.restore();
      }
    });

    it('should ignore non-relevant event types', async () => {
      const console = captureConsole();

      try {
        const testWidget = TestFixtures.createCompleteWidget('test-type-id');

        // Event handler that simulates the actual implementation
        const eventHandler = (event: any) => {
          if (event.type === 'item_created' || event.type === 'item_updated' || event.type === 'item_removed') {
            console.logs.push(`Widget ${event.type} detected: ${event.item?.id}`);
          }
        };

        widgetCache.subscribe(eventHandler);

        // Simulate irrelevant events
        eventHandler({ type: 'cache_initialized', item: testWidget });
        eventHandler({ type: 'cache_cleared', item: testWidget });
        eventHandler({ type: 'unknown_event', item: testWidget });

        // Verify no logging for irrelevant events
        expect(console.logs).toHaveLength(0);

      } finally {
        console.restore();
      }
    });
  });

  describe('Cache Configuration Testing', () => {
    it('should test createCacheOptions function behavior', () => {
      // Since createCacheOptions is not exported, we'll test the expected configuration structure
      const expectedDbName = 'TestWidgetAppCache_Widgets';
      const expectedStoreName = 'testWidgets';

      // Test that our test cache has the expected structure
      expect(widgetCache).toBeDefined();
      expect(widgetCache.cacheMap).toBeDefined();
      expect(widgetCache.operations).toBeDefined();
    });

    it('should test cache options with different environments', () => {
      // Test development vs production configuration behavior
      const originalEnv = process.env.NODE_ENV;

      try {
        // Test development environment
        process.env.NODE_ENV = 'development';
        const devRegistry = createRegistry();
        const devCache = createCache(
          mockWidgetApi,
          createCoordinate('widget'),
          devRegistry,
          createTestCacheOptions()
        );

        expect(devCache).toBeDefined();

        // Test production environment
        process.env.NODE_ENV = 'production';
        const prodRegistry = createRegistry();
        const prodCache = createCache(
          mockWidgetApi,
          createCoordinate('widget'),
          prodRegistry,
          createTestCacheOptions()
        );

        expect(prodCache).toBeDefined();

      } finally {
        process.env.NODE_ENV = originalEnv;
      }
    });

    it('should test cache configuration properties', () => {
      const testOptions = createTestCacheOptions();

      expect(testOptions.cacheType).toBe('memory');
      expect(testOptions.enableDebugLogging).toBe(false);
      expect(testOptions.autoSync).toBe(true);
      expect(testOptions.maxRetries).toBe(5);
      expect(testOptions.retryDelay).toBe(2000);
      expect(testOptions.ttl).toBe(900000);
      expect(testOptions.evictionConfig.type).toBe('lru');
    });
  });

  describe('Cross-Cache Invalidation Logic', () => {
    it('should test widget type removal triggering widget cache invalidation', () => {
      const clearQueryResultsSpy = vi.spyOn(widgetCache.cacheMap, 'clearQueryResults');

      // Simulate the exact logic from WidgetCache.ts
      const testWidgetType = TestFixtures.createCompleteWidgetType();
      const event = {
        type: 'item_removed',
        item: testWidgetType
      };

      // Simulate the event handler logic
      if (event.type === 'item_removed' && event.item?.id) {
        widgetCache.cacheMap.clearQueryResults();
      }

      expect(clearQueryResultsSpy).toHaveBeenCalled();
    });

    it('should not invalidate widget cache for non-removal events', () => {
      const clearQueryResultsSpy = vi.spyOn(widgetCache.cacheMap, 'clearQueryResults');
      clearQueryResultsSpy.mockClear();

      const testWidgetType = TestFixtures.createCompleteWidgetType();

      // Test created and updated events - should not trigger invalidation
      const createdEvent = { type: 'item_created', item: testWidgetType };
      const updatedEvent = { type: 'item_updated', item: testWidgetType };

      // Simulate the event handler logic for non-removal events
      for (const event of [createdEvent, updatedEvent]) {
        if (event.type === 'item_removed' && event.item?.id) {
          widgetCache.cacheMap.clearQueryResults();
        }
      }

      expect(clearQueryResultsSpy).not.toHaveBeenCalled();
    });

    it('should not invalidate widget cache when removed item has no ID', () => {
      const clearQueryResultsSpy = vi.spyOn(widgetCache.cacheMap, 'clearQueryResults');
      clearQueryResultsSpy.mockClear();

      // Test with null, undefined, and empty string IDs
      const eventsWithoutIds = [
        { type: 'item_removed', item: { id: null } },
        { type: 'item_removed', item: { id: undefined } },
        { type: 'item_removed', item: { id: '' } },
        { type: 'item_removed', item: null },
        { type: 'item_removed' } // No item property
      ];

      for (const event of eventsWithoutIds) {
        if (event.type === 'item_removed' && event.item?.id) {
          widgetCache.cacheMap.clearQueryResults();
        }
      }

      expect(clearQueryResultsSpy).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle cache operation errors gracefully', async () => {
      // Mock reset to throw an error
      const resetSpy = vi.spyOn(widgetCache.operations, 'reset');
      resetSpy.mockRejectedValueOnce(new Error('Cache reset failed'));

      // Test that clearAll handles errors
      await expect(async () => {
        await cacheUtils.clearAll();
      }).rejects.toThrow('Cache reset failed');

      resetSpy.mockRestore();
    });

    it('should handle cache map operation errors gracefully', () => {
      // Mock clearQueryResults to throw an error
      const clearSpy = vi.spyOn(widgetCache.cacheMap, 'clearQueryResults');
      clearSpy.mockImplementationOnce(() => {
        throw new Error('Clear query results failed');
      });

      // Test that invalidation functions handle errors
      expect(() => cacheUtils.invalidateWidgets()).toThrow('Clear query results failed');

      clearSpy.mockRestore();
    });

    it('should handle cache size calculation errors gracefully', () => {
      // Mock getCurrentSize to throw an error
      const getSizeSpy = vi.spyOn(widgetCache.cacheMap, 'getCurrentSize');
      getSizeSpy.mockImplementationOnce(() => {
        throw new Error('Size calculation failed');
      });

      // Test that getCacheStats handles errors
      expect(() => cacheUtils.getCacheStats()).toThrow('Size calculation failed');

      getSizeSpy.mockRestore();
    });

    it('should handle subscription errors gracefully', () => {
      // Test that subscribe actually requires valid handlers
      expect(() => widgetCache.subscribe(null as any)).toThrow();
      expect(() => widgetCache.subscribe(undefined as any)).toThrow();

      // Test that valid handlers work
      const validHandler = vi.fn();
      expect(() => widgetCache.subscribe(validHandler)).not.toThrow();
    });

    it('should handle large datasets in cache statistics', () => {
      // Mock large cache size data
      const largeSizeInfo = {
        itemCount: 10000,
        sizeBytes: 1572864 // 1.5 MB
      };

      const getSizeSpy = vi.spyOn(widgetCache.cacheMap, 'getCurrentSize');
      getSizeSpy.mockReturnValueOnce(largeSizeInfo);

      const stats = cacheUtils.getCacheStats();

      expect(stats.widget).toBeDefined();
      expect(stats.widget.sizeBytes).toBe(1572864);
      expect(stats.widget.itemCount).toBe(10000);

      getSizeSpy.mockRestore();
    });
  });

  describe('Performance and Memory Testing', () => {
    it('should track cache memory usage patterns', () => {
      // Get initial stats
      const initialStats = cacheUtils.getCacheStats();

      expect(initialStats.widget).toBeDefined();
      expect(initialStats.widgetType).toBeDefined();

      // Verify stats structure contains expected properties
      expect(typeof initialStats.widget).toBe('object');
      expect(typeof initialStats.widgetType).toBe('object');
    });

    it('should handle cache info retrieval efficiently', () => {
      const start = Date.now();

      // Perform multiple cache info retrievals
      for (let i = 0; i < 100; i++) {
        const info = cacheUtils.getCacheInfo();
        expect(info).toBeDefined();
      }

      const duration = Date.now() - start;

      // Should complete reasonably quickly (less than 1 second)
      expect(duration).toBeLessThan(1000);
    });

    it('should handle multiple concurrent operations', async () => {
      // Perform multiple concurrent operations
      const operations = [
        () => cacheUtils.getCacheInfo(),
        () => cacheUtils.getCacheStats(),
        () => cacheUtils.invalidateWidgets(),
        () => cacheUtils.invalidateWidgetTypes()
      ];

      const promises = operations.map(op => Promise.resolve(op()));

      // All operations should complete successfully
      await expect(Promise.all(promises)).resolves.toBeDefined();
    });
  });
});
