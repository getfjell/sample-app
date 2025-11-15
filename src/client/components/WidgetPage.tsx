"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useWidget, useWidgets } from '../providers/WidgetProvider';
import { useWidgetTypes } from '../providers/WidgetTypeProvider';
import type { Widget } from '../../model/Widget';

interface WidgetPageProps {
  widgetId?: string;
}

export const WidgetPage: React.FC<WidgetPageProps> = ({ widgetId }) => {
  const router = useRouter();
  const { item: widget, isLoading: loading } = useWidget();
  const { items: widgetTypes } = useWidgetTypes();
  const [error, setError] = useState<string | null>(null);

  const formatData = (data: any) => {
    if (!data) return 'No data';
    return JSON.stringify(data, null, 2);
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString();
  };

  const getWidgetTypeName = () => {
    if (!widget) return '';
    const widgetType = widgetTypes.find(wt => wt.id === widget.widgetTypeId);
    return widgetType ? `${widgetType.name} (${widgetType.code})` : widget.widgetTypeId;
  };

  const handleBack = () => {
    router.push('/');
  };

  if (loading) {
    return (
      <div className="widget-page">
        <div className="widget-page-header">
          <button className="btn btn-secondary" onClick={handleBack}>
            ← Back to Widgets
          </button>
        </div>
        <div className="loading">Loading widget...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="widget-page">
        <div className="widget-page-header">
          <button className="btn btn-secondary" onClick={handleBack}>
            ← Back to Widgets
          </button>
        </div>
        <div className="error">
          Error: {error}
        </div>
      </div>
    );
  }

  if (!widget) {
    return (
      <div className="widget-page">
        <div className="widget-page-header">
          <button className="btn btn-secondary" onClick={handleBack}>
            ← Back to Widgets
          </button>
        </div>
        <div className="error">
          Widget not found
        </div>
      </div>
    );
  }

  return (
    <div className="widget-page">
      <div className="widget-page-header">
        <button className="btn btn-secondary" onClick={handleBack}>
          ← Back to Widgets
        </button>
        <h1>Widget Details</h1>
      </div>

      <div className="widget-detail-container">
        <div className={`widget-detail-card ${!widget.isActive ? 'inactive' : ''}`}>
          <div className="widget-header">
            <div className="widget-title-section">
              <h2 className="widget-name">{widget.name}</h2>
              <div className="widget-status">
                <span className={`status-badge ${widget.isActive ? 'active' : 'inactive'}`}>
                  {widget.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>

          {widget.description && (
            <div className="widget-section">
              <h3>Description</h3>
              <p className="widget-description">{widget.description}</p>
            </div>
          )}

          <div className="widget-section">
            <h3>Details</h3>
            <div className="detail-grid">
              <div className="detail-row">
                <span className="label">ID:</span>
                <span className="value">{widget.id}</span>
              </div>
              <div className="detail-row">
                <span className="label">Widget Type:</span>
                <span className="value">{getWidgetTypeName()}</span>
              </div>
              <div className="detail-row">
                <span className="label">Status:</span>
                <span className="value">{widget.isActive ? 'Active' : 'Inactive'}</span>
              </div>
              {widget.createdAt && (
                <div className="detail-row">
                  <span className="label">Created:</span>
                  <span className="value">{formatDate(widget.createdAt)}</span>
                </div>
              )}
              {widget.updatedAt && (
                <div className="detail-row">
                  <span className="label">Updated:</span>
                  <span className="value">{formatDate(widget.updatedAt)}</span>
                </div>
              )}
            </div>
          </div>

          {widget.data && (
            <div className="widget-section">
              <h3>Data</h3>
              <div className="widget-data-container">
                <pre className="data-display">{formatData(widget.data)}</pre>
              </div>
            </div>
          )}

          <div className="widget-actions">
            <button
              className="btn btn-primary"
              onClick={() => {
                // Could implement edit functionality here
                alert('Edit functionality not implemented yet');
              }}
            >
              Edit Widget
            </button>
            {widget.isActive && (
              <button
                className="btn btn-danger"
                onClick={() => {
                  // Could implement delete functionality here
                  if (window.confirm(`Are you sure you want to delete "${widget.name}"?`)) {
                    alert('Delete functionality not implemented yet');
                  }
                }}
              >
                Delete Widget
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
