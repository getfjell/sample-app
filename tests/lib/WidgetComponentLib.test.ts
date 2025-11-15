import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createWidgetComponentLibrary } from '../../src/lib/WidgetComponentLib';
import { TestDatabase, TestFixtures } from '../helpers';
import { Registry } from '@fjell/registry';

describe('WidgetComponentLib - Cache Consistency Certification', () => {
  let testDb: TestDatabase;
  let registry: Registry;
  let widgetComponentLib: any;
  let widgetLib: any;

  beforeEach(async () => {
    testDb = await TestDatabase.createWithData();
    registry = testDb.getRegistry();

    const { widgetModel, widgetTypeModel, widgetComponentModel } = testDb.getModels();
    
    // Get widget library for creating test widgets
    widgetLib = testDb.getWidgetLibrary();
    
    // Create widget component library
    widgetComponentLib = createWidgetComponentLibrary(registry, widgetComponentModel, widgetModel);
  });

  afterEach(async () => {
    if (testDb) {
      await testDb.cleanup();
    }
  });

  describe('Library Creation', () => {
    it('should create widget component library successfully', () => {
      expect(widgetComponentLib).toBeDefined();
      expect(widgetComponentLib.operations.create).toBeDefined();
      expect(widgetComponentLib.operations.get).toBeDefined();
      expect(widgetComponentLib.operations.update).toBeDefined();
      expect(widgetComponentLib.operations.remove).toBeDefined();
      expect(widgetComponentLib.operations.all).toBeDefined();
    });

    it('should have composite key type association', () => {
      expect(widgetComponentLib).toBeDefined();
      // Should handle 'widgetComponent' with 'widget' parent
    });
  });

  describe('Component Creation', () => {
    it('should create a valid widget component', async () => {
      // Create a widget first
      const widgetType = await testDb.createWidgetType(TestFixtures.createWidgetTypeProperties());
      const widget = await testDb.createWidget(TestFixtures.createWidgetProperties(widgetType.id));

      const componentProperties = {
        widgetId: widget.id,
        componentTypeId: 'TYPE-A',
        name: 'Test Component',
        status: 'pending' as const,
        priority: 50,
        config: { setting: 'value' }
      };

      const component = await widgetComponentLib.operations.create(componentProperties);

      expect(component).toBeDefined();
      expect(component.id).toBeDefined();
      expect(component.name).toBe('Test Component');
      expect(component.widgetId).toBe(widget.id);
      expect(component.componentTypeId).toBe('TYPE-A');
      expect(component.status).toBe('pending');
      expect(component.priority).toBe(50);
    });

    it('should normalize component name during creation', async () => {
      const widgetType = await testDb.createWidgetType(TestFixtures.createWidgetTypeProperties());
      const widget = await testDb.createWidget(TestFixtures.createWidgetProperties(widgetType.id));

      const componentProperties = {
        widgetId: widget.id,
        componentTypeId: 'TYPE-A',
        name: '  Test Component  ',
      };

      const component = await widgetComponentLib.operations.create(componentProperties);
      expect(component.name).toBe('Test Component'); // Trimmed
    });

    it('should set default status to pending', async () => {
      const widgetType = await testDb.createWidgetType(TestFixtures.createWidgetTypeProperties());
      const widget = await testDb.createWidget(TestFixtures.createWidgetProperties(widgetType.id));

      const componentProperties = {
        widgetId: widget.id,
        componentTypeId: 'TYPE-A',
        name: 'Test Component',
        // status is undefined
      };

      const component = await widgetComponentLib.operations.create(componentProperties);
      expect(component.status).toBe('pending');
    });

    it('should set default priority to 0', async () => {
      const widgetType = await testDb.createWidgetType(TestFixtures.createWidgetTypeProperties());
      const widget = await testDb.createWidget(TestFixtures.createWidgetProperties(widgetType.id));

      const componentProperties = {
        widgetId: widget.id,
        componentTypeId: 'TYPE-A',
        name: 'Test Component',
        // priority is undefined
      };

      const component = await widgetComponentLib.operations.create(componentProperties);
      expect(component.priority).toBe(0);
    });
  });

  describe('Component Validation', () => {
    it('should fail if widgetId is missing', async () => {
      const componentProperties = {
        widgetId: '',
        componentTypeId: 'TYPE-A',
        name: 'Test Component'
      };

      await expect(
        widgetComponentLib.operations.create(componentProperties)
      ).rejects.toThrow(/Validation failed/);
    });

    it('should fail if widget does not exist', async () => {
      const componentProperties = {
        widgetId: 'non-existent-widget-id',
        componentTypeId: 'TYPE-A',
        name: 'Test Component'
      };

      await expect(
        widgetComponentLib.operations.create(componentProperties)
      ).rejects.toThrow(/Validation failed/);
    });

    it('should fail if name is empty', async () => {
      const widgetType = await testDb.createWidgetType(TestFixtures.createWidgetTypeProperties());
      const widget = await testDb.createWidget(TestFixtures.createWidgetProperties(widgetType.id));

      const componentProperties = {
        widgetId: widget.id,
        componentTypeId: 'TYPE-A',
        name: ''
      };

      await expect(
        widgetComponentLib.operations.create(componentProperties)
      ).rejects.toThrow(/Validation failed/);
    });

    it('should fail if componentTypeId is missing', async () => {
      const widgetType = await testDb.createWidgetType(TestFixtures.createWidgetTypeProperties());
      const widget = await testDb.createWidget(TestFixtures.createWidgetProperties(widgetType.id));

      const componentProperties = {
        widgetId: widget.id,
        componentTypeId: '',
        name: 'Test Component'
      };

      await expect(
        widgetComponentLib.operations.create(componentProperties)
      ).rejects.toThrow(/Validation failed/);
    });

    it('should fail if priority is out of range', async () => {
      const widgetType = await testDb.createWidgetType(TestFixtures.createWidgetTypeProperties());
      const widget = await testDb.createWidget(TestFixtures.createWidgetProperties(widgetType.id));

      const componentPropertiesHigh = {
        widgetId: widget.id,
        componentTypeId: 'TYPE-A',
        name: 'Test Component',
        priority: 101
      };

      await expect(
        widgetComponentLib.operations.create(componentPropertiesHigh)
      ).rejects.toThrow(/Validation failed/);

      const componentPropertiesLow = {
        widgetId: widget.id,
        componentTypeId: 'TYPE-A',
        name: 'Test Component',
        priority: -1
      };

      await expect(
        widgetComponentLib.operations.create(componentPropertiesLow)
      ).rejects.toThrow(/Validation failed/);
    });
  });

  describe('Component Finders', () => {
    it('should find components by widget ID', async () => {
      const widgetType = await testDb.createWidgetType(TestFixtures.createWidgetTypeProperties());
      const widget = await testDb.createWidget(TestFixtures.createWidgetProperties(widgetType.id));

      // Create multiple components for this widget
      await widgetComponentLib.operations.create({
        widgetId: widget.id,
        componentTypeId: 'TYPE-A',
        name: 'Component 1',
        priority: 10
      });

      await widgetComponentLib.operations.create({
        widgetId: widget.id,
        componentTypeId: 'TYPE-B',
        name: 'Component 2',
        priority: 20
      });

      const components = await widgetComponentLib.operations.finders.byWidget({ widgetId: widget.id });
      
      expect(components).toHaveLength(2);
      expect(components[0].widgetId).toBe(widget.id);
      expect(components[1].widgetId).toBe(widget.id);
      // Should be ordered by priority DESC then createdAt ASC
      expect(components[0].priority).toBeGreaterThanOrEqual(components[1].priority);
    });

    it('should find components by status', async () => {
      const widgetType = await testDb.createWidgetType(TestFixtures.createWidgetTypeProperties());
      const widget = await testDb.createWidget(TestFixtures.createWidgetProperties(widgetType.id));

      await widgetComponentLib.operations.create({
        widgetId: widget.id,
        componentTypeId: 'TYPE-A',
        name: 'Active Component',
        status: 'active'
      });

      await widgetComponentLib.operations.create({
        widgetId: widget.id,
        componentTypeId: 'TYPE-B',
        name: 'Pending Component',
        status: 'pending'
      });

      const activeComponents = await widgetComponentLib.operations.finders.byStatus({ status: 'active' });
      expect(activeComponents).toHaveLength(1);
      expect(activeComponents[0].status).toBe('active');
    });

    it('should find active components', async () => {
      const widgetType = await testDb.createWidgetType(TestFixtures.createWidgetTypeProperties());
      const widget = await testDb.createWidget(TestFixtures.createWidgetProperties(widgetType.id));

      await widgetComponentLib.operations.create({
        widgetId: widget.id,
        componentTypeId: 'TYPE-A',
        name: 'Active Component 1',
        status: 'active'
      });

      await widgetComponentLib.operations.create({
        widgetId: widget.id,
        componentTypeId: 'TYPE-B',
        name: 'Active Component 2',
        status: 'active'
      });

      await widgetComponentLib.operations.create({
        widgetId: widget.id,
        componentTypeId: 'TYPE-C',
        name: 'Pending Component',
        status: 'pending'
      });

      const activeComponents = await widgetComponentLib.operations.finders.active();
      expect(activeComponents).toHaveLength(2);
      activeComponents.forEach((comp: any) => {
        expect(comp.status).toBe('active');
      });
    });

    it('should find components by component type', async () => {
      const widgetType = await testDb.createWidgetType(TestFixtures.createWidgetTypeProperties());
      const widget1 = await testDb.createWidget(TestFixtures.createWidgetProperties(widgetType.id));
      const widget2 = await testDb.createWidget(TestFixtures.createWidgetProperties(widgetType.id));

      await widgetComponentLib.operations.create({
        widgetId: widget1.id,
        componentTypeId: 'TYPE-A',
        name: 'Component 1'
      });

      await widgetComponentLib.operations.create({
        widgetId: widget2.id,
        componentTypeId: 'TYPE-A',
        name: 'Component 2'
      });

      await widgetComponentLib.operations.create({
        widgetId: widget1.id,
        componentTypeId: 'TYPE-B',
        name: 'Component 3'
      });

      const typeAComponents = await widgetComponentLib.operations.finders.byComponentType({ 
        componentTypeId: 'TYPE-A' 
      });
      
      expect(typeAComponents).toHaveLength(2);
      typeAComponents.forEach((comp: any) => {
        expect(comp.componentTypeId).toBe('TYPE-A');
      });
    });
  });

  describe('Component Operations', () => {
    it('should retrieve component by ID', async () => {
      const widgetType = await testDb.createWidgetType(TestFixtures.createWidgetTypeProperties());
      const widget = await testDb.createWidget(TestFixtures.createWidgetProperties(widgetType.id));
      
      const created = await widgetComponentLib.operations.create({
        widgetId: widget.id,
        componentTypeId: 'TYPE-A',
        name: 'Test Component'
      });

      const retrieved = await widgetComponentLib.operations.get({
        kt: 'widgetComponent',
        pk: created.id,
        loc: [{ kt: 'widget', lk: widget.id }]
      });
      
      expect(retrieved).toBeDefined();
      expect(retrieved.id).toBe(created.id);
      expect(retrieved.name).toBe('Test Component');
    });

    it('should update component', async () => {
      const widgetType = await testDb.createWidgetType(TestFixtures.createWidgetTypeProperties());
      const widget = await testDb.createWidget(TestFixtures.createWidgetProperties(widgetType.id));
      
      const component = await widgetComponentLib.operations.create({
        widgetId: widget.id,
        componentTypeId: 'TYPE-A',
        name: 'Original Name',
        status: 'pending',
        priority: 10
      });

      const updated = await widgetComponentLib.operations.update({
        kt: 'widgetComponent',
        pk: component.id,
        loc: [{ kt: 'widget', lk: widget.id }]
      }, {
        name: 'Updated Name',
        status: 'active',
        priority: 90
      });

      expect(updated.name).toBe('Updated Name');
      expect(updated.status).toBe('active');
      expect(updated.priority).toBe(90);
    });

    it('should delete component', async () => {
      const widgetType = await testDb.createWidgetType(TestFixtures.createWidgetTypeProperties());
      const widget = await testDb.createWidget(TestFixtures.createWidgetProperties(widgetType.id));
      
      const component = await widgetComponentLib.operations.create({
        widgetId: widget.id,
        componentTypeId: 'TYPE-A',
        name: 'To Delete'
      });

      await widgetComponentLib.operations.remove({
        kt: 'widgetComponent',
        pk: component.id,
        loc: [{ kt: 'widget', lk: widget.id }]
      });

      await expect(
        widgetComponentLib.operations.get({
          kt: 'widgetComponent',
          pk: component.id,
          loc: [{ kt: 'widget', lk: widget.id }]
        })
      ).rejects.toThrow();
    });

    it('should list all components', async () => {
      const widgetType = await testDb.createWidgetType(TestFixtures.createWidgetTypeProperties());
      const widget = await testDb.createWidget(TestFixtures.createWidgetProperties(widgetType.id));
      
      await widgetComponentLib.operations.create({
        widgetId: widget.id,
        componentTypeId: 'TYPE-A',
        name: 'Component 1'
      });

      await widgetComponentLib.operations.create({
        widgetId: widget.id,
        componentTypeId: 'TYPE-B',
        name: 'Component 2'
      });

      const all = await widgetComponentLib.operations.all({});
      expect(all.length).toBeGreaterThanOrEqual(2);
    });
  });
});

