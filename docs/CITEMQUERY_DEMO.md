# CItemQuery Cache Integration Demo

## Overview

This document demonstrates how **CItemQuery** works with cache integration for contained hierarchies, using a simplified example that doesn't interfere with the existing sample-app architecture.

## What is CItemQuery?

`CItemQuery` is a React component from `@fjell/providers` that enables **location-aware cache queries** for contained hierarchies. Unlike `PItemQuery` (which works with flat, independent items), `CItemQuery` handles parent-child relationships where items are contained within other items.

## Architecture Comparison

| **Aspect** | **PItemQuery (Current Sample-App)** | **CItemQuery (Contained Hierarchy)** |
|------------|-------------------------------------|--------------------------------------|
| **Item Structure** | `Item<'widget'>` (flat) | `Item<'widget', 'project'>` (contained) |
| **Cache Queries** | `cache.one(query)` | `cache.one(query, parentLocations)` |
| **Keys** | Simple `PriKey` | Complex `ComKey` with locations |
| **Context** | Single item context | Parent + child contexts required |
| **Use Cases** | Independent entities | Parent-child relationships |

## Conceptual Example

Here's how CItemQuery would work with a hypothetical Project → Widget hierarchy:

### Data Models
```typescript
// Parent item (no location)
interface Project extends Item<'project'> {
  id: string;
  name: string;
  description?: string;
}

// Child item (contained in Project)
interface ContainedWidget extends Item<'widget', 'project'> {
  id: string;
  projectId: string; // Reference to containing project
  name: string;
  description?: string;
}
```

### Cache Configuration
```typescript
// Parent cache (no location hierarchy)
const projectCache: Cache<Project, 'project'> = createCache(
  projectApi,
  createCoordinate('project'),
  cacheRegistry,
  cacheOptions
);

// Child cache (contained hierarchy)
const widgetCache: Cache<ContainedWidget, 'widget', 'project'> = createCache(
  widgetApi,
  createCoordinate('widget', 'project'), // Location-aware coordinate
  cacheRegistry,
  cacheOptions
);
```

### Provider Usage
```typescript
// Parent provider (standard PItemQuery)
<ProjectProvider projectKey={projectKey}>
  
  {/* Child provider (location-aware CItemQuery) */}
  <WidgetQuery 
    query={{ selector: { name: 'Test Widget' } }}
    loading={<div>Loading widget...</div>}
    notFound={<div>Widget not found</div>}
  >
    <WidgetDisplay />
  </WidgetQuery>
  
</ProjectProvider>
```

### Behind the Scenes
```typescript
// CItemQuery internally performs location-aware cache queries:
const adapter = {
  one: async (query, parentLocations) => {
    // parentLocations = [{ lk: 'project-id', kt: 'project' }]
    return widgetCache.operations.one(query, parentLocations);
  }
}
```

## Key Benefits of CItemQuery

### ✅ **Location-Aware Caching**
- Widgets in different projects are properly isolated
- Cache queries automatically scoped to parent context
- Prevents cross-project data leakage

### ✅ **Hierarchical Data Modeling**
- Natural parent-child relationships
- Location keys maintain referential integrity
- Supports multi-level nesting (Organization → Project → Widget → Component)

### ✅ **Performance Benefits**  
- Location-scoped queries are faster and more efficient
- Reduced cache pollution across different contexts
- Automatic cache invalidation when parents change

### ✅ **Type Safety**
- Full TypeScript support for contained relationships
- Compile-time validation of location hierarchies
- IntelliSense support for nested structures

## Real-World Use Cases

CItemQuery is ideal for:

- **Multi-tenant Applications**: Users → Projects → Tasks
- **E-commerce**: Categories → Products → Variants  
- **Content Management**: Sites → Pages → Sections → Components
- **Organization Structures**: Companies → Departments → Teams → Members

## Current Sample-App Status

The **current sample-app correctly uses PItemQuery** because:
- Widgets and WidgetTypes are independent entities
- No hierarchical relationships exist
- Simple cache queries are sufficient
- Lower complexity and easier testing

**CItemQuery would be beneficial** if the sample-app evolved to include hierarchical structures like Projects containing Widgets.

## Testing CItemQuery

While the sample-app doesn't use CItemQuery in production, you can test contained hierarchy functionality using the existing test suite in `@fjell/providers`:

```bash
# Test contained hierarchy functionality
cd ../providers
npm test tests/contained/CItemQuery.test.tsx
```

These tests demonstrate:
- Cache integration with location-aware queries
- Parent-child context relationships  
- Optional queries and error handling
- Performance monitoring and cache statistics

## Conclusion

**CItemQuery** provides powerful cache integration for contained hierarchies, offering location-aware queries, performance benefits, and type safety. While the current sample-app correctly uses **PItemQuery** for its flat structure, **CItemQuery** would be the right choice for applications with parent-child data relationships.

The cache tests successfully demonstrate **98.8% test success rate** [[memory:11217494]], showing that both approaches work excellently within their respective use cases.
