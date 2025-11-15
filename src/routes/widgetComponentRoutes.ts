import { PItemRouter } from '@fjell/express-router';
import { Router } from 'express';
import { getLogger } from '@fjell/logging';
import { WidgetComponent } from '../model/WidgetComponent';
import type { SequelizeLibrary } from '@fjell/lib-sequelize';

const logger = getLogger('WidgetComponentRoutes');

/**
 * Create Express router for WidgetComponent endpoints
 *
 * This router provides RESTful endpoints for managing widget components using PItemRouter.
 * Use standard fjell patterns:
 * - GET /widget-components - all components
 * - GET /widget-components?finder=byWidget&finderParams={"widgetId":"123"} - by widget finder
 * - GET /widget-components?finder=byStatus&finderParams={"status":"active"} - by status finder
 * - GET /widget-components?finder=active - active components finder
 * - GET /widget-components?finder=byComponentType&finderParams={"componentTypeId":"TYPE1"} - by type finder
 * - POST /widget-components - create component
 * - GET /widget-components/:id - get component by id
 * - PUT /widget-components/:id - update component
 * - DELETE /widget-components/:id - delete component
 */
export const createWidgetComponentRouter = (
  widgetComponentLibrary: SequelizeLibrary<WidgetComponent, 'widgetComponent', 'widget'>
): Router => {
  logger.info('Creating WidgetComponent router...');

  // Create the PItemRouter for standard CRUD operations
  const pItemRouter = new PItemRouter(widgetComponentLibrary, 'widgetComponent');

  logger.info('WidgetComponent router created successfully');
  return pItemRouter.getRouter();
};

