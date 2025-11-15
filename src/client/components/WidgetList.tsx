"use client";

import React, { useEffect, useState } from 'react';
import { useWidgets } from '../providers/WidgetProvider';
import { useWidgetTypes } from '../providers/WidgetTypeProvider';
import type { Widget } from '../../model/Widget';
import type { WidgetSummary } from '../api/WidgetAPI';
import { useRouter } from 'next/navigation';

export const WidgetList: React.FC = () => {
  const { items: widgets, isLoading: loading, remove: deleteWidget } = useWidgets();
  const { items: widgetTypes } = useWidgetTypes();
  const [summary, setSummary] = useState<WidgetSummary | null>(null);
  const [showInactive, setShowInactive] = useState(false);
  const router = useRouter();

  // Load summary data
  useEffect(() => {
    const loadSummary = async () => {
      try {
        // Calculate summary from widgets data
        const active = widgets.filter(w => w.isActive).length;
        const total = widgets.length;
        const inactive = total - active;
        const activePercentage = total > 0 ? Math.round((active / total) * 100) : 0;

        setSummary({
          total,
          active,
          inactive,
          activePercentage
        });
      } catch (error) {
        console.error('Failed to calculate summary:', error);
      }
    };

    loadSummary();
  }, [widgets]);

  const handleDelete = async (widget: Widget) => {
    if (window.confirm(`Are you sure you want to delete "${widget.name}"?`)) {
      try {
        await deleteWidget(widget.key);
      } catch (error) {
        console.error('Failed to delete widget:', error);
        alert('Failed to delete widget. Please try again.');
      }
    }
  };

  // Sort widgets by creation date (newest first) and filter by active status
  const filteredWidgets = widgets
    .filter(widget => showInactive || widget.isActive)
    .sort((a, b) => {
      // Sort by creation date descending (newest first)
      const dateA = new Date(a.createdAt || a.events.created.at);
      const dateB = new Date(b.createdAt || b.events.created.at);
      return dateB.getTime() - dateA.getTime();
    });

  // Helper functions
  const formatDate = (date: string | Date | undefined) => {
    if (!date) return 'Unknown';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatData = (data: any) => {
    if (!data) return 'No data';
    const jsonStr = JSON.stringify(data);
    return jsonStr.length > 50 ? jsonStr.substring(0, 47) + '...' : jsonStr;
  };

  const getWidgetTypeName = (widgetTypeId: string) => {
    const widgetType = widgetTypes.find(wt => wt.id === widgetTypeId);
    return widgetType ? `${widgetType.name} (${widgetType.code})` : widgetTypeId;
  };

  const handleRowClick = (widget: Widget) => {
    router.push(`/widget/${widget.id}`);
  };

  if (loading) {
    return (
      <div className="widget-list-container">
        <div className="loading">Loading widgets...</div>
      </div>
    );
  }

  return (
    <div className="widget-list-container">
      <div className="widget-list-header">
        <h2>Widgets</h2>
        <small style={{ color: '#666', marginLeft: '10px' }}>
          (Using IndexedDB Cache)
        </small>
        <div className="widget-controls">
          <button
            className="btn btn-secondary"
            onClick={() => { }}
          >
            Refresh
          </button>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
            />
            Show inactive widgets
          </label>
        </div>
      </div>

      {summary && (
        <div className="widget-summary">
          <div className="summary-card">
            <h3>Summary</h3>
            <div className="summary-stats">
              <div className="stat">
                <span className="stat-value">{summary.total}</span>
                <span className="stat-label">Total</span>
              </div>
              <div className="stat">
                <span className="stat-value">{summary.active}</span>
                <span className="stat-label">Active</span>
              </div>
              <div className="stat">
                <span className="stat-value">{summary.inactive}</span>
                <span className="stat-label">Inactive</span>
              </div>
              <div className="stat">
                <span className="stat-value">{summary.activePercentage}%</span>
                <span className="stat-label">Active Rate</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="widget-table-container">
        {filteredWidgets.length === 0 ? (
          <div className="no-widgets">
            {showInactive
              ? 'No widgets found.'
              : 'No active widgets found. Try showing inactive widgets.'
            }
          </div>
        ) : (
          <div className="table-responsive">
            <table className="widget-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Updated</th>
                  <th>Data</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredWidgets.map(widget => (
                  <tr
                    key={widget.id}
                    className={`widget-row ${!widget.isActive ? 'inactive' : ''}`}
                    onClick={() => handleRowClick(widget)}
                  >
                    <td className="widget-name">
                      <div>
                        <strong>{widget.name}</strong>
                        {widget.description && (
                          <div className="widget-description">{widget.description}</div>
                        )}
                      </div>
                    </td>
                    <td className="widget-type">
                      <span className="type-badge">
                        {getWidgetTypeName(widget.widgetTypeId)}
                      </span>
                    </td>
                    <td className="widget-status">
                      <span className={`status-badge ${widget.isActive ? 'active' : 'inactive'}`}>
                        {widget.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="widget-date">
                      {formatDate(widget.createdAt || widget.events.created.at)}
                    </td>
                    <td className="widget-date">
                      {formatDate(widget.updatedAt || widget.events.updated.at)}
                    </td>
                    <td className="widget-data">
                      <code className="data-preview">
                        {formatData(widget.data)}
                      </code>
                    </td>
                    <td className="widget-actions">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(widget);
                        }}
                        className="btn btn-danger"
                        title={`Delete ${widget.name}`}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
