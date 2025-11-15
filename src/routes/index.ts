import { Router } from 'express';
import { getLogger } from '@fjell/logging';
import { createWidgetRouter } from './widgetRoutes';
import { createWidgetTypeRouter } from './widgetTypeRoutes';
import { createWidgetComponentRouter } from './widgetComponentRoutes';
import { Widget } from '../model/Widget';
import { WidgetType } from '../model/WidgetType';
import { WidgetComponent } from '../model/WidgetComponent';
import type { SequelizeLibrary } from '@fjell/lib-sequelize';

const logger = getLogger('Routes');

/**
 * Create and configure all API routes
 */
export const createApiRoutes = (
  widgetLibrary: SequelizeLibrary<Widget, 'widget'>,
  widgetTypeLibrary: SequelizeLibrary<WidgetType, 'widgetType'>,
  widgetComponentLibrary: SequelizeLibrary<WidgetComponent, 'widgetComponent', 'widget'>
): Router => {
  logger.info('Creating API routes...');

  const apiRouter = Router();

  // Health check endpoint
  apiRouter.get('/health', (req, res) => {
    logger.info('Health check requested');
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'fjell-sample-app',
      version: '1.0.0'
    });
  });

  // API status endpoint with database information
  apiRouter.get('/status', async (req, res) => {
    try {
      logger.info('Status check requested');

      // Get counts from the libraries
      const widgetTypes = await widgetTypeLibrary.operations.all({});
      const widgets = await widgetLibrary.operations.all({});
      const widgetComponents = await widgetComponentLibrary.operations.all({});
      const activeWidgetTypes = widgetTypes.filter(wt => wt.isActive);
      const activeWidgets = widgets.filter(w => w.isActive);
      const activeComponents = widgetComponents.filter(wc => wc.status === 'active');

      res.json({
        status: 'operational',
        timestamp: new Date().toISOString(),
        service: 'fjell-sample-app',
        version: '1.0.0',
        data: {
          widgetTypes: {
            total: widgetTypes.length,
            active: activeWidgetTypes.length
          },
          widgets: {
            total: widgets.length,
            active: activeWidgets.length
          },
          widgetComponents: {
            total: widgetComponents.length,
            active: activeComponents.length
          }
        },
        uptime: process.uptime()
      });
    } catch (error) {
      logger.error('Status check failed', { error });
      res.status(500).json({
        status: 'degraded',
        timestamp: new Date().toISOString(),
        service: 'fjell-sample-app',
        error: 'Failed to retrieve database information',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Dashboard endpoint with summary information
  apiRouter.get('/dashboard', async (req, res) => {
    try {
      logger.info('Dashboard data requested');

      const widgetTypes = await widgetTypeLibrary.operations.all({});
      const widgets = await widgetLibrary.operations.all({});

      // Create widget type breakdown
      const widgetTypeBreakdown = widgetTypes.map(wt => {
        const typeWidgets = widgets.filter(w => w.widgetTypeId === wt.id);
        return {
          id: wt.id,
          code: wt.code,
          name: wt.name,
          isActive: wt.isActive,
          widgetCount: typeWidgets.length,
          activeWidgetCount: typeWidgets.filter(w => w.isActive).length
        };
      });

      // Recent activity (sort by creation date)
      const recentWidgets = widgets
        .sort((a, b) => b.events.created.at.getTime() - a.events.created.at.getTime())
        .slice(0, 10)
        .map(w => ({
          id: w.id,
          name: w.name,
          widgetTypeId: w.widgetTypeId,
          isActive: w.isActive,
          createdAt: w.events.created.at
        }));

      const dashboard = {
        summary: {
          totalWidgetTypes: widgetTypes.length,
          activeWidgetTypes: widgetTypes.filter(wt => wt.isActive).length,
          totalWidgets: widgets.length,
          activeWidgets: widgets.filter(w => w.isActive).length
        },
        widgetTypeBreakdown,
        recentActivity: recentWidgets,
        generatedAt: new Date().toISOString()
      };

      logger.info('Dashboard data generated', {
        widgetTypes: dashboard.summary.totalWidgetTypes,
        widgets: dashboard.summary.totalWidgets
      });

      res.json({
        success: true,
        data: dashboard
      });
    } catch (error) {
      logger.error('Dashboard generation failed', { error });
      res.status(500).json({
        success: false,
        error: 'Failed to generate dashboard data',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Mount the widget type and widget routers using standard fjell PItemRouter patterns
  apiRouter.use('/widget-types', createWidgetTypeRouter(widgetTypeLibrary));
  apiRouter.use('/widgets', createWidgetRouter(widgetLibrary));
  apiRouter.use('/widget-components', createWidgetComponentRouter(widgetComponentLibrary));

  logger.info('API routes created successfully', {
    routes: {
      health: '/health',
      status: '/status',
      dashboard: '/dashboard',
      widgetTypes: '/widget-types',
      widgets: '/widgets',
      widgetComponents: '/widget-components'
    }
  });

  return apiRouter;
};

// Re-export route creation functions
export { createWidgetRouter } from './widgetRoutes';
export { createWidgetTypeRouter } from './widgetTypeRoutes';
export { createWidgetComponentRouter } from './widgetComponentRoutes';
