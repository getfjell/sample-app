import { PItemRouter } from '@fjell/express-router';
import { NextFunction, Request, Response, Router } from 'express';
import { getLogger } from '@fjell/logging';
import { WidgetType } from '../model/WidgetType';
import type { SequelizeLibrary } from '@fjell/lib-sequelize';

const logger = getLogger('WidgetTypeRoutes');

// Response wrapper middleware to ensure consistent API response format
const responseWrapper = (req: Request, res: Response, next: NextFunction) => {
  const originalJson = res.json.bind(res);
  const originalStatus = res.status.bind(res);
  let statusCode = 200;
  let isDelete = false;

  if (req.method === 'DELETE') {
    isDelete = true;
  }

  res.status = function(code: number) {
    statusCode = code;
    return originalStatus(code);
  };

  res.json = function(body: any) {
    if (isDelete && body && typeof body === 'object' && 'key' in body && statusCode === 200) {
      return originalJson({ success: true, message: 'Widget type deleted successfully' });
    }
    if (Array.isArray(body)) {
      return originalJson({ success: true, data: body });
    }
    if (statusCode >= 400) {
      if (body && typeof body === 'object') {
        if ('success' in body || 'error' in body) {
          return originalJson(body);
        }
        if ('ik' in body && 'message' in body) {
          const errorMsg = body.message || 'Item not found';
          return originalJson({ success: false, error: errorMsg });
        }
        if ('message' in body) {
          return originalJson({ success: false, error: body.message || 'An error occurred' });
        }
        return originalJson({ success: false, error: body.error || 'An error occurred' });
      }
      if (typeof body === 'string') {
        return originalJson({ success: false, error: body });
      }
      return originalJson({ success: false, error: 'An error occurred' });
    }
    if (body && typeof body === 'object' && 'success' in body) {
      return originalJson(body);
    }
    if (body && typeof body === 'object' && !('success' in body) && !('error' in body)) {
      return originalJson({ success: true, data: body });
    }
    return originalJson(body);
  };
  next();
};

/**
 * Create Express router for WidgetType endpoints
 *
 * This router provides RESTful endpoints for managing widget types using PItemRouter.
 * Custom functionality is available via finders using query parameters like:
 * - GET /widget-types?finder=active
 * - GET /widget-types?finder=byCode&finderParams={"code":"PREMIUM"}
 */
export const createWidgetTypeRouter = (
  widgetTypeLibrary: SequelizeLibrary<WidgetType, 'widgetType'>
): Router => {
  logger.info('Creating WidgetType router...');

  const router = Router();
  
  // Apply response wrapper middleware
  router.use(responseWrapper);

  // Create the PItemRouter for standard CRUD operations
  const pItemRouter = new PItemRouter(widgetTypeLibrary, 'widgetType');

  // Mount the PItemRouter under root
  router.use('/', pItemRouter.getRouter());

  logger.info('WidgetType router created successfully');
  return router;
};
