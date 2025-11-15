import { createSequelizeLibrary } from '@fjell/lib-sequelize';
import { Registry } from '@fjell/registry';
import { PriKey } from '@fjell/core';
import { ModelStatic } from 'sequelize';
import { Widget, WidgetProperties } from '../model/Widget';
import { getLogger } from '@fjell/logging';

const logger = getLogger('WidgetLib');

/**
 * Create and configure the Widget library
 */
export const createWidgetLibrary = (
  registry: Registry,
  widgetModel: ModelStatic<any>,
  widgetTypeModel: ModelStatic<any>
) => {
  logger.info('Creating Widget library...');

  const library = createSequelizeLibrary<Widget, 'widget'>(
    registry as any,
    { kta: ['widget'], scopes: [] },
    [widgetModel, widgetTypeModel],
    {
      references: [],
      aggregations: [],
      deleteOnRemove: true,  // Enable hard deletes since model doesn't have soft delete fields
      validators: {
        onCreate: async (widget: any) => {
          // Validate widget type ID
          if (!widget.widgetTypeId || widget.widgetTypeId.trim().length === 0) {
            throw new Error('Widget type ID is required');
          }

          // Validate that the widget type exists and is active
          const widgetType = await widgetTypeModel.findByPk(widget.widgetTypeId);
          if (!widgetType) {
            throw new Error(`Widget type with ID ${widget.widgetTypeId} does not exist`);
          }

          if (!widgetType.isActive) {
            throw new Error(`Widget type ${widgetType.code} is not active`);
          }

          // Validate name
          if (!widget.name || widget.name.trim().length === 0) {
            throw new Error('Widget name is required');
          }
          if (widget.name.length > 255) {
            throw new Error('Widget name must be 255 characters or less');
          }

          // Validate data if provided
          if (widget.data !== null && typeof widget.data !== 'undefined') {
            try {
              JSON.stringify(widget.data);
            } catch {
              throw new Error('Widget data must be a valid JSON object');
            }
          }

          return true;
        }
      },
      hooks: {
        preCreate: async (widget: any) => {
          logger.info('Creating widget', {
            name: widget.name,
            widgetTypeId: widget.widgetTypeId
          });

          // Normalize name
          widget.name = widget.name.trim();

          // Set default values
          if (typeof widget.isActive === 'undefined') {
            widget.isActive = true;
          }

          return widget;
        },
      },
      finders: {
        // Find only active widgets
        active: async () => {
          logger.info('Finding active widgets');
          const results = await widgetModel.findAll({
            where: { isActive: true },
            order: [['createdAt', 'DESC']]
          });
          return results;
        },

        // Find widgets by widget type ID
        byType: async (params: any) => {
          logger.info('Finding widgets by type', { widgetTypeId: params.widgetTypeId });
          const results = await widgetModel.findAll({
            where: { widgetTypeId: params.widgetTypeId },
            order: [['createdAt', 'DESC']]
          });
          return results;
        },

        // Find widgets by widget type code
        byTypeCode: async (params: any) => {
          logger.info('Finding widgets by type code', { code: params.code });

          // First find the widget type by code
          const widgetType = await widgetTypeModel.findOne({
            where: { code: params.code.toUpperCase() }
          });

          if (!widgetType) {
            logger.warning('Widget type not found by code', { code: params.code });
            return [];
          }

          // Then find widgets of that type
          const results = await widgetModel.findAll({
            where: { widgetTypeId: widgetType.id },
            order: [['createdAt', 'DESC']]
          });
          return results;
        },

        // Get all widgets (simplified version without join)
        withTypeInfo: async () => {
          logger.info('Finding all widgets (simplified)');
          const results = await widgetModel.findAll({
            order: [['createdAt', 'DESC']]
          });
          return results;
        }
      },
    }
  );

  logger.info('Widget library created successfully');
  return library;
};
