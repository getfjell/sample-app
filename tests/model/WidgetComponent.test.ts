import { describe, it, expect } from 'vitest';
import type { WidgetComponent, WidgetComponentProperties } from '../../src/model/WidgetComponent';
import type { ComKey } from '@fjell/core';

describe('WidgetComponent Model', () => {
  describe('Interface Validation', () => {
    it('should define correct interface structure', () => {
      const widgetComponent: WidgetComponent = {
        key: {
          kt: 'widgetComponent',
          pk: 'component-1',
          loc: [{ kt: 'widget', lk: 'widget-1' }]
        } as ComKey<'widgetComponent', 'widget'>,
        id: 'component-1',
        widgetId: 'widget-1',
        componentTypeId: 'TYPE-A',
        name: 'Test Component',
        status: 'pending',
        priority: 50,
        config: { setting: 'value' },
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        events: {
          created: {
            at: new Date('2024-01-01'),
            by: 'system'
          },
          updated: {
            at: new Date('2024-01-01'),
            by: 'system'
          }
        }
      };

      expect(widgetComponent.id).toBe('component-1');
      expect(widgetComponent.widgetId).toBe('widget-1');
      expect(widgetComponent.componentTypeId).toBe('TYPE-A');
      expect(widgetComponent.status).toBe('pending');
      expect(widgetComponent.priority).toBe(50);
    });

    it('should support all valid status values', () => {
      const statuses: Array<'pending' | 'active' | 'complete'> = ['pending', 'active', 'complete'];
      
      statuses.forEach(status => {
        const component: WidgetComponent = {
          key: {
            kt: 'widgetComponent',
            pk: 'comp-1',
            loc: [{ kt: 'widget', lk: 'widget-1' }]
          } as ComKey<'widgetComponent', 'widget'>,
          id: 'comp-1',
          widgetId: 'widget-1',
          componentTypeId: 'TYPE-A',
          name: 'Test Component',
          status,
          priority: 0,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
          events: {
            created: { at: new Date(), by: 'system' },
            updated: { at: new Date(), by: 'system' }
          }
        };

        expect(component.status).toBe(status);
      });
    });

    it('should validate priority range', () => {
      const priorities = [0, 25, 50, 75, 100];
      
      priorities.forEach(priority => {
        const component: WidgetComponent = {
          key: {
            kt: 'widgetComponent',
            pk: 'comp-1',
            loc: [{ kt: 'widget', lk: 'widget-1' }]
          } as ComKey<'widgetComponent', 'widget'>,
          id: 'comp-1',
          widgetId: 'widget-1',
          componentTypeId: 'TYPE-A',
          name: 'Test Component',
          status: 'pending',
          priority,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
          events: {
            created: { at: new Date(), by: 'system' },
            updated: { at: new Date(), by: 'system' }
          }
        };

        expect(component.priority).toBe(priority);
        expect(component.priority).toBeGreaterThanOrEqual(0);
        expect(component.priority).toBeLessThanOrEqual(100);
      });
    });
  });

  describe('WidgetComponentProperties', () => {
    it('should define correct properties interface', () => {
      const properties: WidgetComponentProperties = {
        widgetId: 'widget-1',
        componentTypeId: 'TYPE-A',
        name: 'Test Component',
        status: 'active',
        priority: 75,
        config: { enabled: true }
      };

      expect(properties.widgetId).toBe('widget-1');
      expect(properties.componentTypeId).toBe('TYPE-A');
      expect(properties.name).toBe('Test Component');
      expect(properties.status).toBe('active');
      expect(properties.priority).toBe(75);
      expect(properties.config).toEqual({ enabled: true });
    });

    it('should allow optional properties', () => {
      const minimalProperties: WidgetComponentProperties = {
        widgetId: 'widget-1',
        componentTypeId: 'TYPE-A',
        name: 'Minimal Component'
      };

      expect(minimalProperties.status).toBeUndefined();
      expect(minimalProperties.priority).toBeUndefined();
      expect(minimalProperties.config).toBeUndefined();
    });
  });

  describe('Composite Key Structure', () => {
    it('should have correct location hierarchy', () => {
      const component: WidgetComponent = {
        key: {
          kt: 'widgetComponent',
          pk: 'component-456',
          loc: [{ kt: 'widget', lk: 'widget-123' }]
        } as ComKey<'widgetComponent', 'widget'>,
        id: 'component-456',
        widgetId: 'widget-123',
        componentTypeId: 'TYPE-A',
        name: 'Test Component',
        status: 'pending',
        priority: 0,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        events: {
          created: { at: new Date(), by: 'system' },
          updated: { at: new Date(), by: 'system' }
        }
      };

      expect(component.key.loc).toHaveLength(1);
      expect(component.key.loc[0].kt).toBe('widget');
      expect(component.key.loc[0].lk).toBe('widget-123');
    });
  });
});

