import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import express from 'express';
import { TestDatabase } from '../helpers/testDatabase';
import { TestFixtures } from '../helpers/testFixtures';
import { createWidgetRouter } from '../../src/routes/widgetRoutes';

describe('Widget Routes (Simplified)', () => {
  let app: express.Application;
  let testDb: TestDatabase;
  let testWidgetType: any;
  let widgetLib: any;

  beforeEach(async () => {
    testDb = await TestDatabase.createFresh();
    const libraries = testDb.getLibraries();
    widgetLib = libraries.widget;

    // Create a test widget type for our tests
    testWidgetType = await testDb.createWidgetType(
      TestFixtures.createWidgetTypeProperties({
        code: 'SIMPLE_TEST_TYPE',
        name: 'Simple Test Widget Type'
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
      const widget1 = await testDb.createWidget(
        TestFixtures.createWidgetProperties(testWidgetType.id, { name: 'Widget 1' })
      );
      const widget2 = await testDb.createWidget(
        TestFixtures.createWidgetProperties(testWidgetType.id, { name: 'Widget 2' })
      );

      const response = await request(app)
        .get('/widgets')
        .expect(200);

      expect(response.body).toMatchObject({ success: true, data: expect.any(Array) });
      const ourWidgets = response.body.data.filter((w: any) =>
        [widget1.id, widget2.id].includes(w.id)
      );
      expect(ourWidgets).toHaveLength(2);
    });

    it('should return empty array when no widgets exist', async () => {
      const response = await request(app)
        .get('/widgets')
        .expect(200);

      expect(response.body).toMatchObject({ success: true, data: [] });
    });
  });

  describe('GET /widgets with finders', () => {
    it('should return only active widgets', async () => {
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

      expect(response.body).toMatchObject({ success: true, data: expect.any(Array) });
      const foundActive = response.body.data.find((w: any) => w.id === activeWidget.id);
      const foundInactive = response.body.data.find((w: any) => w.id === inactiveWidget.id);

      expect(foundActive).toBeDefined();
      expect(foundInactive).toBeUndefined();
    });

    it('should return widgets of specific type', async () => {
      const otherWidgetType = await testDb.createWidgetType(
        TestFixtures.createWidgetTypeProperties({
          code: 'OTHER_TYPE',
          name: 'Other Widget Type'
        })
      );

      const widget1 = await testDb.createWidget(
        TestFixtures.createWidgetProperties(testWidgetType.id, { name: 'Type 1 Widget' })
      );

      const widget2 = await testDb.createWidget(
        TestFixtures.createWidgetProperties(otherWidgetType.id, { name: 'Type 2 Widget' })
      );

      const response = await request(app)
        .get(`/widgets?finder=byType&finderParams=${JSON.stringify({ widgetTypeId: testWidgetType.id })}`)
        .expect(200);

      expect(response.body).toMatchObject({ success: true, data: expect.any(Array) });
      const foundWidget1 = response.body.data.find((w: any) => w.id === widget1.id);
      const foundWidget2 = response.body.data.find((w: any) => w.id === widget2.id);

      expect(foundWidget1).toBeDefined();
      expect(foundWidget2).toBeUndefined();
    });

    it('should return empty array for non-existent widget type', async () => {
      const response = await request(app)
        .get('/widgets?finder=byType&finderParams=' + JSON.stringify({ widgetTypeId: 'non-existent-id' }))
        .expect(200);

      expect(response.body).toMatchObject({ success: true, data: [] });
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
        name: 'New Widget',
        description: 'A newly created widget',
        widgetTypeId: testWidgetType.id,
        isActive: true,
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
      const response = await request(app)
        .post('/widgets')
        .send({ name: 'Widget without type', isActive: true })
        .expect(400);

      expect(response.body).toMatchObject({
        error: expect.any(String)
      });
    });
  });

  describe('PUT /widgets/:id', () => {
    it('should update widget', async () => {
      const widget = await testDb.createWidget(
        TestFixtures.createWidgetProperties(testWidgetType.id, {
          name: 'Original Widget',
          description: 'Original description'
        })
      );

      const updateData = {
        name: 'Updated Widget',
        description: 'Updated description',
        isActive: false
      };

      const response = await request(app)
        .put(`/widgets/${widget.id}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          id: widget.id,
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
        .expect(404); // Route returns 404 for not found widgets

      expect(response.body).toMatchObject({
        error: expect.any(String)
      });
    });
  });

  describe('DELETE /widgets/:id', () => {
    it('should delete widget', async () => {
      const widget = await testDb.createWidget(
        TestFixtures.createWidgetProperties(testWidgetType.id, {
          name: 'Widget to Delete'
        })
      );

      const response = await request(app)
        .delete(`/widgets/${widget.id}`)
        .expect(200);

      // Route returns success message
      expect(response.body).toMatchObject({
        success: true,
        message: 'Widget deleted successfully'
      });
    });

    it('should return 404 for non-existent widget', async () => {
      const response = await request(app)
        .delete('/widgets/non-existent-id')
        .expect(404); // Route returns 404 for not found widgets

      expect(response.body).toMatchObject({
        error: expect.any(String)
      });
    });
  });
});
