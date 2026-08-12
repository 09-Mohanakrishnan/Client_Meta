import React, { useState } from 'react';
import ColumnManager from '../components/ColumnManager';

const ColumnConfigPage = () => {
  const [activeTab, setActiveTab] = useState('campaign');

  const tabs = [
    { key: 'campaign', label: 'Campaign Columns' },
    { key: 'adset', label: 'Ad Set Columns' },
    { key: 'ad', label: 'Ad Columns' },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-lg font-bold text-gray-900">Column Configuration Manager</h1>
        <p className="text-xs text-gray-500 mt-0.5">
          Configure default and dynamic field types, reorder position layout, and toggle visibility options.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 bg-white rounded-t-lg shadow-sm px-4">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`py-3.5 px-5 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all ${
              activeTab === tab.key
                ? 'border-blue-600 text-blue-600 font-bold'
                : 'border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Active Editor Panel */}
      <div className="min-h-[400px]">
        <ColumnManager entityType={activeTab} />
      </div>
    </div>
  );
};

export default ColumnConfigPage;
