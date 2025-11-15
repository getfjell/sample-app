import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createWidgetTypeRouter } from '../../src/routes/widgetTypeRoutes';
import { TestDatabase, TestFixtures } from '../helpers';
import express from 'express';
import request from 'supertest';

describe('WidgetType Routes', () => {
  let testDb: TestDatabase;
  let app: express.Application;
  let widgetTypeLib: any;

  beforeEach(async () => {
    testDb = await TestDatabase.createWithData();
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
      // Create test widget types
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
      // Create a fresh test database with no seed data
      const freshTestDb = await TestDatabase.createFresh();
      const freshLibraries = freshTestDb.getLibraries();
      const freshWidgetTypeLib = freshLibraries.widgetType;

      // Create fresh Express app with empty database
      const freshApp = express();
      freshApp.use(express.json());
      freshApp.use('/widget-types', createWidgetTypeRouter(freshWidgetTypeLib));

      const response = await request(freshApp)
        .get('/widget-types')
        .expect(200);

      expect(response.body).toMatchObject({ success: true, data: [] });

      // Clean up
      await freshTestDb.cleanup();
    });
  });

  describe('GET /widget-types/active', () => {
    it('should return only active widget types', async () => {
      // Create active and inactive widget types
      const activeType = await testDb.createWidgetType(
        TestFixtures.createWidgetTypeProperties({
          code: 'ACTIVE_TYPE',
          name: 'Active Widget Type',
          isActive: true
        })
      );

      const inactiveType = await testDb.createWidgetType(
        TestFixtures.createWidgetTypeProperties({
          code: 'INACTIVE_TYPE',
          name: 'Inactive Widget Type',
          isActive: false
        })
      );

      const response = await request(app)
        .get('/widget-types?finder=active&finderParams={}')
        .expect(200);

      expect(response.body).toMatchObject({ success: true, data: expect.any(Array) });

      const activeTypes = response.body.data;
      const foundActive = activeTypes.find((wt: any) => wt.id === activeType.id);
      const foundInactive = activeTypes.find((wt: any) => wt.id === inactiveType.id);

      expect(foundActive).toBeDefined();
      expect(foundInactive).toBeUndefined();
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
        description: 'A newly created widget type'
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
      const invalidData = {
        name: 'Type without code'
        // Missing code
      };

      const response = await request(app)
        .post('/widget-types')
        .send(invalidData)
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
        .expect(400);

      expect(response.body).toMatchObject({
        error: expect.any(String)
      });
    });

    it('should validate code length', async () => {
      const invalidData = {
        code: 'A'.repeat(51), // Too long
        name: 'Long Code Type'
      };

      const response = await request(app)
        .post('/widget-types')
        .send(invalidData)
        .expect(400);

      expect(response.body).toMatchObject({
        error: expect.any(String)
      });
    });

    it('should validate name length', async () => {
      const invalidData = {
        code: 'VALID_CODE',
        name: 'A'.repeat(256) // Too long
      };

      const response = await request(app)
        .post('/widget-types')
        .send(invalidData)
        .expect(400);

      expect(response.body).toMatchObject({
        error: expect.any(String)
      });
    });
  });

  describe('PUT /widget-types/:id', () => {
    let testWidgetType: any;

    beforeEach(async () => {
      testWidgetType = await testDb.createWidgetType(
        TestFixtures.createWidgetTypeProperties({
          code: 'UPDATE_TEST',
          name: 'Update Test Type',
          description: 'Original description'
        })
      );
    });

    it('should update widget type', async () => {
      const updateData = {
        code: 'UPDATED_TEST',
        name: 'Updated Test Type',
        description: 'Updated description',
        isActive: false
      };

      const response = await request(app)
        .put(`/widget-types/${testWidgetType.id}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          id: testWidgetType.id,
          code: 'UPDATED_TEST',
          name: 'Updated Test Type',
          description: 'Updated description',
          isActive: false
        }
      });
    });

    it('should normalize code during update', async () => {
      const updateData = {
        code: 'updated_lowercase_code'
      };

      const response = await request(app)
        .put(`/widget-types/${testWidgetType.id}`)
        .send(updateData)
        .expect(200);

      expect(response.body.data.code).toBe('UPDATED_LOWERCASE_CODE');
    });

    it('should return 404 for non-existent widget type', async () => {
      const updateData = { name: 'Updated Name' };

      const response = await request(app)
        .put('/widget-types/non-existent-id')
        .send(updateData)
        .expect(404);

      expect(response.body).toMatchObject({
        success: false,
        error: expect.any(String)
      });
    });

    it('should handle partial updates', async () => {
      const updateData = { name: 'Partially Updated Type' };

      const response = await request(app)
        .put(`/widget-types/${testWidgetType.id}`)
        .send(updateData)
        .expect(200);

      expect(response.body.data.name).toBe('Partially Updated Type');
      expect(response.body.data.code).toBe('UPDATE_TEST'); // Should remain unchanged
      expect(response.body.data.description).toBe('Original description'); // Should remain unchanged
    });
  });

  describe('DELETE /widget-types/:id', () => {
    let testWidgetType: any;

    beforeEach(async () => {
      testWidgetType = await testDb.createWidgetType(
        TestFixtures.createWidgetTypeProperties({
          code: 'DELETE_TEST',
          name: 'Type to Delete'
        })
      );
    });

    it('should delete widget type', async () => {
      const response = await request(app)
        .delete(`/widget-types/${testWidgetType.id}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Widget type deleted successfully'
      });

      // Verify widget type is deleted
      const getResponse = await request(app)
        .get(`/widget-types/${testWidgetType.id}`)
        .expect(404);
    });

    it('should return 404 for non-existent widget type', async () => {
      const response = await request(app)
        .delete('/widget-types/non-existent-id')
        .expect(404);

      expect(response.body).toMatchObject({
        success: false,
        error: expect.any(String)
      });
    });
  });

  describe('Code Validation Edge Cases', () => {
    it('should accept valid code formats', async () => {
      const validCodes = [
        'DROPDOWN',
        'RADIO_BUTTON',
        'CHART_WIDGET',
        'A',
        'A_B_C_D_E',
        'WIDGET_TYPE_WITH_MANY_UNDERSCORES'
      ];

      for (const code of validCodes) {
        const widgetTypeData = {
          code,
          name: `${code} Widget Type`
        };

        const response = await request(app)
          .post('/widget-types')
          .send(widgetTypeData)
          .expect(201);

        expect(response.body.data.code).toBe(code);
      }
    });

    it('should reject invalid code formats', async () => {
      const invalidCodes = [
        'lowercase',
        'Mixed_Case',
        'INVALID-DASH',
        'INVALID SPACE',
        'INVALID@SYMBOL',
        'INVALID123',
        'INVALID.DOT'
      ];

      for (const code of invalidCodes) {
        const widgetTypeData = {
          code,
          name: 'Invalid Code Type'
        };

        const response = await request(app)
          .post('/widget-types')
          .send(widgetTypeData)
          .expect(400);

        expect(response.body).toMatchObject({
          error: expect.any(String)
        });
      }
    });

    it('should handle maximum length code', async () => {
      const maxLengthCode = 'A'.repeat(50); // Exactly 50 characters
      const widgetTypeData = {
        code: maxLengthCode,
        name: 'Max Length Code Type'
      };

      const response = await request(app)
        .post('/widget-types')
        .send(widgetTypeData)
        .expect(201);

      expect(response.body.data.code).toBe(maxLengthCode);
    });

    it('should handle single character code', async () => {
      const widgetTypeData = {
        code: 'A',
        name: 'Single Character Code'
      };

      const response = await request(app)
        .post('/widget-types')
        .send(widgetTypeData)
        .expect(201);

      expect(response.body.data.code).toBe('A');
    });
  });

  describe('Name Validation Edge Cases', () => {
    it('should handle maximum length name', async () => {
      const maxLengthName = 'A'.repeat(255); // Exactly 255 characters
      const widgetTypeData = {
        code: 'MAX_LENGTH_NAME',
        name: maxLengthName
      };

      const response = await request(app)
        .post('/widget-types')
        .send(widgetTypeData)
        .expect(201);

      expect(response.body.data.name).toBe(maxLengthName);
    });

    it('should handle unicode characters in name', async () => {
      const widgetTypeData = {
        code: 'UNICODE_TEST',
        name: '测试小部件类型 🎯',
        description: 'Ñoño descripción with émojis 🚀'
      };

      const response = await request(app)
        .post('/widget-types')
        .send(widgetTypeData)
        .expect(201);

      expect(response.body.data.name).toBe('测试小部件类型 🎯');
      expect(response.body.data.description).toBe('Ñoño descripción with émojis 🚀');
    });

    it('should trim whitespace from code and name', async () => {
      const widgetTypeData = {
        code: '  TRIM_TEST  ',
        name: '  Trim Test Type  '
      };

      const response = await request(app)
        .post('/widget-types')
        .send(widgetTypeData)
        .expect(201);

      expect(response.body.data.code).toBe('TRIM_TEST');
      expect(response.body.data.name).toBe('Trim Test Type');
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      // Mock library to throw error by overriding the operations.get method
      const originalGet = widgetTypeLib.operations.get;
      widgetTypeLib.operations.get = () => {
        throw new Error('Database connection failed');
      };

      const response = await request(app)
        .get('/widget-types/some-id')
        .expect(500);

      expect(response.body).toMatchObject({
        success: false,
        error: expect.any(String)
      });

      // Restore original function
      widgetTypeLib.operations.get = originalGet;
    });

    it('should handle invalid JSON in request body', async () => {
      const response = await request(app)
        .post('/widget-types')
        .set('Content-Type', 'application/json')
        .send('{ invalid json }')
        .expect(400);

      expect(response.status).toBe(400);
    });

    it('should handle empty request body', async () => {
      const response = await request(app)
        .post('/widget-types')
        .send({})
        .expect(400);

      expect(response.body).toMatchObject({
        error: expect.any(String)
      });
    });

    it('should handle null values in request', async () => {
      const nullData = {
        code: 'NULL_TEST',
        name: 'Null Test Type',
        description: null
      };

      const response = await request(app)
        .post('/widget-types')
        .send(nullData)
        .expect(201);

      expect(response.body.data.description).toBe(null);
    });
  });

  describe('Middleware and Logging', () => {
    it('should handle requests with query parameters', async () => {
      const response = await request(app)
        .get('/widget-types?active=true&limit=10')
        .expect(200);

      expect(response.body).toMatchObject({ success: true, data: expect.any(Array) });
    });

    it('should handle requests with custom headers', async () => {
      const response = await request(app)
        .get('/widget-types')
        .set('X-Custom-Header', 'test-value')
        .expect(200);

      expect(response.body).toMatchObject({ success: true, data: expect.any(Array) });
    });
  });

  describe('Business Logic', () => {
    it('should create widget type with default active status', async () => {
      const widgetTypeData = {
        code: 'DEFAULT_ACTIVE',
        name: 'Default Active Type'
        // isActive not specified
      };

      const response = await request(app)
        .post('/widget-types')
        .send(widgetTypeData)
        .expect(201);

      expect(response.body.data.isActive).toBe(true);
    });

    it('should preserve explicit active status', async () => {
      const widgetTypeData = {
        code: 'EXPLICIT_INACTIVE',
        name: 'Explicit Inactive Type',
        isActive: false
      };

      const response = await request(app)
        .post('/widget-types')
        .send(widgetTypeData)
        .expect(201);

      expect(response.body.data.isActive).toBe(false);
    });
  });
});
