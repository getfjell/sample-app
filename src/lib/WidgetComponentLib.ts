import { createSequelizeLibrary } from '@fjell/lib-sequelize';
import { Registry } from '@fjell/registry';
import { ModelStatic } from 'sequelize';
import { WidgetComponent } from '../model/WidgetComponent';
import { getLogger } from '@fjell/logging';

const logger = getLogger('WidgetComponentLib');

/**
 * Create and configure the WidgetComponent library
 */
export const createWidgetComponentLibrary = (
  registry: Registry,
  widgetComponentModel: ModelStatic<any>,
  widgetModel: ModelStatic<any>
) => {
  logger.info('Creating WidgetComponent library...');

  const library = createSequelizeLibrary<WidgetComponent, 'widgetComponent', 'widget'>(
    registry as any,
    { kta: ['widgetComponent', 'widget'], scopes: [] },
    [widgetComponentModel, widgetModel],
    {
      references: [],
      aggregations: [],
      deleteOnRemove: true,
      validators: {
        onCreate: async (component: any) => {
          // Validate widget ID
          if (!component.widgetId || component.widgetId.trim().length === 0) {
            throw new Error('Widget ID is required');
          }

          // Validate that the widget exists
          const widget = await widgetModel.findByPk(component.widgetId);
          if (!widget) {
            throw new Error(`Widget with ID ${component.widgetId} does not exist`);
          }

          // Validate name
          if (!component.name || component.name.trim().length === 0) {
            throw new Error('Component name is required');
          }
          if (component.name.length > 255) {
            throw new Error('Component name must be 255 characters or less');
          }

          // Validate componentTypeId
          if (!component.componentTypeId || component.componentTypeId.trim().length === 0) {
            throw new Error('Component type ID is required');
          }

          // Validate priority
          if (typeof component.priority !== 'undefined') {
            if (component.priority < 0 || component.priority > 100) {
              throw new Error('Priority must be between 0 and 100');
            }
          }

          // Validate config if provided
          if (component.config !== null && typeof component.config !== 'undefined') {
            try {
              JSON.stringify(component.config);
            } catch {
              throw new Error('Component config must be a valid JSON object');
            }
          }

          return true;
        }
      },
      hooks: {
        preCreate: async (component: any) => {
          logger.info('Creating widget component', {
            name: component.name,
            widgetId: component.widgetId,
            componentTypeId: component.componentTypeId
          });

          // Normalize name
          component.name = component.name.trim();

          // Set default values
          if (typeof component.status === 'undefined') {
            component.status = 'pending';
          }
          if (typeof component.priority === 'undefined') {
            component.priority = 0;
          }

          return component;
        },
      },
      finders: {
        // Find components by widget ID
        byWidget: async (params: any) => {
          logger.info('Finding components by widget', { widgetId: params.widgetId });
          const results = await widgetComponentModel.findAll({
            where: { widgetId: params.widgetId },
            order: [['priority', 'DESC'], ['createdAt', 'ASC']]
          });
          return results;
        },

        // Find components by status
        byStatus: async (params: any) => {
          logger.info('Finding components by status', { status: params.status });
          const results = await widgetComponentModel.findAll({
            where: { status: params.status },
            order: [['priority', 'DESC'], ['createdAt', 'ASC']]
          });
          return results;
        },

        // Find active components (status: active)
        active: async () => {
          logger.info('Finding active components');
          const results = await widgetComponentModel.findAll({
            where: { status: 'active' },
            order: [['priority', 'DESC'], ['createdAt', 'ASC']]
          });
          return results;
        },

        // Find components by component type
        byComponentType: async (params: any) => {
          logger.info('Finding components by type', { componentTypeId: params.componentTypeId });
          const results = await widgetComponentModel.findAll({
            where: { componentTypeId: params.componentTypeId },
            order: [['priority', 'DESC'], ['createdAt', 'ASC']]
          });
          return results;
        },
      },
    }
  );

  logger.info('WidgetComponent library created successfully');
  return library;
};

