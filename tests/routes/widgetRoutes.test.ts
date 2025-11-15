import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createWidgetRouter } from '../../src/routes/widgetRoutes';
import { TestDatabase, TestFixtures } from '../helpers';
import express from 'express';
import request from 'supertest';

describe('Widget Routes', () => {
  let testDb: TestDatabase;
  let app: express.Application;
  let widgetLib: any;
  let widgetTypeLib: any;
  let testWidgetType: any;

  beforeEach(async () => {
    testDb = await TestDatabase.createWithData();
    const libraries = testDb.getLibraries();
    widgetLib = libraries.widget;
    widgetTypeLib = libraries.widgetType;

    // Create a test widget type for our tests
    testWidgetType = await testDb.createWidgetType(
      TestFixtures.createWidgetTypeProperties({
        code: 'ROUTE_TEST_TYPE',
        name: 'Route Test Widget Type'
      })
    );

    // Create Express app with widget routes
    app = express();
    app.use(express.json());
    app.use('/widgets', createWidgetRouter(widgetLib));
  });

  afterEach(async () => {
    if (testDb) {
      await testDb.cleanup();
    }
  });

  describe('GET /widgets', () => {
    it('should return all widgets', async () => {
      // Create test widgets
      const widget1 = await testDb.createWidget(
        TestFixtures.createWidgetProperties(testWidgetType.id, { name: 'Widget 1' })
      );
      const widget2 = await testDb.createWidget(
        TestFixtures.createWidgetProperties(testWidgetType.id, { name: 'Widget 2' })
      );

      const response = await request(app)
        .get('/widgets')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: expect.any(Array)
      });

      const ourWidgets = response.body.data.filter((w: any) =>
        [widget1.id, widget2.id].includes(w.id)
      );
      expect(ourWidgets).toHaveLength(2);
    });

    it('should return empty array when no widgets exist', async () => {
      // Clear all widgets from database
      await testDb.clearData();

      const response = await request(app)
        .get('/widgets')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: []
      });
    });
  });

  describe('GET /widgets/active', () => {
    it('should return only active widgets', async () => {
      // Create active and inactive widgets
      const activeWidget = await testDb.createWidget(
        TestFixtures.createWidgetProperties(testWidgetType.id, {
          name: 'Active Widget',
          isActive: true
        })
      );

      const inactiveWidget = await testDb.createWidget(
        TestFixtures.createWidgetProperties(testWidgetType.id, {
          name: 'Inactive Widget',
          isActive: false
        })
      );

      const response = await request(app)
        .get('/widgets?finder=active&finderParams={}')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: expect.any(Array)
      });

      const activeWidgets = response.body.data;
      const foundActive = activeWidgets.find((w: any) => w.id === activeWidget.id);
      const foundInactive = activeWidgets.find((w: any) => w.id === inactiveWidget.id);

      expect(foundActive).toBeDefined();
      expect(foundInactive).toBeUndefined();
    });
  });

  describe('GET /widgets/by-type/:widgetTypeId', () => {
    it('should return widgets of specific type', async () => {
      // Create another widget type
      const otherWidgetType = await testDb.createWidgetType(
        TestFixtures.createWidgetTypeProperties({
          code: 'OTHER_TYPE',
          name: 'Other Widget Type'
        })
      );

      // Create widgets of both types
      const widget1 = await testDb.createWidget(
        TestFixtures.createWidgetProperties(testWidgetType.id, { name: 'Type 1 Widget' })
      );

      const widget2 = await testDb.createWidget(
        TestFixtures.createWidgetProperties(otherWidgetType.id, { name: 'Type 2 Widget' })
      );

      const response = await request(app)
        .get(`/widgets?finder=byType&finderParams=${JSON.stringify({ widgetTypeId: testWidgetType.id })}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: expect.any(Array)
      });

      const typeWidgets = response.body.data;
      const foundWidget1 = typeWidgets.find((w: any) => w.id === widget1.id);
      const foundWidget2 = typeWidgets.find((w: any) => w.id === widget2.id);

      expect(foundWidget1).toBeDefined();
      expect(foundWidget2).toBeUndefined();
    });

    it('should return empty array for non-existent widget type', async () => {
      const response = await request(app)
        .get('/widgets?finder=byType&finderParams=' + JSON.stringify({ widgetTypeId: 'non-existent-id' }))
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: []
      });
    });
  });

  describe('GET /widgets/:id', () => {
    it('should return specific widget', async () => {
      const widget = await testDb.createWidget(
        TestFixtures.createWidgetProperties(testWidgetType.id, {
          name: 'Specific Widget',
          description: 'A specific widget for testing'
        })
      );

      const response = await request(app)
        .get(`/widgets/${widget.id}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          id: widget.id,
          name: 'Specific Widget',
          description: 'A specific widget for testing',
          widgetTypeId: testWidgetType.id,
          isActive: true
        }
      });
    });

    it('should return 404 for non-existent widget', async () => {
      const response = await request(app)
        .get('/widgets/non-existent-id')
        .expect(404);

      expect(response.body).toMatchObject({
        success: false,
        error: expect.any(String)
      });
    });
  });

  describe('POST /widgets', () => {
    it('should create new widget', async () => {
      const widgetData = {
        widgetTypeId: testWidgetType.id,
        name: 'New Widget',
        description: 'A newly created widget',
        data: { test: 'value' }
      };

      const response = await request(app)
        .post('/widgets')
        .send(widgetData)
        .expect(201);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          id: expect.any(String),
          name: 'New Widget',
          description: 'A newly created widget',
          widgetTypeId: testWidgetType.id,
          isActive: true,
          data: { test: 'value' }
        }
      });
    });

    it('should validate required fields', async () => {
      const invalidData = {
        name: 'Widget without type'
        // Missing widgetTypeId
      };

      const response = await request(app)
        .post('/widgets')
        .send(invalidData)
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: expect.any(String)
      });
    });

    it('should validate widget type exists', async () => {
      const invalidData = {
        widgetTypeId: 'non-existent-type-id',
        name: 'Invalid Widget'
      };

      const response = await request(app)
        .post('/widgets')
        .send(invalidData)
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: expect.stringContaining('Create Validation Failed')
      });
    });

    it('should validate widget type is active', async () => {
      // Create inactive widget type
      const inactiveType = await testDb.createWidgetType(
        TestFixtures.createWidgetTypeProperties({
          code: 'INACTIVE_TYPE',
          name: 'Inactive Type',
          isActive: false
        })
      );

      const invalidData = {
        widgetTypeId: inactiveType.id,
        name: 'Widget for inactive type'
      };

      const response = await request(app)
        .post('/widgets')
        .send(invalidData)
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: expect.stringContaining('Create Validation Failed')
      });
    });
  });

  describe('PUT /widgets/:id', () => {
    let testWidget: any;

    beforeEach(async () => {
      testWidget = await testDb.createWidget(
        TestFixtures.createWidgetProperties(testWidgetType.id, {
          name: 'Test Widget',
          description: 'Original description'
        })
      );
    });

    it('should update widget', async () => {
      const updateData = {
        name: 'Updated Widget',
        description: 'Updated description',
        isActive: false
      };

      const response = await request(app)
        .put(`/widgets/${testWidget.id}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          id: testWidget.id,
          name: 'Updated Widget',
          description: 'Updated description',
          isActive: false
        }
      });
    });

    it('should return 404 for non-existent widget', async () => {
      const updateData = { name: 'Updated Name' };

      const response = await request(app)
        .put('/widgets/non-existent-id')
        .send(updateData)
        .expect(404);

      expect(response.body).toMatchObject({
        success: false,
        error: expect.any(String)
      });
    });

    it('should handle partial updates', async () => {
      const updateData = { name: 'Partially Updated Widget' };

      const response = await request(app)
        .put(`/widgets/${testWidget.id}`)
        .send(updateData)
        .expect(200);

      expect(response.body.data.name).toBe('Partially Updated Widget');
      expect(response.body.data.description).toBe('Original description'); // Should remain unchanged
    });
  });

  describe('DELETE /widgets/:id', () => {
    let testWidget: any;

    beforeEach(async () => {
      testWidget = await testDb.createWidget(
        TestFixtures.createWidgetProperties(testWidgetType.id, {
          name: 'Widget to Delete'
        })
      );
    });

    it('should delete widget', async () => {
      const response = await request(app)
        .delete(`/widgets/${testWidget.id}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: expect.any(String)
      });

      // Verify widget is deleted
      const getResponse = await request(app)
        .get(`/widgets/${testWidget.id}`)
        .expect(404);
    });

    it('should return 404 for non-existent widget', async () => {
      const response = await request(app)
        .delete('/widgets/non-existent-id')
        .expect(404);

      expect(response.body).toMatchObject({
        success: false,
        error: expect.any(String)
      });
    });
  });

  describe('GET /widgets/summary', () => {
    it('should return widget summary statistics', async () => {
      // Create test widgets with different statuses and types
      await testDb.createWidget(
        TestFixtures.createWidgetProperties(testWidgetType.id, { isActive: true })
      );
      await testDb.createWidget(
        TestFixtures.createWidgetProperties(testWidgetType.id, { isActive: false })
      );

      const response = await request(app)
        .get('/widgets/summary')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          total: expect.any(Number),
          active: expect.any(Number),
          inactive: expect.any(Number),
          byType: expect.any(Object)
        }
      });

      expect(response.body.data.total).toBeGreaterThanOrEqual(2);
      expect(response.body.data.active).toBeGreaterThanOrEqual(1);
      expect(response.body.data.inactive).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      // Mock library operations to throw error
      const originalGet = widgetLib.operations.get;
      widgetLib.operations.get = () => {
        throw new Error('Database connection failed');
      };

      const response = await request(app)
        .get('/widgets/some-id')
        .expect(500);

      expect(response.body).toMatchObject({
        success: false,
        error: expect.any(String)
      });

      // Restore original function
      widgetLib.operations.get = originalGet;
    });

    it('should handle invalid JSON in request body', async () => {
      const response = await request(app)
        .post('/widgets')
        .set('Content-Type', 'application/json')
        .send('{ invalid json }')
        .expect(400);

      expect(response.status).toBe(400);
    });
  });

  describe('Validation Edge Cases', () => {
    it('should handle empty request body', async () => {
      const response = await request(app)
        .post('/widgets')
        .send({})
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: expect.any(String)
      });
    });

    it('should handle null values in request', async () => {
      const nullData = {
        widgetTypeId: testWidgetType.id,
        name: 'Test Widget',
        description: null,
        data: null
      };

      const response = await request(app)
        .post('/widgets')
        .send(nullData)
        .expect(201);

      expect(response.body.data.description).toBe(null);
      expect(response.body.data.data).toBe(null);
    });

    it('should validate widget name length', async () => {
      const longNameData = {
        widgetTypeId: testWidgetType.id,
        name: 'A'.repeat(256) // Too long
      };

      const response = await request(app)
        .post('/widgets')
        .send(longNameData)
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: expect.stringContaining('Create Validation Failed')
      });
    });
  });

  describe('Middleware and Logging', () => {
    it('should handle requests with query parameters', async () => {
      const response = await request(app)
        .get('/widgets?active=true&limit=10')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: expect.any(Array)
      });
    });

    it('should handle requests with custom headers', async () => {
      const response = await request(app)
        .get('/widgets')
        .set('X-Custom-Header', 'test-value')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: expect.any(Array)
      });
    });
  });
});
