import { createRegistry } from '@fjell/registry';
import { getLogger } from '@fjell/logging';
import { Database } from '../database';
import { createWidgetLibrary } from './WidgetLib';
import { createWidgetTypeLibrary } from './WidgetTypeLib';
import { createWidgetComponentLibrary } from './WidgetComponentLib';

const logger = getLogger('LibRegistry');

/**
 * Initialize and configure the fjell library registry with all models
 */
export const initializeLibraryRegistry = async (database: Database) => {
  logger.info('Initializing library registry...');

  // Create the main registry
  const registry = createRegistry('sample-app');

  // Get the database models
  const { WidgetModel, WidgetTypeModel, WidgetComponentModel } = database.getModels();

  // Create and register the WidgetType library
  logger.info('Registering WidgetType library...');
  const widgetTypeLibrary = createWidgetTypeLibrary(registry, WidgetTypeModel);
  registry.register(['widgetType'], widgetTypeLibrary);

  // Create and register the Widget library
  logger.info('Registering Widget library...');
  const widgetLibrary = createWidgetLibrary(registry, WidgetModel, WidgetTypeModel);
  registry.register(['widget'], widgetLibrary);

  // Create and register the WidgetComponent library
  logger.info('Registering WidgetComponent library...');
  const widgetComponentLibrary = createWidgetComponentLibrary(registry, WidgetComponentModel, WidgetModel);
  registry.register(['widgetComponent', 'widget'], widgetComponentLibrary);

  logger.info('Library registry initialization completed', {
    libraries: {
      widgetType: !!widgetTypeLibrary,
      widget: !!widgetLibrary,
      widgetComponent: !!widgetComponentLibrary
    }
  });

  return {
    registry,
    libraries: {
      widgetType: widgetTypeLibrary,
      widget: widgetLibrary,
      widgetComponent: widgetComponentLibrary
    }
  };
};

// Re-export library creation functions for direct use if needed
export { createWidgetLibrary } from './WidgetLib';
export { createWidgetTypeLibrary } from './WidgetTypeLib';
export { createWidgetComponentLibrary } from './WidgetComponentLib';
