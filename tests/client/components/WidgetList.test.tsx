// @vitest-environment jsdom

import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

import { WidgetList } from '../../../src/client/components/WidgetList';
import { useWidgets } from '../../../src/client/providers/WidgetProvider';
import { TestFixtures } from '../../helpers/testFixtures';

// Mock Next.js router
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn()
  })
}));

// Mock WidgetTypeProvider for WidgetCard
const mockWidgetTypes = [
  { id: 'type1', name: 'Basic Widget', code: 'BASIC' },
  { id: 'type2', name: 'Advanced Widget', code: 'ADV' }
];

vi.mock('../../../src/client/providers/WidgetTypeProvider', () => ({
  useWidgetTypes: () => ({
    items: mockWidgetTypes,
    loading: false,
    error: null
  })
}));

// Mock provider hooks
vi.mock('../../../src/client/providers/WidgetProvider', () => ({
  useWidgets: vi.fn()
}));

describe('WidgetList', () => {
  const mockUseWidgets = useWidgets as unknown as ReturnType<typeof vi.fn>;

  const activeWidget = TestFixtures.createCompleteWidget('wt-1', {
    id: 'w-1',
    name: 'Active Widget',
    isActive: true
  });

  const inactiveWidget = TestFixtures.createCompleteWidget('wt-1', {
    id: 'w-2',
    name: 'Inactive Widget',
    isActive: false
  });

  const defaultContext = {
    name: 'test',
    items: [activeWidget, inactiveWidget],
    isLoading: false,
    isCreating: false,
    isUpdating: false,
    isRemoving: false,
    facetResults: {},
    pkTypes: [],
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
    all: vi.fn(),
    one: vi.fn(),
    allAction: vi.fn(),
    allFacet: vi.fn(),
    find: vi.fn(),
    findOne: vi.fn(),
    set: vi.fn(),
    action: vi.fn(),
    facet: vi.fn()
  };

  const renderList = () =>
    render(
      <WidgetList />
    );

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseWidgets.mockReturnValue(defaultContext);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Loading and Error States', () => {
    it('shows loading state', () => {
      mockUseWidgets.mockReturnValue({ ...defaultContext, isLoading: true });
      renderList();
      expect(screen.getByText('Loading widgets...')).toBeInTheDocument();
    });

    it.skip('shows error with retry button', () => {
      // TODO: Component doesn't currently handle error states
    });
  });

  describe('Summary', () => {
    it('shows calculated summary stats', async () => {
      renderList();
      await waitFor(() => {
        expect(screen.getByText('Summary')).toBeInTheDocument();

        const summary = screen.getByText('Summary').closest('.summary-card') as HTMLElement;

        const totalStat = within(summary).getByText('Total').closest('.stat') as HTMLElement;
        expect(within(totalStat).getByText('2')).toBeInTheDocument();

        const activeStat = within(summary)
          .getByText('Active', { selector: '.stat-label' })
          .closest('.stat') as HTMLElement;
        expect(within(activeStat).getByText('1')).toBeInTheDocument();

        const inactiveStat = within(summary).getByText('Inactive').closest('.stat') as HTMLElement;
        expect(within(inactiveStat).getByText('1')).toBeInTheDocument();

        const rateStat = within(summary).getByText('Active Rate').closest('.stat') as HTMLElement;
        expect(within(rateStat).getByText(/50\s*%/)).toBeInTheDocument();
      });
    });
  });

  describe('Filtering and Empty States', () => {
    it('shows only active widgets by default', async () => {
      renderList();
      // Only the active widget card should be present
      await waitFor(() => {
        expect(screen.getByText('Active Widget')).toBeInTheDocument();
        expect(screen.queryByText('Inactive Widget')).not.toBeInTheDocument();
      });
    });

    it('shows inactive when toggled', async () => {
      renderList();
      const checkbox = screen.getByLabelText('Show inactive widgets') as HTMLInputElement;
      expect(checkbox.checked).toBe(false);
      fireEvent.click(checkbox);

      await waitFor(() => {
        expect(screen.getByText('Inactive Widget')).toBeInTheDocument();
      });
    });

    it('shows empty active message when no active widgets', () => {
      const allInactive = [
        { ...inactiveWidget, id: 'w-3', name: 'Inactive A' },
        { ...inactiveWidget, id: 'w-4', name: 'Inactive B' }
      ];
      mockUseWidgets.mockReturnValue({ ...defaultContext, items: allInactive });

      renderList();
      expect(
        screen.getByText('No active widgets found. Try showing inactive widgets.')
      ).toBeInTheDocument();
    });

    it('shows generic empty message when showing inactive and list is empty', () => {
      mockUseWidgets.mockReturnValue({ ...defaultContext, items: [] });
      renderList();

      const checkbox = screen.getByLabelText('Show inactive widgets');
      fireEvent.click(checkbox);

      expect(screen.getByText('No widgets found.')).toBeInTheDocument();
    });
  });

  describe('Actions', () => {
    it.skip('invokes refresh when Refresh button clicked', () => {
      // TODO: Component doesn't currently implement refresh functionality
    });

    it('confirms and deletes widget on Delete', async () => {
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
      const remove = vi.fn().mockResolvedValue(undefined);
      mockUseWidgets.mockReturnValue({ ...defaultContext, remove });

      renderList();

      // Only the active widget renders a Delete button
      const row = screen.getByText('Active Widget').closest('tr') as HTMLElement;
      expect(row).not.toBeNull();
      const deleteButton = within(row).getByText('Delete');
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(confirmSpy).toHaveBeenCalledWith('Are you sure you want to delete "Active Widget"?');
        expect(remove).toHaveBeenCalledWith(activeWidget.key);
      });

      confirmSpy.mockRestore();
    });

    it('does not delete when user cancels', () => {
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
      const remove = vi.fn();
      mockUseWidgets.mockReturnValue({ ...defaultContext, remove });

      renderList();
      const row = screen.getByText('Active Widget').closest('tr') as HTMLElement;
      expect(row).not.toBeNull();
      fireEvent.click(within(row).getByText('Delete'));

      expect(confirmSpy).toHaveBeenCalled();
      expect(remove).not.toHaveBeenCalled();
      confirmSpy.mockRestore();
    });

    it('alerts on delete failure', async () => {
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => { });
      const remove = vi.fn().mockRejectedValue(new Error('fail'));
      mockUseWidgets.mockReturnValue({ ...defaultContext, remove });

      renderList();
      const row = screen.getByText('Active Widget').closest('tr') as HTMLElement;
      expect(row).not.toBeNull();
      fireEvent.click(within(row).getByText('Delete'));

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith('Failed to delete widget. Please try again.');
      });

      confirmSpy.mockRestore();
      alertSpy.mockRestore();
    });
  });
});
