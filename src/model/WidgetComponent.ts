import { Item } from '@fjell/core';

/**
 * WidgetComponent represents a component of a widget
 * This entity is used for testing composite relationships and cache consistency
 */
export interface WidgetComponent extends Item<'widgetComponent', 'widget'> {
  id: string;
  widgetId: string; // Foreign key to Widget
  componentTypeId: string; // Reference to component type
  name: string;
  status: 'pending' | 'active' | 'complete';
  priority: number;
  config?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

/**
 * Properties for creating a new WidgetComponent (without the key and events)
 */
export interface WidgetComponentProperties {
  widgetId: string;
  componentTypeId: string;
  name: string;
  status?: 'pending' | 'active' | 'complete';
  priority?: number;
  config?: Record<string, any>;
}

