import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createApiRoutes } from '../../src/routes/index';
import { TestDatabase, TestFixtures } from '../helpers';
import express from 'express';
import request from 'supertest';

describe('API Routes', () => {
  let testDb: TestDatabase;
  let app: express.Application;
  let widgetLib: any;
  let widgetTypeLib: any;

  beforeEach(async () => {
    testDb = await TestDatabase.createWithData();
    const libraries = testDb.getLibraries();
    widgetLib = libraries.widget;
    widgetTypeLib = libraries.widgetType;
    const widgetComponentLib = libraries.widgetComponent;

    // Create Express app with the API routes
    app = express();
    app.use(express.json());
    app.use('/api', createApiRoutes(widgetLib, widgetTypeLib, widgetComponentLib));
  });

  afterEach(async () => {
    if (testDb) {
      await testDb.cleanup();
    }
  });

  describe('Health Check Endpoint', () => {
    it('should return healthy status', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.body).toMatchObject({
        status: 'healthy',
        timestamp: expect.any(String),
        service: 'fjell-sample-app',
        version: '1.0.0'
      });
    });

    it('should return valid ISO timestamp', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      const timestamp = new Date(response.body.timestamp);
      expect(timestamp.toISOString()).toBe(response.body.timestamp);
    });
  });

  describe('Status Endpoint', () => {
    it('should return operational status with database info', async () => {
      // Create some test data
      const widgetType = await testDb.createWidgetType(
        TestFixtures.createWidgetTypeProperties({ code: 'STATUS_TEST' })
      );
      await testDb.createWidget(
        TestFixtures.createWidgetProperties(widgetType.id, { name: 'Status Test Widget' })
      );

      const response = await request(app)
        .get('/api/status')
        .expect(200);

      expect(response.body).toMatchObject({
        status: 'operational',
        timestamp: expect.any(String),
        service: 'fjell-sample-app',
        version: '1.0.0',
        data: {
          widgetTypes: {
            total: expect.any(Number),
            active: expect.any(Number)
          },
          widgets: {
            total: expect.any(Number),
            active: expect.any(Number)
          }
        },
        uptime: expect.any(Number)
      });

      expect(response.body.data.widgetTypes.total).toBeGreaterThanOrEqual(1);
      expect(response.body.data.widgets.total).toBeGreaterThanOrEqual(1);
    });

    it('should handle database errors gracefully', async () => {
      // Mock the library to throw an error
      const originalAll = widgetTypeLib.operations.all;
      widgetTypeLib.operations.all = () => {
        throw new Error('Database connection failed');
      };

      const response = await request(app)
        .get('/api/status')
        .expect(500);

      expect(response.body).toMatchObject({
        status: 'degraded',
        timestamp: expect.any(String),
        service: 'fjell-sample-app',
        error: 'Failed to retrieve database information',
        message: 'Database connection failed'
      });

      // Restore original function
      widgetTypeLib.operations.all = originalAll;
    });
  });

  describe('Dashboard Endpoint', () => {
    let widgetType1: any;
    let widgetType2: any;
    let widgets: any[];

    beforeEach(async () => {
      // Create test data for dashboard
      widgetType1 = await testDb.createWidgetType(
        TestFixtures.createWidgetTypeProperties({
          code: 'DASHBOARD_TYPE_1',
          name: 'Dashboard Type 1'
        })
      );

      widgetType2 = await testDb.createWidgetType(
        TestFixtures.createWidgetTypeProperties({
          code: 'DASHBOARD_TYPE_2',
          name: 'Dashboard Type 2',
          isActive: false
        })
      );

      // Create widgets for each type
      widgets = [];
      for (let i = 0; i < 3; i++) {
        const widget = await testDb.createWidget(
          TestFixtures.createWidgetProperties(widgetType1.id, {
            name: `Widget ${i + 1}`,
            isActive: i < 2 // First 2 are active
          })
        );
        widgets.push(widget);
      }

      // Create one widget for the second type
      const widget4 = await testDb.createWidget(
        TestFixtures.createWidgetProperties(widgetType2.id, {
          name: 'Widget 4'
        })
      );
      widgets.push(widget4);
    });

    it('should return dashboard data with correct structure', async () => {
      const response = await request(app)
        .get('/api/dashboard')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          summary: {
            totalWidgetTypes: expect.any(Number),
            activeWidgetTypes: expect.any(Number),
            totalWidgets: expect.any(Number),
            activeWidgets: expect.any(Number)
          },
          widgetTypeBreakdown: expect.any(Array),
          recentActivity: expect.any(Array),
          generatedAt: expect.any(String)
        }
      });
    });

    it('should include widget type breakdown with correct counts', async () => {
      const response = await request(app)
        .get('/api/dashboard')
        .expect(200);

      const breakdown = response.body.data.widgetTypeBreakdown;

      const type1Breakdown = breakdown.find((bt: any) => bt.code === 'DASHBOARD_TYPE_1');
      const type2Breakdown = breakdown.find((bt: any) => bt.code === 'DASHBOARD_TYPE_2');

      expect(type1Breakdown).toMatchObject({
        id: widgetType1.id,
        code: 'DASHBOARD_TYPE_1',
        name: 'Dashboard Type 1',
        isActive: true,
        widgetCount: 3,
        activeWidgetCount: 2
      });

      expect(type2Breakdown).toMatchObject({
        id: widgetType2.id,
        code: 'DASHBOARD_TYPE_2',
        name: 'Dashboard Type 2',
        isActive: false,
        widgetCount: 1,
        activeWidgetCount: 1
      });
    });

    it('should include recent activity with correct data', async () => {
      const response = await request(app)
        .get('/api/dashboard')
        .expect(200);

      const recentActivity = response.body.data.recentActivity;

      expect(recentActivity).toHaveLength(10); // Limited by dashboard endpoint slice(0, 10)
      expect(recentActivity[0]).toMatchObject({
        id: expect.any(String),
        name: expect.any(String),
        widgetTypeId: expect.any(String),
        isActive: expect.any(Boolean),
        createdAt: expect.any(String)
      });

      // Should be sorted by creation date (newest first)
      for (let i = 1; i < recentActivity.length; i++) {
        const prev = new Date(recentActivity[i - 1].createdAt);
        const current = new Date(recentActivity[i].createdAt);
        expect(prev.getTime()).toBeGreaterThanOrEqual(current.getTime());
      }
    });

    it('should handle dashboard generation errors gracefully', async () => {
      // Mock the library to throw an error
      const originalAll = widgetTypeLib.operations.all;
      widgetTypeLib.operations.all = () => {
        throw new Error('Dashboard data fetch failed');
      };

      const response = await request(app)
        .get('/api/dashboard')
        .expect(500);

      expect(response.body).toMatchObject({
        success: false,
        error: 'Failed to generate dashboard data',
        message: 'Dashboard data fetch failed'
      });

      // Restore original function
      widgetTypeLib.operations.all = originalAll;
    });
  });

  describe('Route Mounting', () => {
    it('should mount widget type routes', async () => {
      const response = await request(app)
        .get('/api/widget-types')
        .expect(200);

      expect(response.body).toMatchObject({ success: true, data: expect.any(Array) });
    });

    it('should mount widget routes', async () => {
      const response = await request(app)
        .get('/api/widgets')
        .expect(200);

      expect(response.body).toMatchObject({ success: true, data: expect.any(Array) });
    });

    it('should handle 404 for unknown API routes', async () => {
      const response = await request(app)
        .get('/api/unknown-endpoint')
        .expect(404);

      // The response will depend on how 404s are handled by the framework
      expect(response.status).toBe(404);
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed JSON in requests', async () => {
      const response = await request(app)
        .post('/api/widget-types')
        .set('Content-Type', 'application/json')
        .send('{ invalid json }')
        .expect(400);

      // Should get a JSON parse error
      expect(response.status).toBe(400);
    });
  });

  describe('CORS and Headers', () => {
    it('should allow standard HTTP methods', async () => {
      const response = await request(app)
        .options('/api/health')
        .expect(200);

      expect(response.status).toBe(200);
    });

    it('should handle GET requests properly', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.headers['content-type']).toMatch(/application\/json/);
    });
  });

  describe('Performance and Timing', () => {
    it('should respond to health check quickly', async () => {
      const start = Date.now();

      await request(app)
        .get('/api/health')
        .expect(200);

      const duration = Date.now() - start;
      expect(duration).toBeLessThan(1000); // Should be very fast
    });

    it('should handle concurrent requests', async () => {
      const promises = Array.from({ length: 5 }, () =>
        request(app)
          .get('/api/health')
          .expect(200)
      );

      const responses = await Promise.all(promises);

      // All should succeed
      responses.forEach(response => {
        expect(response.body.status).toBe('healthy');
      });
    });
  });
});
