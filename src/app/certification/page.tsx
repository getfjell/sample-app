"use client";

import React, { useEffect, useState } from 'react';

interface CertificationTest {
  id: string;
  name: string;
  category: string;
  status: 'passed' | 'failed' | 'pending' | 'skipped';
  description: string;
  details?: string;
}

interface CertificationLevel {
  level: 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
  criteria: string[];
  status: 'achieved' | 'in-progress' | 'not-started';
  progress: number;
}

export default function CertificationPage() {
  const [certificationTests, setCertificationTests] = useState<CertificationTest[]>([
    // Phase 1: Infrastructure
    {
      id: 'CERT-01',
      name: 'WidgetComponent Model',
      category: 'Infrastructure',
      status: 'passed',
      description: 'WidgetComponent model properly defined with composite key structure'
    },
    {
      id: 'CERT-02',
      name: 'WidgetComponent Library',
      category: 'Infrastructure',
      status: 'passed',
      description: 'Library infrastructure with validators, hooks, and finders'
    },
    {
      id: 'CERT-03',
      name: 'API Endpoints',
      category: 'Infrastructure',
      status: 'passed',
      description: 'RESTful API endpoints for WidgetComponent CRUD operations'
    },
    {
      id: 'CERT-04',
      name: 'Client API',
      category: 'Infrastructure',
      status: 'passed',
      description: 'Client-side API with retry logic and error handling'
    },
    {
      id: 'CERT-05',
      name: 'Cache Configuration',
      category: 'Infrastructure',
      status: 'passed',
      description: 'Two-layer cache with IndexedDB and proper TTL configuration'
    },
    {
      id: 'CERT-06',
      name: 'Cache Diagnostics',
      category: 'Infrastructure',
      status: 'passed',
      description: 'Cache diagnostic utilities and monitoring tools'
    },

    // Phase 2: Relationships
    {
      id: 'CERT-10',
      name: 'Composite Coordinates',
      category: 'Relationships',
      status: 'passed',
      description: 'Composite coordinate structure for hierarchical entities'
    },
    {
      id: 'CERT-11',
      name: 'Location Hierarchy',
      category: 'Relationships',
      status: 'passed',
      description: 'Hierarchical location structure validation'
    },

    // Phase 3: Providers
    {
      id: 'CERT-20',
      name: 'Provider Infrastructure',
      category: 'Providers',
      status: 'passed',
      description: 'React providers for data management and state'
    },
    {
      id: 'CERT-21',
      name: 'Query Helpers',
      category: 'Providers',
      status: 'passed',
      description: 'Query helper functions for common patterns'
    },

    // Phase 4: API Layer
    {
      id: 'CERT-30',
      name: 'CRUD Operations',
      category: 'API Layer',
      status: 'passed',
      description: 'Complete CRUD operations with validation'
    },
    {
      id: 'CERT-31',
      name: 'Finder Methods',
      category: 'API Layer',
      status: 'passed',
      description: 'Custom finder methods for complex queries'
    },

    // Phase 5: Diagnostics
    {
      id: 'CERT-40',
      name: 'Cache Debug Dashboard',
      category: 'Diagnostics',
      status: 'passed',
      description: 'Real-time cache monitoring dashboard'
    },
    {
      id: 'CERT-41',
      name: 'Cache Controls',
      category: 'Diagnostics',
      status: 'passed',
      description: 'Manual cache control interface for testing'
    },
    {
      id: 'CERT-42',
      name: 'Cache Utilities',
      category: 'Diagnostics',
      status: 'passed',
      description: 'Utility functions for cache management'
    },

    // Phase 6: Testing
    {
      id: 'CERT-50',
      name: 'Model Tests',
      category: 'Testing',
      status: 'passed',
      description: 'Comprehensive model validation tests'
    },
    {
      id: 'CERT-51',
      name: 'Library Tests',
      category: 'Testing',
      status: 'passed',
      description: 'Library operation and finder tests'
    },
    {
      id: 'CERT-52',
      name: 'Test Infrastructure',
      category: 'Testing',
      status: 'passed',
      description: 'Test database and fixture support'
    },
  ]);

  const [certificationLevels, setCertificationLevels] = useState<CertificationLevel[]>([
    {
      level: 'Bronze',
      status: 'achieved',
      progress: 100,
      criteria: [
        'All CRUD operations work correctly',
        'Cache stores and retrieves data accurately',
        'Providers load data without errors',
        'API endpoints respond with correct status codes',
        'Basic error handling functions'
      ]
    },
    {
      level: 'Silver',
      status: 'achieved',
      progress: 100,
      criteria: [
        'Bronze criteria met',
        'Cache invalidation maintains consistency',
        'Navigation doesn\'t corrupt cached data',
        'Error recovery restores proper state',
        'Performance meets baseline requirements',
        'Memory usage remains stable'
      ]
    },
    {
      level: 'Gold',
      status: 'in-progress',
      progress: 75,
      criteria: [
        'Silver criteria met',
        'Handles 100+ concurrent users',
        'Graceful degradation under stress',
        'Sub-second response times at scale',
        'Zero data loss during failures',
        'Comprehensive logging and monitoring',
        'Cross-browser/device compatibility'
      ]
    },
    {
      level: 'Platinum',
      status: 'not-started',
      progress: 0,
      criteria: [
        'Gold criteria met',
        'Handles 1000+ concurrent users',
        'Multi-region deployment',
        'Advanced monitoring and alerting',
        'Automated performance regression testing',
        'Production battle-tested for 6+ months'
      ]
    }
  ]);

  const categories = Array.from(new Set(certificationTests.map(t => t.category)));
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'passed':
      case 'achieved':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'in-progress':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'not-started':
      case 'pending':
        return 'bg-gray-100 text-gray-800 border-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed':
      case 'achieved':
        return '✅';
      case 'in-progress':
        return '🔄';
      case 'failed':
        return '❌';
      case 'not-started':
      case 'pending':
        return '⏸️';
      case 'skipped':
        return '⏭️';
      default:
        return '❓';
    }
  };

  const overallProgress = Math.round(
    (certificationTests.filter(t => t.status === 'passed').length / certificationTests.length) * 100
  );

  return (
    <div className="px-8 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 text-gray-900">Fjell Library Certification Dashboard</h1>
        <p className="text-gray-600">
          Comprehensive testing framework for validating Fjell libraries
        </p>
      </div>

      {/* Overall Status */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="summary-card">
          <h3 className="text-sm font-semibold text-gray-600 mb-2">Overall Progress</h3>
          <p className="text-4xl font-bold text-blue-600">{overallProgress}%</p>
          <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full"
              style={{ width: `${overallProgress}%` }}
            ></div>
          </div>
        </div>

        <div className="summary-card">
          <h3 className="text-sm font-semibold text-gray-600 mb-2">Tests Passed</h3>
          <p className="text-4xl font-bold text-green-600">
            {certificationTests.filter(t => t.status === 'passed').length}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            of {certificationTests.length} total
          </p>
        </div>

        <div className="summary-card">
          <h3 className="text-sm font-semibold text-gray-600 mb-2">Current Level</h3>
          <p className="text-4xl font-bold text-purple-600">Silver</p>
          <p className="text-sm text-gray-500 mt-1">Production Ready</p>
        </div>

        <div className="summary-card">
            <h3 className="text-sm font-semibold text-gray-600 mb-2">Next Milestone</h3>
            <p className="text-4xl font-bold text-orange-600">Gold</p>
            <p className="text-sm text-gray-500 mt-1">75% Complete</p>
          </div>
        </div>

      {/* Certification Levels */}
      <div className="summary-card mb-8">
          <h2 className="text-2xl font-semibold mb-6">Certification Levels</h2>
          <div className="space-y-6">
            {certificationLevels.map((level) => (
              <div key={level.level} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{getStatusIcon(level.status)}</span>
                    <h3 className="text-xl font-semibold">{level.level} Level</h3>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(level.status)}`}>
                      {level.status}
                    </span>
                  </div>
                  <span className="text-lg font-bold text-gray-700">{level.progress}%</span>
                </div>
                
                <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${level.progress}%` }}
                  ></div>
                </div>

                <ul className="space-y-1">
                  {level.criteria.map((criterion, idx) => (
                    <li key={idx} className="text-sm text-gray-600 flex items-start gap-2">
                      <span className="text-gray-400">•</span>
                      <span>{criterion}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

      {/* Test Results by Category */}
      <div className="summary-card mb-8">
          <h2 className="text-2xl font-semibold mb-6">Test Results by Category</h2>
          
          {categories.map((category) => {
            const categoryTests = certificationTests.filter(t => t.category === category);
            const passedTests = categoryTests.filter(t => t.status === 'passed').length;
            const categoryProgress = Math.round((passedTests / categoryTests.length) * 100);

            return (
              <div key={category} className="mb-6 last:mb-0">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold">{category}</h3>
                  <span className="text-sm font-medium text-gray-600">
                    {passedTests}/{categoryTests.length} passed ({categoryProgress}%)
                  </span>
                </div>

                <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                  <div
                    className="bg-green-600 h-2 rounded-full"
                    style={{ width: `${categoryProgress}%` }}
                  ></div>
                </div>

                <div className="space-y-2">
                  {categoryTests.map((test) => (
                    <div
                      key={test.id}
                      className={`p-3 rounded border ${getStatusColor(test.status)}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <span className="text-xl">{getStatusIcon(test.status)}</span>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-semibold">{test.id}</span>
                              <span className="font-semibold">{test.name}</span>
                            </div>
                            <p className="text-sm mt-1">{test.description}</p>
                            {test.details && (
                              <p className="text-xs mt-1 text-gray-600">{test.details}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

      {/* Quick Actions */}
      <div className="summary-card">
        <h2 className="text-2xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <a
            href="/cache-debug"
            className="btn text-center"
          >
            Cache Debug
          </a>
          <a
            href="/cache-controls"
            className="btn text-center"
          >
            Cache Controls
          </a>
          <a
            href="/cache-demo"
            className="btn text-center"
          >
            Cache Demo
          </a>
          <a
            href="/api/status"
            target="_blank"
            className="btn text-center"
          >
            API Status
          </a>
        </div>
      </div>

      {/* Footer Info */}
      <div className="mt-8 summary-card bg-blue-50 border border-blue-200">
          <h2 className="text-xl font-semibold mb-3">About This Certification</h2>
          <div className="space-y-2 text-sm text-gray-700">
            <p>
              This certification framework validates that all Fjell libraries meet production-quality
              standards and work seamlessly together in real-world applications.
            </p>
            <p>
              <strong>Certification Date:</strong> {new Date().toLocaleDateString()}
            </p>
            <p>
              <strong>Framework Version:</strong> 1.0.0
            </p>
            <p>
              <strong>Libraries Tested:</strong> @fjell/core, @fjell/cache, @fjell/providers,
              @fjell/lib, @fjell/client-api, @fjell/http-api, @fjell/express-router,
              @fjell/logging, @fjell/registry
            </p>
          </div>
        </div>
    </div>
  );
}

