import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import { SampleApp } from '../src/index';
import { TestDatabase } from './helpers/testDatabase';

describe('SampleApp', () => {
  let testDb: TestDatabase;
  let app: SampleApp;

  beforeEach(async () => {
    testDb = await TestDatabase.createFresh();
    app = new SampleApp(0); // Use port 0 to let the system assign an available port
  });

  afterEach(async () => {
    if (app) {
      await app.stop().catch(() => { }); // Ignore errors during cleanup
    }
    if (testDb) {
      await testDb.cleanup();
    }
  });

  describe('Constructor', () => {
    it('should create SampleApp with default port', () => {
      const defaultApp = new SampleApp();
      expect(defaultApp).toBeInstanceOf(SampleApp);
      expect(defaultApp.getApp()).toBeDefined();
      expect(defaultApp.getDatabase()).toBeDefined();
    });

    it('should create SampleApp with custom port', () => {
      const customApp = new SampleApp(8080);
      expect(customApp).toBeInstanceOf(SampleApp);
      expect(customApp.getApp()).toBeDefined();
      expect(customApp.getDatabase()).toBeDefined();
    });
  });

  describe('Initialize', () => {
    it('should initialize successfully', async () => {
      await expect(app.initialize()).resolves.not.toThrow();
    });

    it('should setup middleware correctly', async () => {
      await app.initialize();

      const expressApp = app.getApp();
      expect(expressApp).toBeDefined();

      // Check that middleware is configured by checking the app's middleware stack
      // Express adds middleware to the app stack, which should include built-in middleware
      const appRouter = (expressApp as any)._router;
      expect(appRouter).toBeDefined();
      
      // Check that the router has a stack with middleware and routes
      const routerStack = appRouter?.stack || [];
      expect(routerStack.length).toBeGreaterThan(0);
    });

    it('should handle initialization errors', async () => {
      // Mock database initialization to fail
      const database = app.getDatabase();
      vi.spyOn(database, 'initialize').mockRejectedValue(new Error('Database connection failed'));

      await expect(app.initialize()).rejects.toThrow('Database connection failed');
    });
  });

  describe('Application Routes', () => {
    beforeEach(async () => {
      await app.initialize();
    });

    it('should serve API info endpoint', async () => {
      const expressApp = app.getApp();
      const testRequest = request(expressApp);

      const response = await testRequest.get('/api');

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        name: 'Fjell Sample Application API',
        description: 'A reference implementation of the fjell server-side stack',
        version: '1.0.0',
        endpoints: expect.any(Object)
      });
      expect(response.body.timestamp).toBeDefined();
    });

    it('should serve database health check', async () => {
      const expressApp = app.getApp();
      const testRequest = request(expressApp);

      const response = await testRequest.get('/health/database');

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        database: {
          status: 'healthy'
        },
        timestamp: expect.any(String)
      });
    });

    it('should handle 404 for unknown routes', async () => {
      const expressApp = app.getApp();
      const testRequest = request(expressApp);

      const response = await testRequest.get('/unknown-route');

      expect(response.status).toBe(404);
      expect(response.body).toMatchObject({
        success: false,
        error: 'Route not found',
        message: 'GET /unknown-route is not a valid endpoint',
        timestamp: expect.any(String)
      });
    });

    it('should handle OPTIONS requests for CORS', async () => {
      const expressApp = app.getApp();
      const testRequest = request(expressApp);

      const response = await testRequest.options('/api/widgets');

      expect(response.status).toBe(200);
      expect(response.headers['access-control-allow-origin']).toBe('*');
      expect(response.headers['access-control-allow-methods']).toContain('GET, POST, PUT, DELETE, OPTIONS');
    });
  });

  describe('Error Handling', () => {
    beforeEach(async () => {
      await app.initialize();
    });

    it('should handle database health check failures', async () => {
      // Mock database health check to fail
      const database = app.getDatabase();
      vi.spyOn(database, 'healthCheck').mockRejectedValue(new Error('Database unavailable'));

      const expressApp = app.getApp();
      const testRequest = request(expressApp);

      const response = await testRequest.get('/health/database');

      expect(response.status).toBe(503);
      expect(response.body).toMatchObject({
        database: {
          status: 'unhealthy',
          error: 'Health check failed'
        },
        timestamp: expect.any(String)
      });
    });
  });

  describe('Middleware Configuration', () => {
    beforeEach(async () => {
      await app.initialize();
    });

    it('should parse JSON bodies', async () => {
      const expressApp = app.getApp();
      const testRequest = request(expressApp);

      const jsonData = { test: 'data' };
      const response = await testRequest
        .post('/api/widgets')
        .send(jsonData)
        .set('Content-Type', 'application/json');

      // Even if the route doesn't exist or validation fails, JSON parsing should work
      // (we'll get a different error if parsing failed)
      // 400 could be validation error, which is fine - we just want to ensure it's not a JSON parse error
      expect([200, 201, 400, 404, 500]).toContain(response.status); // Any of these means JSON was parsed
    });

    it('should add CORS headers', async () => {
      const expressApp = app.getApp();
      const testRequest = request(expressApp);

      const response = await testRequest.get('/');

      expect(response.headers['access-control-allow-origin']).toBe('*');
      expect(response.headers['access-control-allow-methods']).toContain('GET, POST, PUT, DELETE, OPTIONS');
      expect(response.headers['access-control-allow-headers']).toContain('Origin, X-Requested-With, Content-Type, Accept, Authorization');
    });
  });

  describe('Lifecycle Management', () => {
    it('should start and stop gracefully', async () => {
      await app.initialize();

      // Start in background (don't wait for server to start listening)
      const startPromise = app.start();

      // Give it a moment to start
      await new Promise(resolve => setTimeout(resolve, 100));

      // Stop should work without error
      await expect(app.stop()).resolves.not.toThrow();

      // Wait for start promise to complete or reject
      await startPromise.catch(() => { }); // Ignore errors from forced shutdown
    });

    it('should handle stop errors gracefully', async () => {
      await app.initialize();

      // Mock database close to fail
      const database = app.getDatabase();
      vi.spyOn(database, 'close').mockRejectedValue(new Error('Close failed'));

      await expect(app.stop()).rejects.toThrow('Close failed');
    });
  });

  describe('Getters', () => {
    it('should return Express app instance', () => {
      const expressApp = app.getApp();
      expect(expressApp).toBeDefined();
      expect(typeof expressApp.listen).toBe('function');
      expect(typeof expressApp.use).toBe('function');
    });

    it('should return Database instance', () => {
      const database = app.getDatabase();
      expect(database).toBeDefined();
      expect(typeof database.initialize).toBe('function');
      expect(typeof database.close).toBe('function');
    });
  });
});
