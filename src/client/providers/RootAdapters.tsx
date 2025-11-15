"use client";

import React from 'react';
import { WidgetAdapter } from './WidgetProvider';
import { WidgetTypeAdapter } from './WidgetTypeProvider';
import { CacheInitializer } from './CacheInitializer';
import { ClientOnlyProvider } from './ClientOnlyProvider';

interface RootAdaptersProps {
  children: React.ReactNode;
}

/**
 * Inner component that renders adapters only after cache initialization
 */
const CacheAdapters: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <WidgetTypeAdapter>
      <WidgetAdapter>
        {children}
      </WidgetAdapter>
    </WidgetTypeAdapter>
  );
};

/**
 * RootAdapters wraps all the fjell-providers adapters at the application root level.
 * This ensures that cache contexts are available throughout the entire application.
 * The ClientOnlyProvider prevents cache initialization during SSR.
 */
export const RootAdapters: React.FC<RootAdaptersProps> = ({ children }) => {
  return (
    <ClientOnlyProvider fallback={<div className="loading-screen">Initializing application...</div>}>
      <CacheInitializer>
        <CacheAdapters>
          {children}
        </CacheAdapters>
      </CacheInitializer>
    </ClientOnlyProvider>
  );
};
