# Two Layer Cache Demo Implementation

## Overview

This document describes the comprehensive Two Layer Cache demonstration that has been added to the Fjell Sample App. The implementation showcases the advanced caching architecture with IndexedDB storage and provides tools to explore query cache behavior.

## What Was Implemented

### 1. Two Layer Cache Configuration

**Files Modified:**
- `src/client/cache/WidgetCache.ts`
- `src/client/cache/WidgetTypeCache.ts`

**Changes:**
- Enabled Two Layer Caching in both Widget and WidgetType caches
- Configured IndexedDB as the underlying storage
- Set different TTL values for different cache layers:
  - **Item Layer**: 900 seconds (15 minutes) - for individual items
  - **Query Layer**: 300 seconds (5 minutes) - for complete query results  
  - **Facet Layer**: 60 seconds (1 minute) - for partial/filtered query results

```typescript
twoLayer: {
  itemTTL: 900,    // 15 minutes for items
  queryTTL: 300,   // 5 minutes for complete queries
  facetTTL: 60,    // 1 minute for partial queries
  debug: true      // Enable two-layer debug logging
}
```

### 2. Server-Side API Endpoints

**New File:** `src/routes/cacheRoutes.ts`

**Endpoints Added:**

#### Selective Queries (Uses Facet Cache - 1 minute TTL):
- `GET /api/cache/widgets/active` - Active widgets only (cache key: `query:widget:all:{"query":{"isActive":true}}`)
- `GET /api/cache/widgets/by-type/:widgetTypeId` - Widgets filtered by type (cache key: `query:widget:all:{"query":{"widgetTypeId":"ID"}}`)
- `GET /api/cache/widgets/recent` - Widgets created in last 7 days (cache key: `query:widget:all:{"query":{"createdAt":{"$gte":"DATE"}}}`)

#### Cache Clobbering Prevention Demos:
- `GET /api/cache/widgets/clobber-test/:widgetId` - Shows same widget retrieved through different cache keys
- `GET /api/cache/keys-demo` - Displays all different cache keys being used

#### Complete Queries (Uses Query Cache - 5 minutes TTL):
- `GET /api/cache/widgets/all` - All widgets without filtering (cache key: `query:widget:all:{"query":{}}`)
- `GET /api/cache/widget-types/all` - All widget types without filtering (cache key: `query:widgetType:all:{"query":{}}`)

#### Cache Exploration:
- `GET /api/cache/info` - Cache configuration and statistics
- `GET /api/cache/guide` - Testing guide and instructions

### 3. Frontend Demo Component

**New Files:**
- `src/client/components/CacheDemo.tsx` - Main demo component
- `src/app/cache-demo/page.tsx` - Next.js page wrapper

**Features:**
- Interactive interface for testing different query types
- Visual distinction between complete and selective queries
- Real-time timing measurements
- Cache hit/miss simulation
- Detailed query results with metadata
- Cache management controls
- Built-in testing guide

### 4. Navigation and Integration

**Files Modified:**
- `src/app/layout.tsx` - Added navigation to cache demo
- `src/routes/index.ts` - Integrated cache routes
- `src/index.ts` - Updated API info and console output

## How to Use the Demo

### 1. Start the Application

**Important:** This app requires both the Next.js frontend and Express API server to be running.

```bash
cd sample-app
npm install
npm run dev:all  # Runs both frontend and API server
```

This will start:
- Next.js frontend at `http://localhost:3000`  
- Express API server at `http://localhost:3001`

**Alternative - Run separately:**
```bash
# Terminal 1 - Frontend
npm run dev

# Terminal 2 - API Server  
npm run api:dev
```

### 2. Access the Demo

Navigate to `http://localhost:3000/cache-demo` to see the Two Layer Cache demonstration interface.

### 3. Testing Different Query Types

#### Complete Queries (Blue - 5 minute TTL):
- **"Get All Widgets"** - Returns all widgets from database
- **"Get All Widget Types"** - Returns all widget types from database
- These use the **query layer** with longer TTL

#### Selective Queries (Green - 1 minute TTL):
- **"Get Active Widgets"** - Only active widgets (filtered result)
- **"Get Recent Widgets"** - Widgets from last 7 days
- **"Get by Type"** - Widgets of specific type
- These use the **facet layer** with shorter TTL

### 4. Understanding Cache Behavior

1. **First Request**: Will show "Cache Miss" and take longer
2. **Repeated Request (within TTL)**: Will show "Cache Hit" and be faster
3. **After TTL Expiration**: Will show "Cache Miss" again and refresh data
4. **Different Query Types**: Each has its own cache entry with different TTL
5. **Cache Clobbering Prevention**: Different queries create separate cache keys - no conflicts!

### 5. Testing Cache Clobbering Prevention

The demo now includes special tests to prove cache clobbering prevention:

1. **View Cache Keys Demo**: Shows all active cache keys being used
2. **Same Widget Different Queries**: Demonstrates the same widget can be retrieved through multiple cache paths
3. **Unique Cache Keys**: Each query parameter combination creates a unique cache key

**Example Cache Keys Generated:**
- All widgets: `query:widget:all:{"query":{}}`
- Active widgets: `query:widget:all:{"query":{"isActive":true}}`  
- Widgets by type: `query:widget:all:{"query":{"widgetTypeId":"abc123"}}`
- Recent widgets: `query:widget:all:{"query":{"createdAt":{"$gte":"2024-01-01T00:00:00.000Z"}}}`

### 5. Browser Console Debugging

Open browser Developer Tools and check the Console tab for detailed Two Layer Cache debug logs:
- Cache hit/miss events
- TTL expiration messages  
- Query layer transitions
- Cache invalidation events

## API Testing

You can also test the cache behavior directly via API calls to the Express server (port 3001):

```bash
# Complete queries (5 min cache)
curl http://localhost:3001/api/cache/widgets/all
curl http://localhost:3001/api/cache/widget-types/all

# Selective queries (1 min cache) - Each gets unique cache key!
curl http://localhost:3001/api/cache/widgets/active
curl http://localhost:3001/api/cache/widgets/recent
curl http://localhost:3001/api/cache/widgets/by-type/[widget-type-id]

# Cache clobbering prevention demos
curl http://localhost:3001/api/cache/keys-demo
curl http://localhost:3001/api/cache/widgets/clobber-test/[widget-id]

# Cache info
curl http://localhost:3001/api/cache/info
curl http://localhost:3001/api/cache/guide
```

## Key Technical Features

### Two Layer Architecture

1. **Item Layer**: 
   - Stores individual widgets and widget types
   - 15-minute TTL for durability
   - IndexedDB storage for persistence

2. **Query Layer**: 
   - Stores complete query results (all items)
   - 5-minute TTL for reasonable freshness
   
3. **Facet Layer**: 
   - Stores filtered/partial query results
   - 1-minute TTL for quick updates
   - Handles conditional queries

### Cache Poisoning Prevention

The Two Layer architecture prevents cache poisoning by:
- Separating item storage from query result storage
- Using different TTL values based on query completeness
- Automatic cache invalidation on item changes
- **Query-specific cache keys that distinguish different result sets**

### Cache Clobbering Prevention

**How Different Queries Get Unique Cache Keys:**

1. **Base Query**: `operations.all({})` → `query:widget:all:{"query":{}}`
2. **Filtered Query**: `operations.all({isActive: true})` → `query:widget:all:{"query":{"isActive":true}}`
3. **Type Query**: `operations.all({widgetTypeId: "abc"})` → `query:widget:all:{"query":{"widgetTypeId":"abc"}}`

**Key Generation Algorithm:**
```typescript
buildQueryKey(queryType: string, params: any): string {
  const keys = ['query', this.itemType, queryType];
  if (params) {
    const paramStr = JSON.stringify(normalized(params), sortedKeys);
    keys.push(paramStr);
  }
  return keys.join(':');
}
```

**Result**: Each unique query creates a separate cache entry. **No clobbering possible!**

### IndexedDB Integration

- **Persistent Storage**: Data survives browser restarts
- **Large Capacity**: Hundreds of MB storage available
- **Structured Data**: Can store complex objects natively
- **Asynchronous Operations**: Non-blocking cache operations

## Observing Cache Behavior

### Browser Developer Tools

1. **Console Logs**: Two Layer Cache debug messages
2. **Application Tab**: IndexedDB storage inspection
3. **Network Tab**: API request timing comparison

### Testing Scenarios

1. **TTL Expiration Test**:
   - Execute selective query → wait 1+ minutes → execute again
   - Should see cache miss on second request

2. **Query Distinction Test**:
   - Execute "All Widgets" → execute "Active Widgets"
   - Should see separate cache entries with different TTLs

3. **Cache Invalidation Test** (via API):
   - Execute queries → create/update widget → execute same queries
   - Should see cache invalidation and fresh results

## Files Created/Modified

### New Files:
- `src/routes/cacheRoutes.ts` - Cache demo API endpoints
- `src/client/components/CacheDemo.tsx` - Frontend demo component
- `src/app/cache-demo/page.tsx` - Next.js page wrapper
- `TWO_LAYER_CACHE_DEMO.md` - This documentation

### Modified Files:
- `src/client/cache/WidgetCache.ts` - Enabled Two Layer Cache
- `src/client/cache/WidgetTypeCache.ts` - Enabled Two Layer Cache
- `src/routes/index.ts` - Added cache routes
- `src/index.ts` - Updated API info
- `src/app/layout.tsx` - Added navigation

## Troubleshooting

### If Cache Demo Doesn't Load:
1. Ensure all dependencies are installed: `npm install`
2. Check browser console for errors
3. Verify server is running on correct port
4. Clear browser cache and IndexedDB storage

### If Queries Don't Show Cache Behavior:
1. Check browser console for Two Layer Cache debug logs
2. Verify endpoints are returning data
3. Test with different time intervals
4. Use "Clear All Caches" button to reset

### For Development:
1. Enable debug logging in cache configuration
2. Check network timing in browser dev tools
3. Inspect IndexedDB contents in Application tab
4. Monitor server logs for API request patterns

## Next Steps

This demo provides a foundation for:
1. **Performance Testing**: Measure cache hit ratios and timing improvements
2. **Cache Strategy Tuning**: Adjust TTL values based on usage patterns
3. **Advanced Features**: Add cache warming, background refresh, etc.
4. **Monitoring**: Implement cache metrics collection and reporting

The implementation demonstrates that the Two Layer Cache is fully functional and provides significant benefits for preventing cache poisoning while maintaining performance.
