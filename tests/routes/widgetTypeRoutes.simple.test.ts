import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import express from 'express';
import { TestDatabase } from '../helpers/testDatabase';
import { TestFixtures } from '../helpers/testFixtures';
import { createWidgetTypeRouter } from '../../src/routes/widgetTypeRoutes';

describe('WidgetType Routes (Simplified)', () => {
  let app: express.Application;
  let testDb: TestDatabase;
  let widgetTypeLib: any;

  beforeEach(async () => {
    testDb = await TestDatabase.createFresh();
    const libraries = testDb.getLibraries();
    widgetTypeLib = libraries.widgetType;

    // Create Express app with widget type routes
    app = express();
    app.use(express.json());
    app.use('/widget-types', createWidgetTypeRouter(widgetTypeLib));
  });

  afterEach(async () => {
    if (testDb) {
      await testDb.cleanup();
    }
  });

  describe('GET /widget-types', () => {
    it('should return all widget types', async () => {
      const widgetType1 = await testDb.createWidgetType(
        TestFixtures.createWidgetTypeProperties({
          code: 'TYPE_1',
          name: 'Widget Type 1'
        })
      );
      const widgetType2 = await testDb.createWidgetType(
        TestFixtures.createWidgetTypeProperties({
          code: 'TYPE_2',
          name: 'Widget Type 2'
        })
      );

      const response = await request(app)
        .get('/widget-types')
        .expect(200);

      expect(response.body).toMatchObject({ success: true, data: expect.any(Array) });
      const ourTypes = response.body.data.filter((wt: any) =>
        [widgetType1.id, widgetType2.id].includes(wt.id)
      );
      expect(ourTypes).toHaveLength(2);
    });

    it('should return empty array when no widget types exist', async () => {
      const response = await request(app)
        .get('/widget-types')
        .expect(200);

      expect(response.body).toMatchObject({ success: true, data: [] });
    });
  });

  describe('GET /widget-types with finders', () => {
    it('should return only active widget types', async () => {
      const activeType = await testDb.createWidgetType(
        TestFixtures.createWidgetTypeProperties({
          code: 'ACTIVE_TYPE',
          name: 'Active Type',
          isActive: true
        })
      );

      const inactiveType = await testDb.createWidgetType(
        TestFixtures.createWidgetTypeProperties({
          code: 'INACTIVE_TYPE',
          name: 'Inactive Type',
          isActive: false
        })
      );

      const response = await request(app)
        .get('/widget-types?finder=active&finderParams={}')
        .expect(200);

      expect(response.body).toMatchObject({ success: true, data: expect.any(Array) });
      const foundActive = response.body.data.find((wt: any) => wt.id === activeType.id);
      const foundInactive = response.body.data.find((wt: any) => wt.id === inactiveType.id);

      expect(foundActive).toBeDefined();
      expect(foundInactive).toBeUndefined();
    });

    it('should find widget type by code', async () => {
      const widgetType = await testDb.createWidgetType(
        TestFixtures.createWidgetTypeProperties({
          code: 'FIND_BY_CODE',
          name: 'Find By Code Type'
        })
      );

      const response = await request(app)
        .get(`/widget-types?finder=byCode&finderParams=${JSON.stringify({ code: 'FIND_BY_CODE' })}`)
        .expect(200);

      expect(response.body).toMatchObject({ success: true, data: expect.any(Array) });
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0]).toMatchObject({
        id: widgetType.id,
        code: 'FIND_BY_CODE',
        name: 'Find By Code Type'
      });
    });
  });

  describe('GET /widget-types/:id', () => {
    it('should return specific widget type', async () => {
      const widgetType = await testDb.createWidgetType(
        TestFixtures.createWidgetTypeProperties({
          code: 'SPECIFIC_TYPE',
          name: 'Specific Widget Type',
          description: 'A specific widget type for testing'
        })
      );

      const response = await request(app)
        .get(`/widget-types/${widgetType.id}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          id: widgetType.id,
          code: 'SPECIFIC_TYPE',
          name: 'Specific Widget Type',
          description: 'A specific widget type for testing',
          isActive: true
        }
      });
    });

    it('should return 404 for non-existent widget type', async () => {
      const response = await request(app)
        .get('/widget-types/non-existent-id')
        .expect(404);

      expect(response.body).toMatchObject({
        success: false,
        error: expect.any(String)
      });
    });
  });

  describe('POST /widget-types', () => {
    it('should create new widget type', async () => {
      const widgetTypeData = {
        code: 'NEW_TYPE',
        name: 'New Widget Type',
        description: 'A newly created widget type',
        isActive: true
      };

      const response = await request(app)
        .post('/widget-types')
        .send(widgetTypeData)
        .expect(201);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          id: expect.any(String),
          code: 'NEW_TYPE',
          name: 'New Widget Type',
          description: 'A newly created widget type',
          isActive: true
        }
      });
    });

    it('should normalize code to uppercase', async () => {
      const widgetTypeData = {
        code: 'lowercase_code',
        name: 'Lowercase Code Type'
      };

      const response = await request(app)
        .post('/widget-types')
        .send(widgetTypeData)
        .expect(201);

      expect(response.body.data.code).toBe('LOWERCASE_CODE');
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/widget-types')
        .send({ name: 'Type without code', isActive: true })
        .expect(400);

      expect(response.body).toMatchObject({
        error: expect.any(String)
      });
    });

    it('should validate code format', async () => {
      const invalidData = {
        code: 'invalid-code-with-dashes',
        name: 'Invalid Code Type'
      };

      const response = await request(app)
        .post('/widget-types')
        .send(invalidData)
        .expect(400); // Validation happens in preCreate hook

      expect(response.body).toMatchObject({
        error: expect.any(String)
      });
    });
  });

  describe('PUT /widget-types/:id', () => {
    it('should update widget type', async () => {
      const widgetType = await testDb.createWidgetType(
        TestFixtures.createWidgetTypeProperties({
          code: 'UPDATE_TEST',
          name: 'Original Test Type',
          description: 'Original description'
        })
      );

      const updateData = {
        code: 'UPDATED_TEST',
        name: 'Updated Test Type',
        description: 'Updated description',
        isActive: false
      };

      const response = await request(app)
        .put(`/widget-types/${widgetType.id}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          id: widgetType.id,
          code: 'UPDATED_TEST',
          name: 'Updated Test Type',
          description: 'Updated description',
          isActive: false
        }
      });
    });

    it('should return 404 for non-existent widget type', async () => {
      const updateData = { name: 'Updated Name' };

      const response = await request(app)
        .put('/widget-types/non-existent-id')
        .send(updateData)
        .expect(404); // PItemRouter returns 404 for not found

      expect(response.body).toMatchObject({
        success: false,
        error: expect.any(String)
      });
    });
  });

  describe('DELETE /widget-types/:id', () => {
    it('should delete widget type', async () => {
      const widgetType = await testDb.createWidgetType(
        TestFixtures.createWidgetTypeProperties({
          code: 'DELETE_TEST',
          name: 'Type to Delete'
        })
      );

      const response = await request(app)
        .delete(`/widget-types/${widgetType.id}`)
        .expect(200);

      // PItemRouter returns the deleted item
      expect(response.body).toMatchObject({
        success: true,
        message: 'Widget type deleted successfully'
      });
    });

    it('should return 404 for non-existent widget type', async () => {
      const response = await request(app)
        .delete('/widget-types/non-existent-id')
        .expect(404); // PItemRouter returns 404 for not found

      expect(response.body).toMatchObject({
        success: false,
        error: expect.any(String)
      });
    });
  });
});
