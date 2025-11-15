"use client";

import React, { createContext } from "react";

import {
  PItem,
  PItemAdapter,
  PItemLoad,
  PItemQuery,
  PItems,
  PItemsQuery,
} from "@fjell/providers";
import { IQFactory, ItemQuery, PriKey } from "@fjell/core";
import { WidgetComponent } from "../../model/WidgetComponent";
import { getWidgetComponentCacheSync } from "../cache/ClientCache";

export const WidgetComponentAdapterContext =
  createContext<PItemAdapter.ContextType<WidgetComponent, "widgetComponent", "widget"> | undefined>(undefined);

export const useWidgetComponentAdapter = () => PItemAdapter.usePItemAdapter<
  WidgetComponent,
  "widgetComponent",
  "widget"
>(WidgetComponentAdapterContext, 'WidgetComponentAdapterContext');

export const WidgetComponentAdapter: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  // Get cache instance synchronously (CacheInitializer has already initialized it)
  const widgetComponentCache = getWidgetComponentCacheSync();

  // Create a typed version of the Adapter component
  const TypedAdapter = PItemAdapter.Adapter as any;

  return (
    <TypedAdapter
      name='WidgetComponentAdapter'
      cache={widgetComponentCache}
      context={WidgetComponentAdapterContext}
    >
      {children}
    </TypedAdapter>
  );
}

export const WidgetComponentContext =
  createContext<PItem.ContextType<WidgetComponent, 'widgetComponent', 'widget'> | undefined>(undefined);

export const useWidgetComponent = () =>
  PItem.usePItem<WidgetComponent, 'widgetComponent', 'widget'>(WidgetComponentContext, 'WidgetComponentContext');

export const WidgetComponentLoad: React.FC<{
  ik: PriKey<'widgetComponent', 'widget'>;
  children: React.ReactNode;
}> = (
  { ik, children }: {
    ik: PriKey<'widgetComponent', 'widget'>;
    children: React.ReactNode;
  }
) => PItemLoad<
  WidgetComponent,
  "widgetComponent",
  "widget"
>({
  name: 'WidgetComponentLoad',
  ik,
  adapter: WidgetComponentAdapterContext,
  context: WidgetComponentContext,
  contextName: 'WidgetComponentContext',
  children,
});

export type WidgetComponentsContextType =
  PItems.ContextType<WidgetComponent, 'widgetComponent', 'widget'>;

export const WidgetComponentsContext =
  createContext<WidgetComponentsContextType | undefined>(undefined);

export const useWidgetComponents = () =>
  PItems.usePItems<WidgetComponent, 'widgetComponent', 'widget'>(WidgetComponentsContext, 'WidgetComponentsContext') as WidgetComponentsContextType;

export const WidgetComponentsQuery: React.FC<{
  iq: ItemQuery<WidgetComponent, 'widgetComponent', 'widget'>;
  children: React.ReactNode;
}> = ({
  iq,
  children
}: {
  iq: ItemQuery<WidgetComponent, 'widgetComponent', 'widget'>;
  children: React.ReactNode;
}) => PItemsQuery<WidgetComponent, 'widgetComponent', 'widget'>({
  name: 'WidgetComponentsQuery',
  iq,
  adapter: WidgetComponentAdapterContext,
  context: WidgetComponentsContext,
  contextName: 'WidgetComponentsContext',
  children
});

export const WidgetComponentIQ = new IQFactory<WidgetComponent, 'widgetComponent', 'widget'>();

// Hook to create widget component queries
export const useWidgetComponentQuery = () => {
  const adapter = useWidgetComponentAdapter();
  
  return {
    /**
     * Query all components
     */
    all: () => WidgetComponentIQ.all(),
    
    /**
     * Query components by widget ID
     */
    byWidget: (widgetId: string) =>
      WidgetComponentIQ.custom({
        location: [{ kt: 'widget', lk: widgetId }],
        params: {
          finder: 'byWidget',
          finderParams: { widgetId }
        }
      }),
    
    /**
     * Query components by status
     */
    byStatus: (status: 'pending' | 'active' | 'complete') =>
      WidgetComponentIQ.custom({
        params: {
          finder: 'byStatus',
          finderParams: { status }
        }
      }),
    
    /**
     * Query active components
     */
    active: () =>
      WidgetComponentIQ.custom({
        params: {
          finder: 'active'
        }
      }),
    
    /**
     * Query components by component type
     */
    byComponentType: (componentTypeId: string) =>
      WidgetComponentIQ.custom({
        params: {
          finder: 'byComponentType',
          finderParams: { componentTypeId }
        }
      }),
  };
};

