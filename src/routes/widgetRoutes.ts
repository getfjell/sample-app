import { PItemRouter } from '@fjell/express-router';
import { NextFunction, Request, Response, Router } from 'express';
import { getLogger } from '@fjell/logging';
import { Widget } from '../model/Widget';
import type { SequelizeLibrary } from '@fjell/lib-sequelize';
import { NotFoundError } from '@fjell/http-api';

const logger = getLogger('WidgetRoutes');

/**
 * Response wrapper middleware to format responses consistently
 */
const responseWrapper = (req: Request, res: Response, next: NextFunction) => {
  const originalJson = res.json.bind(res);
  const originalStatus = res.status.bind(res);
  let statusCode = 200;
  let isDelete = false;

  // Track if this is a DELETE request
  if (req.method === 'DELETE') {
    isDelete = true;
  }

  // Wrap status to track status code
  res.status = function(code: number) {
    statusCode = code;
    return originalStatus(code);
  };

  // Wrap json to add success/data wrapper
  res.json = function(body: any) {
    // For DELETE requests, if we get an item back, format as success message
    if (isDelete && body && typeof body === 'object' && 'key' in body && statusCode === 200) {
      return originalJson({ success: true, message: 'Widget deleted successfully' });
    }

    // If it's an array, wrap it
    if (Array.isArray(body)) {
      return originalJson({ success: true, data: body });
    }

    // Format error responses
    if (statusCode >= 400) {
      if (body && typeof body === 'object') {
        // If it already has success/error format, pass through
        if ('success' in body || 'error' in body) {
          return originalJson(body);
        }
        // Format error responses - check for NotFoundError patterns
        if ('ik' in body && 'message' in body) {
          // This is likely a NotFoundError response from ItemRouter
          const errorMsg = body.message || 'Item not found';
          // If status is already 404, keep it; otherwise the router should have set it
          return originalJson({ success: false, error: errorMsg });
        }
        // Format error responses
        if ('message' in body) {
          return originalJson({ success: false, error: body.message || 'An error occurred' });
        }
        // Generic error object
        return originalJson({ success: false, error: body.error || 'An error occurred' });
      }
      if (typeof body === 'string') {
        return originalJson({ success: false, error: body });
      }
      return originalJson({ success: false, error: 'An error occurred' });
    }

    // If it's an object with success already, pass through
    if (body && typeof body === 'object' && 'success' in body) {
      return originalJson(body);
    }

    // If it's an object (item), wrap it
    if (body && typeof body === 'object' && !('success' in body) && !('error' in body)) {
      return originalJson({ success: true, data: body });
    }

    // Otherwise pass through
    return originalJson(body);
  };

  next();
};

/**
 * Create Express router for Widget endpoints
 *
 * This router provides RESTful endpoints for managing widgets using PItemRouter.
 * Use standard fjell patterns:
 * - GET /widgets - all widgets
 * - GET /widgets?finder=active - active widgets finder
 * - GET /widgets?finder=byType&finderParams={"widgetTypeId":"123"} - by type finder
 * - GET /widgets?finder=byTypeCode&finderParams={"code":"PREMIUM"} - by type code finder
 * - POST /widgets - create widget
 * - GET /widgets/:id - get widget by id
 * - PUT /widgets/:id - update widget
 * - DELETE /widgets/:id - delete widget
 * - GET /widgets/summary - widget summary statistics
 */
export const createWidgetRouter = (
  widgetLibrary: SequelizeLibrary<Widget, 'widget'>
): Router => {
  logger.info('Creating Widget router...');

  // Create the PItemRouter for standard CRUD operations
  const pItemRouter = new PItemRouter(widgetLibrary, 'widget');
  const baseRouter = pItemRouter.getRouter();

  // Create a new router to add custom routes and middleware
  const router = Router();

  // Add response wrapper middleware - must be first
  router.use(responseWrapper);

  // Add summary endpoint - must be before /:id route from baseRouter
  router.get('/summary', async (req: Request, res: Response) => {
    try {
      const widgets = await widgetLibrary.operations.all({});
      const activeWidgets = widgets.filter(w => w.isActive);
      const inactiveWidgets = widgets.filter(w => !w.isActive);

      // Group by widget type
      const byType: Record<string, { total: number; active: number; inactive: number }> = {};
      widgets.forEach(widget => {
        const typeId = widget.widgetTypeId;
        if (!byType[typeId]) {
          byType[typeId] = { total: 0, active: 0, inactive: 0 };
        }
        byType[typeId].total++;
        if (widget.isActive) {
          byType[typeId].active++;
        } else {
          byType[typeId].inactive++;
        }
      });

      res.json({
        success: true,
        data: {
          total: widgets.length,
          active: activeWidgets.length,
          inactive: inactiveWidgets.length,
          byType
        }
      });
    } catch (error) {
      logger.error('Error getting widget summary', { error });
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get widget summary'
      });
    }
  });

  // Mount all routes from PItemRouter (includes /:id route)
  // The response wrapper middleware will format all responses
  router.use(baseRouter);

  logger.info('Widget router created successfully');
  return router;
};